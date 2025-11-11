
namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
    {
       private readonly AppDbContext db;
       
    public OrdersController(AppDbContext db)
    {
        this.db = db;
        
    }



    [HttpPost]
    public async Task<ActionResult<long>> Order([FromBody] CreateOrderDto dto)
    {
        var order = new Order
        {
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            CustomerId = dto.CustomerId,
            Status = OrderStatus.Unpaid.ToString(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return Ok(order.OrderId);
    }


    [HttpGet("{id:long}")]
    public async Task<ActionResult<OrderDetailsDto>> Order(long id)
    {
        var dto = await db.Orders
            .AsNoTracking()
            .Where(order => order.OrderId == id)
            .Select(order => new OrderDetailsDto(
                order.OrderId, 
                order.OrderNumber, 
                order.CustomerId, 
                order.Status,
                order.Subtotal, 
                order.DiscountTotal, 
                order.TaxTotal, 
                order.GrandTotal,
                order.IsActive, 
                order.CreatedAt, 
                order.UpdatedAt,
                order.Items.Select(item => new OrderItemDto(
                    item.OrderItemId, 
                    item.ProductId, 
                    item.ProductNameSnapshot,
                    item.UnitPrice, 
                    item.Quantity, 
                    item.LineDiscount, 
                    item.LineTotal
                )).ToList()
            ))
            .FirstOrDefaultAsync();
        return dto is null ? NotFound() : Ok(dto);
    }



    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> Orders(
    [FromQuery] string? status = null,
    [FromQuery] string? q = null,
    [FromQuery] DateTime? from = null,
    [FromQuery] DateTime? to = null,
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20
)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var qry = db.Orders.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(status))
            qry = qry.Where(order => order.Status == status);

        if (!string.IsNullOrWhiteSpace(q))
        {
            q = q.Trim();
            
            qry = qry.Where(order => order.OrderNumber.Contains(q));
            if (long.TryParse(q, out var id))
                qry = qry.Union(db.Orders.AsNoTracking().Where(order => order.OrderId == id));
        }

        if (from.HasValue) qry = qry.Where(order => order.CreatedAt >= from.Value);
        if (to.HasValue) qry = qry.Where(order => order.CreatedAt < to.Value);

        var total = await qry.LongCountAsync();

        var items = await qry
            .OrderByDescending(order => order.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(order => new OrderListItemDto(
                order.OrderId,
                order.OrderNumber,
                order.Status,
                order.CustomerId,
                order.Subtotal,
                order.DiscountTotal,
                order.TaxTotal,
                order.GrandTotal,
                order.Items.Count,
                order.CreatedAt,
                order.UpdatedAt
            ))
            .ToListAsync();

        return Ok(new PagedResult<OrderListItemDto>(items, page, pageSize, total));
    }




    [HttpPost("{id:long}/items")]
    public async Task<IActionResult> Order(long id, [FromBody] AddItemDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest("Quantity must be > 0.");

        var order = await db.Orders.Include(order => order.Items).FirstOrDefaultAsync(order => order.OrderId == id);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Unpaid.ToString()) return BadRequest("Paid orders are read-only.");

        var product = await db.Products.FirstOrDefaultAsync(product => product.ProductId == dto.ProductId && product.IsActive);
        if (product is null) return NotFound("Product not found or inactive.");

        order.Items.Add(new OrderItem
        {
            ProductId = product.ProductId,
            ProductNameSnapshot = product.Name,
            UnitPrice = product.UnitPrice,
            Quantity = dto.Quantity,
            LineDiscount = 0m,
            LineTotal = product.UnitPrice * dto.Quantity
        });

        await OrderCalculator.RecalculateAsync(db, order);
        await db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("{id:long}/items/{itemId:long}")]
    public async Task<IActionResult> Order(long id, long itemId, [FromBody] AddItemDto dto)
    {
        if (dto.Quantity <= 0) return BadRequest("Quantity must be > 0.");

        var order = await db.Orders.Include(order => order.Items).FirstOrDefaultAsync(order => order.OrderId == id);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Unpaid.ToString()) return BadRequest("Paid orders are read-only.");

        var line = order.Items.FirstOrDefault(item => item.OrderItemId == itemId);
        if (line is null) return NotFound();

        line.Quantity = dto.Quantity;

        await OrderCalculator.RecalculateAsync(db, order);
        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpDelete("{id:long}/items/{itemId:long}")]
    public async Task<IActionResult> Order(long id, long itemId)
    {
        var order = await db.Orders.AsTracking().FirstOrDefaultAsync(order => order.OrderId == id);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Unpaid.ToString())
            return BadRequest("Paid orders are read-only.");

        var affected = await db.OrderItems
            .Where(item => item.OrderId == id && item.OrderItemId == itemId)
            .ExecuteDeleteAsync();                  // no token

        if (affected == 0) return NotFound();

        // reload items, recalc totals, save
        await db.Entry(order).Collection(order => order.Items).LoadAsync();
        await OrderCalculator.RecalculateAsync(db, order);
        await db.SaveChangesAsync();
        return NoContent();
    }








    //payment
    [HttpPost("{id:long}/pay")]
    public async Task<IActionResult> Order(long id, [FromBody] PayOrderDto dto)
    {
        var order = await db.Orders
            .Include(order => order.Items)
            .FirstOrDefaultAsync(order => order.OrderId == id);

        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Unpaid.ToString()) return BadRequest("Only unpaid orders can be paid.");
        if (order.Items.Count == 0) return BadRequest("No items to pay.");

        await OrderCalculator.RecalculateAsync(db, order);

        using var tx = await db.Database.BeginTransactionAsync();

        foreach (var line in order.Items)
        {
            var snapshot = await db.InventoryItems.FirstOrDefaultAsync(i => i.ProductId == line.ProductId);
            if (snapshot is null) return BadRequest($"Inventory missing for product {line.ProductId}.");
            if (snapshot.QuantityOnHand < line.Quantity) return BadRequest($"Insufficient stock for product {line.ProductId}.");

            snapshot.QuantityOnHand -= line.Quantity;
            snapshot.UpdatedAt = DateTime.UtcNow;

            db.StockLedger.Add(new StockLedger
            {
                ProductId = line.ProductId,
                RefType = "ORDER",
                RefId = order.OrderId,
                QuantityDelta = -line.Quantity, // out
                Reason = "Order paid",
                OccurredAt = DateTime.UtcNow
            });
        }

        order.Status = OrderStatus.Paid.ToString();
        order.UpdatedAt = DateTime.UtcNow;

        db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.OrderId,
            FromStatus = OrderStatus.Unpaid.ToString(),
            ToStatus = OrderStatus.Paid.ToString(),
            ChangedBy = dto.ChangedByUserId,
            ChangedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        await tx.CommitAsync();
        return Ok();
    }

    [HttpPost("{id:long}/void")]
    public async Task<IActionResult> Order(long id, [FromBody] VoidOrderDto dto)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.OrderId == id);
        if (order is null) return NotFound();
        if (order.Status != OrderStatus.Unpaid.ToString()) return BadRequest("Only unpaid orders can be voided.");

        order.Status = OrderStatus.Voided.ToString();
        order.UpdatedAt = DateTime.UtcNow;

        db.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.OrderId,
            FromStatus = OrderStatus.Unpaid.ToString(),
            ToStatus = OrderStatus.Voided.ToString(),
            ChangedBy = 0, // fill with user id when auth is available
            ChangedAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
        return Ok();
    }



    // POST /api/orders/{id}/coupon
    [HttpPost("{id:long}/coupon")]
    public async Task<IActionResult> Order(long id, [FromBody] ApplyCouponDto dto)
    {
        var order = await db.Orders
            .Include(order => order.Items)
            .FirstOrDefaultAsync(order => order.OrderId == id);

        if (order is null) 
            return NotFound();

        if (!string.Equals(order.Status, OrderStatus.Unpaid.ToString(), StringComparison.OrdinalIgnoreCase))
            return BadRequest("Coupon can be applied only to unpaid orders.");

        if (await db.CouponRedemptions.AnyAsync(r => r.OrderId == order.OrderId))
            return Conflict("Order already has a coupon.");

        if (string.IsNullOrWhiteSpace(dto.Code)) 
            return BadRequest("Code required.");

        var code = dto.Code.Trim();

        var coupon = await db.Coupons.Include(coupon => coupon.Discount).FirstOrDefaultAsync(coupon => coupon.Code == code);
        if (coupon is null || !coupon.IsActive) 
            return BadRequest("Invalid or inactive coupon.");

        var d = coupon.Discount;
        if (d is null || !d.IsActive) 
            return BadRequest("Coupon discount inactive.");

        if (d.StartsAt.HasValue && d.StartsAt.Value > DateTime.UtcNow) 
            return BadRequest("Coupon not started yet.");

        if (d.EndsAt.HasValue && d.EndsAt.Value < DateTime.UtcNow) 
            return BadRequest("Coupon expired.");

        var totalUsed = await db.CouponRedemptions.CountAsync(r => r.CouponId == coupon.CouponId);
        if (coupon.UsageLimitTotal.HasValue && totalUsed >= coupon.UsageLimitTotal.Value)
            return BadRequest("Coupon usage limit reached.");

        long? customerId = dto.CustomerId ?? order.CustomerId;
        if (coupon.UsageLimitPerCustomer.HasValue && customerId.HasValue)
        {
            var usedByCustomer = await db.CouponRedemptions
                .CountAsync(r => r.CouponId == coupon.CouponId && r.CustomerId == customerId.Value);

            if (usedByCustomer >= coupon.UsageLimitPerCustomer.Value)
                return BadRequest("Customer usage limit reached for this coupon.");
        }

        db.CouponRedemptions.Add(new CouponRedemption
        {
            CouponId = coupon.CouponId,
            OrderId = order.OrderId,
            CustomerId = customerId,
            RedeemedAt = DateTime.UtcNow
        });

       
        await OrderCalculator.RecalculateAsync(db, order);
        await db.SaveChangesAsync();
        return Ok();
    }


    // DELETE /api/orders/{id}/coupon
    [HttpDelete("{id:long}/coupon")]
    public async Task<IActionResult> Order(long id, [FromQuery] bool removeCoupon = true)
    {
        var order = await db.Orders
            .Include(order => order.Items)
            .FirstOrDefaultAsync(order => order.OrderId == id);
        if (order is null) return NotFound();
        if (!string.Equals(order.Status, OrderStatus.Unpaid.ToString(), StringComparison.OrdinalIgnoreCase))
            return BadRequest("Coupon can be removed only from unpaid orders.");

        var redemption = await db.CouponRedemptions.FirstOrDefaultAsync(redeem => redeem.OrderId == order.OrderId);
        if (redemption is null) return NotFound();

        db.CouponRedemptions.Remove(redemption);

        await OrderCalculator.RecalculateAsync(db, order);
        await db.SaveChangesAsync();
        return NoContent();
    }










}

