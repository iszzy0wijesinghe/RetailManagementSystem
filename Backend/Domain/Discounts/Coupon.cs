using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Discounts
{
    public class Coupon
    {
        public long CouponId { get; set; }
        public long DiscountId { get; set; }
        [MaxLength(40)] public string Code { get; set; } = default!;
        public int? UsageLimitTotal { get; set; }
        public int? UsageLimitPerCustomer { get; set; }
        public bool IsActive { get; set; } = true;

        public Discount Discount { get; set; } = default!;
        public ICollection<CouponRedemption> Redemptions { get; set; } = new List<CouponRedemption>();
    }
}
