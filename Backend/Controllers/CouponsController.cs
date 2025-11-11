namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CouponsController : ControllerBase
{
    private readonly AppDbContext db;
    public CouponsController(AppDbContext db) => this.db = db;


    [HttpGet]
    public async Task<ActionResult<IEnumerable<CouponListItem>>> Coupon([FromQuery] long? discountId = null, [FromQuery] bool includeInactive = false, [FromQuery] string? q = null)
    {
        var query = db.Coupons.AsNoTracking().AsQueryable();
        if (discountId.HasValue) query = query.Where(coupon => coupon.DiscountId == discountId.Value);
        if (!includeInactive) query = query.Where(coupon => coupon.IsActive);
        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(coupon => coupon.Code.ToLower().Contains(term));
        }

        var list = await query
            .OrderBy(coupon => coupon.Code)
            .Select(coupon => new CouponListItem(
                coupon.CouponId,
                coupon.DiscountId,
                coupon.Code,
                coupon.IsActive,
                coupon.UsageLimitTotal,
                coupon.UsageLimitPerCustomer,
                db.CouponRedemptions.Count(r => r.CouponId == coupon.CouponId)))
            .ToListAsync();

        return Ok(list);
    }



    [HttpGet("{id:long}")]
    public async Task<ActionResult<CouponDetailsDto>> Coupon(long id)
    {
        var dto = await db.Coupons.AsNoTracking()
            .Where(coupon => coupon.CouponId == id)
            .Select(coupon => new CouponDetailsDto(
                coupon.CouponId, 
                coupon.DiscountId, 
                coupon.Code, 
                coupon.IsActive, 
                coupon.UsageLimitTotal,
                coupon.UsageLimitPerCustomer))
            .FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }



    [HttpPost]
    public async Task<ActionResult<long>> Coupon([FromBody] CouponCreateDto dto)
    {
        var discount = await db.Discounts.FirstOrDefaultAsync(discount => discount.DiscountId == dto.DiscountId);
        if (discount is null) 
            return BadRequest("Discount not found.");
        if (!string.Equals(discount.Scope, "Coupon", StringComparison.OrdinalIgnoreCase))
            return BadRequest("Discount scope must be 'Coupon' for coupons.");

        if (string.IsNullOrWhiteSpace(dto.Code)) 
            return BadRequest("Code required.");


        var code = dto.Code.Trim();
        var exists = await db.Coupons.AnyAsync(coupon => coupon.Code == code);

        if (exists) 
            return Conflict("Coupon code already exists.");

        var row = new Coupon
        {
            DiscountId = dto.DiscountId,
            Code = code,
            UsageLimitTotal = dto.UsageLimitTotal,
            UsageLimitPerCustomer = dto.UsageLimitPerCustomer,
            IsActive = dto.IsActive
        };

        db.Coupons.Add(row);
        await db.SaveChangesAsync();
        return Ok(row.CouponId);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Coupon(long id, [FromBody] CouponUpdateDto dto)
    {
        var row = await db.Coupons.FirstOrDefaultAsync(coupon => coupon.CouponId == id);
        if (row is null) return NotFound();

        if (string.IsNullOrWhiteSpace(dto.Code)) return BadRequest("Code required.");
        var newCode = dto.Code.Trim();
        if (!string.Equals(newCode, row.Code, StringComparison.Ordinal))
        {
            var codeExists = await db.Coupons.AnyAsync(coupon => coupon.Code == newCode && coupon.CouponId != id);
            if (codeExists) return Conflict("Coupon code already exists.");
            row.Code = newCode;
        }

        row.UsageLimitTotal = dto.UsageLimitTotal;
        row.UsageLimitPerCustomer = dto.UsageLimitPerCustomer;
        row.IsActive = dto.IsActive;

        await db.SaveChangesAsync();
        return NoContent();
    }

    
    [HttpPut("{id:long}/active")]
    public async Task<IActionResult> Coupon(long id, [FromQuery] bool value = true)
    {
        var row = await db.Coupons.FirstOrDefaultAsync(coupon => coupon.CouponId == id);
        if (row is null) return NotFound();
        row.IsActive = value;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
