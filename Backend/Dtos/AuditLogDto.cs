namespace RetailManagementSystem.Dtos;

public sealed record AuditLogDto(
    long AuditLogId,
    long? UserId,
    string? UserName,
    string EntityName,
    string EntityId,
    string Action,
    string? ChangesJson,
    DateTime OccurredAtUtc
);

public sealed record AuditLogQuery
(
    string? Entity,
    long? UserId,
    string? Action,
    string? EntityId,
    DateTime? FromUtc,
    DateTime? ToUtc,
    string? Q,
    int Skip = 0,
    int Take = 200
);
