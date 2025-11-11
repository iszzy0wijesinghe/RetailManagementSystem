namespace RetailManagementSystem.Services;

public static class DiscountEngine
{
        public static async Task<decimal> GetBestDiscountForLineAsync(
            AppDbContext db, Order order, OrderItem line, CancellationToken ct = default)
        {
            if (line.Quantity <= 0 || line.UnitPrice <= 0) return 0m;

            var now = DateTime.UtcNow;

            var discounts = await db.Discounts
                .Where(d => d.IsActive &&
                        (d.StartsAt == null ||  d.StartsAt <= now) && 
                        (d.EndsAt == null || d.EndsAt >= now))
                .Include(d => d.DiscountCategories)
                .Include(d => d.DiscountProducts)
                .ToListAsync(ct);

            var product = line.Product;
            var categoryId = product.CategoryId;

            IEnumerable<Discount> candidates = discounts.Where(d =>
            {
                var scope = Enum.Parse<DiscountScope>(d.Scope);
                return scope switch
                {
                    DiscountScope.Global => true,
                    DiscountScope.Category => d.DiscountCategories.Any(x => x.CategoryId == categoryId),
                    DiscountScope.Product => d.DiscountProducts.Any(x => x.ProductId == product.ProductId),
                    DiscountScope.Coupon => order.CouponRedemptions.Any(),
                    _ => false
                };
            });

            decimal baseAmount = line.UnitPrice * line.Quantity;
            decimal best = 0m;
            int? bestPriority = null;

            foreach (var d in candidates)
            {
                var type = Enum.Parse<DiscountType>(d.Type);
                decimal canditate = type == DiscountType.Percent
                    ?Math.Round(baseAmount * (d.Value / 100m), 2) : Math.Min(d.Value, baseAmount);

                if(canditate > best || (canditate == best && (bestPriority == null || d.Priority < bestPriority)))
                {
                    best = canditate;
                    bestPriority = d.Priority;
                }
            }

            if (best < 0) 
            best = 0m;

            if (best > baseAmount) 
            best = baseAmount;


        return best;
    }
}

    