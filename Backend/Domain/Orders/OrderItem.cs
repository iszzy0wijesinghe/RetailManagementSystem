using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetailManagementSystem.Domain.Orders
{
    public class OrderItem
    {
        public long OrderItemId { get; set; }
        public long OrderId { get; set; }
        public long ProductId { get; set; }
        [MaxLength(200)] public string ProductNameSnapshot { get; set; } = default!;
        [Column(TypeName = "decimal(18,2)")] public decimal UnitPrice { get; set; }
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal LineDiscount { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal LineTotal { get; set; }

        public Order Order { get; set; } = default!;
        public Product Product { get; set; } = default!;
    }
}
