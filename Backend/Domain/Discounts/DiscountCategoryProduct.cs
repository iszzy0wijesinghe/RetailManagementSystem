namespace RetailManagementSystem.Domain.Discounts;

[Index(nameof(DiscountId), nameof(CategoryId), IsUnique = true)]
public class DiscountCategory
{
    public long DiscountCategoryId { get; set; }
    public long DiscountId { get; set; }
    public long CategoryId { get; set; }
    public Discount Discount { get; set; } = default!;
    public Category Category { get; set; } = default!;
}

[Index(nameof(DiscountId), nameof(ProductId), IsUnique = true)]
public class DiscountProduct
{
    public long DiscountProductId { get; set; }
    public long DiscountId { get; set; }
    public long ProductId { get; set; }
    public Discount Discount { get; set; } = default!;
    public Product Product { get; set; } = default!;
}
