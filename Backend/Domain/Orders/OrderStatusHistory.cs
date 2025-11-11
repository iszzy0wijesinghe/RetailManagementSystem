using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Orders
{
    public class OrderStatusHistory
    {
        public long OrderStatusHistoryId { get; set; }
        public long OrderId { get; set; }
        [MaxLength(20)] public string FromStatus { get; set; } = default!;
        [MaxLength(20)] public string ToStatus { get; set; } = default!;
        public long ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; }
        public Order Order { get; set; } = default!;
    }
}
