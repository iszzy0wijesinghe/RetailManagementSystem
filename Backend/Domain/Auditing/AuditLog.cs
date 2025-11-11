using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Auditing
{
    public class AuditLog
    {
        public long AuditLogId { get; set; }
        public long? UserId { get; set; }
        [MaxLength(100)] public string EntityName { get; set; } = default!;
        [MaxLength(64)] public string EntityId { get; set; } = default!;
        [MaxLength(30)] public string Action { get; set; } = default!;
        public string? ChangesJson { get; set; }
        public DateTime OccurredAt { get; set; }
    }
}
