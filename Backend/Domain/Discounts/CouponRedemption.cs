namespace RetailManagementSystem.Domain.Discounts

{
    [Index(nameof(OrderId), IsUnique = true)]
    public class CouponRedemption
    {
        
        public long CouponRedemptionId { get; set; }
        public long CouponId { get; set; }
        public long OrderId { get; set; }
        public long? CustomerId { get; set; }
        public DateTime RedeemedAt { get; set; }

        public Coupon Coupon { get; set; } = default!;
        public Order Order { get; set; } = default!;
        public Customer? Customer { get; set; }
    }
}
