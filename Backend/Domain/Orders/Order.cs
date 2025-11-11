using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetailManagementSystem.Domain.Orders
{
    public class Order
    {
        public long OrderId { get; set; }

        [MaxLength(30)] 
        public string OrderNumber { get; set; } = default!;
        public long? CustomerId { get; set; }


        [MaxLength(20)] 
        public string Status { get; set; } = RetailManagementSystem.Domain.OrderStatus.Unpaid.ToString();



        [Column(TypeName = "decimal(18,2)")] 
        public decimal Subtotal { get; set; }


        [Column(TypeName = "decimal(18,2)")] 
        public decimal DiscountTotal { get; set; }


        [Column(TypeName = "decimal(18,2)")] 
        public decimal TaxTotal { get; set; }


        [Column(TypeName = "decimal(18,2)")] 
        public decimal GrandTotal { get; set; }


        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public Customer? Customer { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
        public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
        public ICollection<RetailManagementSystem.Domain.Discounts.CouponRedemption> CouponRedemptions { get; set; } = new List<RetailManagementSystem.Domain.Discounts.CouponRedemption>();
    }
}
