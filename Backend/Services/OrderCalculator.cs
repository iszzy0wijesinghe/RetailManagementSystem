namespace RetailManagementSystem.Services;

public static class OrderCalculator
{
    public static async Task RecalculateAsync (
        AppDbContext db, Order order, CancellationToken ct = default)
    {
        foreach(var line in order.Items)
        {
            if(line.Product is null)
            {
                line.Product = await db.Products.FindAsync(new object?[] { line.ProductId }, ct)
                    ?? throw new InvalidOperationException($"Product with ID {line.ProductId} not found.");
            }

            var best = await DiscountEngine.GetBestDiscountForLineAsync(db, order, line, ct);
            line.LineDiscount = best;
            line.LineTotal = (line.UnitPrice * line.Quantity) - line.LineDiscount;
        }

        order.Subtotal = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        order.DiscountTotal = order.Items.Sum(i => i.LineDiscount);
        order.TaxTotal = 0m;
        order.GrandTotal = Math.Max(0, order.Subtotal - order.DiscountTotal + order.TaxTotal);
        order.UpdatedAt = DateTime.UtcNow;

       
    }

}
