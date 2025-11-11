using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Inventory
{
    public class StockLedger
    {
        public long StockLedgerId { get; set; }
        public long ProductId { get; set; }
        [MaxLength(30)] public string RefType { get; set; } = default!; // ORDER, ADJUSTMENT
        public long RefId { get; set; }
        public int QuantityDelta { get; set; }   // +in, -out
        [MaxLength(200)] public string? Reason { get; set; }
        public DateTime OccurredAt { get; set; }
        public Product Product { get; set; } = default!;
    }
}
