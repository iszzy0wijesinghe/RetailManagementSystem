using System.Security.Claims;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace RetailManagementSystem.Services;

public class AuditService
{
    private readonly AppDbContext _db;
    private readonly IHttpContextAccessor _http;
    private readonly ILogger<AuditService> _logger;

    private const int MaxJsonLength = 20_000;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = false,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    public AuditService(AppDbContext db, IHttpContextAccessor http, ILogger<AuditService> logger)
    {
        _db = db;
        _http = http;
        _logger = logger;
    }

    /// <summary>
    /// Log an audit record. If userId is null, tries to resolve from the current HttpContext's ClaimsPrincipal.
    /// </summary>
    public async Task LogAsync(
        string entityName,
        object entityId,
        string action,
        long? userId = null,
        object? changes = null)
    {
        try
        {
            var uid = userId ?? GetUserId(_http.HttpContext?.User);

            string? json = null;
            if (changes is not null)
            {
                try
                {
                    json = JsonSerializer.Serialize(changes, JsonOpts);
                    if (json.Length > MaxJsonLength)
                    {
                        // truncate super long payloads so the DB write doesn’t blow up
                        json = json.Substring(0, MaxJsonLength) + "...(truncated)";
                    }
                }
                catch (Exception serEx)
                {
                    // never throw from auditing; keep a minimal marker instead
                    _logger.LogWarning(serEx, "Audit serialization failed for {Entity}/{Action}", entityName, action);
                    json = $"\"[unserializable:{serEx.GetType().Name}]\"";
                }
            }

            var log = new AuditLog
            {
                UserId = uid,
                EntityName = entityName,
                EntityId = entityId.ToString()!,
                Action = action,
                ChangesJson = json,
                OccurredAt = DateTime.UtcNow
            };

            _db.AuditLogs.Add(log);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // auditing must never break business flow
            _logger.LogError(ex, "Audit write failed for {Entity}/{Action}", entityName, action);
            // swallow on purpose
        }
    }

    private static long? GetUserId(ClaimsPrincipal? user)
    {
        if (user is null) return null;

        string? id =
            user.FindFirstValue("uid") ??
            user.FindFirstValue("userId") ??
            user.FindFirstValue(ClaimTypes.NameIdentifier) ??
            user.FindFirstValue("sub");

        return long.TryParse(id, out var v) ? v : null;
    }
}
