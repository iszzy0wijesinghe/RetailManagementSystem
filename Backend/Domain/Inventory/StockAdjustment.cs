using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Inventory
{
    public class StockAdjustment
    {
        public long StockAdjustmentId { get; set; }
        public long ProductId { get; set; }
        public int QuantityDelta { get; set; }
        [MaxLength(200)] public string? Note { get; set; }
        public long CreatedBy { get; set; }
        public DateTime CreatedAt { get; set; }
        public Product Product { get; set; } = default!;
    }
}
