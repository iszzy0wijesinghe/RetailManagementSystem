namespace RetailManagementSystem.Controllers;


[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext db;
    public ReportsController(AppDbContext db) => this.db = db;


    [HttpGet("products")]
    public async Task<ActionResult<IEnumerable<ProductStockReportItem>>> Report([FromQuery] bool includeInactive = false, [FromQuery] string? q = null)
    {
        var query = db.Products.AsNoTracking().Include(product => product.InventoryItem).AsQueryable();
        if (!includeInactive) query = query.Where(product => product.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(product => product.Name.ToLower().Contains(term));
        }

        var list = await query
            .OrderBy(product => product.Name)
            .Select(product => new ProductStockReportItem(
                product.ProductId,
                product.Name,
                product.UnitPrice,
                product.IsActive,
                product.InventoryItem != null ? product.InventoryItem.QuantityOnHand : 0))
            .ToListAsync();

        return Ok(list);
    }

    // GET /api/reports/sales-by-day?from=2025-01-01&to=2025-12-31
    [HttpGet("sales-by-day")]
    public async Task<ActionResult<IEnumerable<SalesByDayItem>>> Report([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null)
    {
        var paid = OrderStatus.Paid.ToString();

        var start = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
        var endExclusive = ((to ?? DateTime.UtcNow.Date).Date).AddDays(1);

        // Use a safe anchor for DateDiffDay (avoid MinValue)
        var anchor = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        // Fully server-side: group by number of days since anchor
        var rows = await db.Orders.AsNoTracking()
            .Where(order => order.Status == paid && order.UpdatedAt >= start && order.UpdatedAt < endExclusive)
            .GroupBy(order => EF.Functions.DateDiffDay(anchor, order.UpdatedAt))
            .Select(g => new
            {
                DayOffset = g.Key,
                OrdersCount = g.Count(),
                Subtotal = g.Sum(order => order.Subtotal),
                DiscountTotal = g.Sum(order => order.DiscountTotal),
                TaxTotal = g.Sum(order => order.TaxTotal),
                GrandTotal = g.Sum(order => order.GrandTotal)
            })
            .OrderBy(x => x.DayOffset)
            .ToListAsync();

        // Client-side: convert offset → DateTime
        var data = rows.Select(x => new SalesByDayItem(
            anchor.AddDays(x.DayOffset),
            x.OrdersCount,
            x.Subtotal,
            x.DiscountTotal,
            x.TaxTotal,
            x.GrandTotal
        ));

        return Ok(data);
    }


    // GET /api/reports/sales-by-product?from=2025-01-01&to=2025-12-31&categoryId=123
    [HttpGet("sales-by-product")]
    public async Task<ActionResult<IEnumerable<SalesByProductItem>>> Report(
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null,
        [FromQuery] long? categoryId = null)
    {
        var paid = OrderStatus.Paid.ToString();
        var start = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
        var endExclusive = ((to ?? DateTime.UtcNow.Date).Date).AddDays(1);

        // 1) Server-side filtering to shrink the dataset
        var orderIds = db.Orders.AsNoTracking()
            .Where(o => o.Status == paid && o.UpdatedAt >= start && o.UpdatedAt < endExclusive)
            .Select(o => o.OrderId);

        IQueryable<long> productIds = Enumerable.Empty<long>().AsQueryable();
        var filterByCategory = categoryId.HasValue;
        if (filterByCategory)
        {
            productIds = db.Products.AsNoTracking()
                .Where(p => p.CategoryId == categoryId.Value)
                .Select(p => p.ProductId);
        }

        // 2) Pull only the columns needed for the report
        var rows = await db.OrderItems.AsNoTracking()
            .Where(i => orderIds.Contains(i.OrderId)
                     && (!filterByCategory || productIds.Contains(i.ProductId)))
            .Select(i => new
            {
                i.ProductId,
                i.ProductNameSnapshot,
                i.Quantity,
                i.LineTotal
            })
            .ToListAsync();

        // 3) Client-side grouping (simple & reliable)
        var list = rows
            .GroupBy(r => new { r.ProductId, r.ProductNameSnapshot })
            .Select(g => new SalesByProductItem(
                g.Key.ProductId,
                g.Key.ProductNameSnapshot,
                g.Sum(x => x.Quantity),
                g.Sum(x => x.LineTotal)))
            .OrderByDescending(x => x.Revenue)
            .ToList();

        return Ok(list);
    }




    // GET /api/reports/inventory-movements?from=2025-01-01&to=2025-12-31
    [HttpGet("inventory-movements")]
    public async Task<ActionResult<IEnumerable<InventoryMovementItem>>> Report([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] long? productId = null, [FromQuery] string? refType = null)
    {
        var start = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
        var end = (to ?? DateTime.UtcNow.Date).Date.AddDays(1).AddTicks(-1);

        var q = db.StockLedger.AsNoTracking().Include(ledger => ledger.Product)
            .Where(ledger => ledger.OccurredAt >= start && ledger.OccurredAt <= end);

        if (productId.HasValue) q = q.Where(ledger => ledger.ProductId == productId.Value);
        if (!string.IsNullOrWhiteSpace(refType)) q = q.Where(ledger => ledger.RefType == refType);

        var list = await q
            .OrderByDescending(ledger => ledger.OccurredAt)
            .Select(ledger => new InventoryMovementItem(
                ledger.OccurredAt,
                ledger.ProductId,
                ledger.Product.Name,
                ledger.RefType,
                ledger.RefId,
                ledger.QuantityDelta))
            .ToListAsync();

        return Ok(list);
    }

    // GET /api/reports/discount-impact?from=2025-01-01&to=2025-12-31
    [HttpGet("discount-impact")]
    public async Task<ActionResult<IEnumerable<DiscountImpactItem>>> Report([FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int mode = 0)
    {
        var paid = OrderStatus.Paid.ToString();

        var start = (from ?? DateTime.UtcNow.Date.AddDays(-30)).Date;
        var endExclusive = ((to ?? DateTime.UtcNow.Date).Date).AddDays(1);

        var anchor = new DateTime(2000, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var rows = await db.Orders.AsNoTracking()
            .Where(order => order.Status == paid && order.UpdatedAt >= start && order.UpdatedAt < endExclusive)
            .GroupBy(order => EF.Functions.DateDiffDay(anchor, order.UpdatedAt))
            .Select(g => new
            {
                DayOffset = g.Key,
                DiscountTotal = g.Sum(order => order.DiscountTotal)
            })
            .OrderBy(x => x.DayOffset)
            .ToListAsync();

        var data = rows.Select(x => new DiscountImpactItem(
            anchor.AddDays(x.DayOffset),
            x.DiscountTotal
        ));

        return Ok(data);
    }


}
