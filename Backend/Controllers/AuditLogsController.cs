using Microsoft.AspNetCore.Authorization;
using System.Text;
using System.Text.Json;

namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class AuditLogsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditLogsController(AppDbContext db) => _db = db;

    // GET /api/auditlogs
    [HttpGet]
    public async Task<ActionResult<PagedResult<AuditLogDto>>> GetAuditLogs(
        [FromQuery] string? entity,
        [FromQuery] long? userId,
        [FromQuery] string? action,
        [FromQuery] string? entityId,
        [FromQuery] DateTime? from,       
        [FromQuery] DateTime? to,        
        [FromQuery] string? q,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 200
    )
    {
        // Normalize/guard
        skip = Math.Max(0, skip);
        take = Math.Clamp(take, 1, 1000);

        var query = _db.AuditLogs
            .AsNoTracking()
            .OrderByDescending(a => a.OccurredAt)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(entity))
            query = query.Where(a => a.EntityName == entity);

        if (userId is not null)
            query = query.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(action))
            query = query.Where(a => a.Action == action);

        if (!string.IsNullOrWhiteSpace(entityId))
            query = query.Where(a => a.EntityId == entityId);

        if (from is not null)
            query = query.Where(a => a.OccurredAt >= from.Value);

        if (to is not null)
            query = query.Where(a => a.OccurredAt <= to.Value);

        if (!string.IsNullOrWhiteSpace(q))
        {
            // very simple full-text-ish filter across a few columns
            var qLower = q.Trim().ToLower();
            query = query.Where(a =>
                a.EntityName.ToLower().Contains(qLower) ||
                a.Action.ToLower().Contains(qLower) ||
                (a.EntityId != null && a.EntityId.ToLower().Contains(qLower)) ||
                (a.ChangesJson != null && a.ChangesJson.ToLower().Contains(qLower))
            );
        }

        var total = await query.CountAsync();

        var items = await query
            .Skip(skip)
            .Take(take)
            .Select(a => new AuditLogDto(
                a.AuditLogId,
                a.UserId,
                null, // map username if you want to join to Users table
                a.EntityName,
                a.EntityId,
                a.Action,
                a.ChangesJson,
                DateTime.SpecifyKind(a.OccurredAt, DateTimeKind.Utc)
            ))
            .ToListAsync();

        var page = (skip / take) + 1;

        return Ok(new PagedResult<AuditLogDto>(items, page, take, total));
    }

    // GET /api/auditlogs/{id}
    [HttpGet("{id:long}")]
    public async Task<ActionResult<AuditLogDto>> GetById(long id)
    {
        var a = await _db.AuditLogs.AsNoTracking().FirstOrDefaultAsync(x => x.AuditLogId == id);
        if (a is null) return NotFound();

        var dto = new AuditLogDto(
            a.AuditLogId, a.UserId, null,
            a.EntityName, a.EntityId, a.Action, a.ChangesJson,
            DateTime.SpecifyKind(a.OccurredAt, DateTimeKind.Utc)
        );

        return Ok(dto);
    }

    // GET /api/auditlogs/entities  -> distinct list for UI filters
    [HttpGet("entities")]
    public async Task<ActionResult<IReadOnlyList<string>>> GetEntities()
    {
        var names = await _db.AuditLogs
            .AsNoTracking()
            .Select(a => a.EntityName)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync();

        return Ok(names);
    }

    // GET /api/auditlogs/export  -> CSV export (same filters as list)
    [HttpGet("export")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] string? entity,
        [FromQuery] long? userId,
        [FromQuery] string? action,
        [FromQuery] string? entityId,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] string? q,
        [FromQuery] int max = 50_000
    )
    {
        max = Math.Clamp(max, 1, 200_000);

        var baseQuery = _db.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(entity)) baseQuery = baseQuery.Where(a => a.EntityName == entity);
        if (userId is not null) baseQuery = baseQuery.Where(a => a.UserId == userId);
        if (!string.IsNullOrWhiteSpace(action)) baseQuery = baseQuery.Where(a => a.Action == action);
        if (!string.IsNullOrWhiteSpace(entityId)) baseQuery = baseQuery.Where(a => a.EntityId == entityId);
        if (from is not null) baseQuery = baseQuery.Where(a => a.OccurredAt >= from.Value);
        if (to is not null) baseQuery = baseQuery.Where(a => a.OccurredAt <= to.Value);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var qLower = q.Trim().ToLower();
            baseQuery = baseQuery.Where(a =>
                a.EntityName.ToLower().Contains(qLower) ||
                a.Action.ToLower().Contains(qLower) ||
                (a.EntityId != null && a.EntityId.ToLower().Contains(qLower)) ||
                (a.ChangesJson != null && a.ChangesJson.ToLower().Contains(qLower))
            );
        }

        var rows = await baseQuery
            .OrderByDescending(a => a.OccurredAt)
            .Take(max)
            .Select(a => new
            {
                a.AuditLogId,
                a.UserId,
                a.EntityName,
                a.EntityId,
                a.Action,
                a.OccurredAt,
                a.ChangesJson
            })
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("AuditLogId,UserId,EntityName,EntityId,Action,OccurredAtUtc,ChangesJson");
        foreach (var r in rows)
        {
            // using basic CSV escaping for JSON column
            string json = r.ChangesJson ?? "";
            json = json.Replace("\"", "\"\""); // escape quotes
            sb.Append(r.AuditLogId).Append(',')
              .Append(r.UserId?.ToString() ?? "").Append(',')
              .Append(Csv(r.EntityName)).Append(',')
              .Append(Csv(r.EntityId)).Append(',')
              .Append(Csv(r.Action)).Append(',')
              .Append(r.OccurredAt.ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")).Append(',')
              .Append('"').Append(json).Append('"')
              .AppendLine();
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"audit-logs-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv");

        static string Csv(string? s)
        {
            if (string.IsNullOrEmpty(s)) return "";
            var needsQuotes = s.Contains(',') || s.Contains('"') || s.Contains('\n') || s.Contains('\r');
            var escaped = s.Replace("\"", "\"\"");
            return needsQuotes ? $"\"{escaped}\"" : escaped;
        }
    }
}
