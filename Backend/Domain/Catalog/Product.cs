using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace RetailManagementSystem.Domain.Catalog
{
    public class Product
    {
        public long ProductId { get; set; }
        public long CategoryId { get; set; }

        [MaxLength(200)] 
        public string Name { get; set; } = default!;

        [MaxLength(1000)] 
        public string? Description { get; set; }

        [Column(TypeName = "decimal(18,2)")] 
        public decimal UnitPrice { get; set; }
        public bool IsActive { get; set; } = true;

        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }


        public Category Category { get; set; } = default!;
        public InventoryItem? InventoryItem { get; set; }
        public ICollection<StockAdjustment> StockAdjustments { get; set; } = new List<StockAdjustment>();
        public ICollection<StockLedger> StockLedger { get; set; } = new List<StockLedger>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
