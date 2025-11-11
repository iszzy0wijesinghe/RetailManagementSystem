using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RetailManagementSystem.Domain.Discounts
{
    public class Discount
    {
        public long DiscountId { get; set; }
        [MaxLength(150)] public string Name { get; set; } = default!;
        [MaxLength(20)] public string Type { get; set; } = DiscountType.Percent.ToString();
        [Column(TypeName = "decimal(18,2)")] public decimal Value { get; set; }
        [MaxLength(20)] public string Scope { get; set; } = DiscountScope.Global.ToString();
        public bool IsStackable { get; set; }
        public int Priority { get; set; }
        public DateTime? StartsAt { get; set; }
        public DateTime? EndsAt { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal? MinBasketSubtotal { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal? MaxTotalDiscount { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<DiscountCategory> DiscountCategories { get; set; } = new List<DiscountCategory>();
        public ICollection<DiscountProduct> DiscountProducts { get; set; } = new List<DiscountProduct>();
        public ICollection<Coupon> Coupons { get; set; } = new List<Coupon>();
    }
}
