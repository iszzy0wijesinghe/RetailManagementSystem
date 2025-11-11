namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscountsController : ControllerBase
{
    private readonly AppDbContext db;
    public DiscountsController(AppDbContext db) => this.db = db;

    private static bool IsValidType(string type) =>
           string.Equals(type, "Percent", StringComparison.OrdinalIgnoreCase) ||
           string.Equals(type, "Amount", StringComparison.OrdinalIgnoreCase);

    private static bool IsValidScope(string scope) =>
        string.Equals(scope, "Global", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(scope, "Category", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(scope, "Product", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(scope, "Coupon", StringComparison.OrdinalIgnoreCase);


    [HttpGet]
    public async Task<ActionResult<IEnumerable<DiscountListItem>>> Discount([FromQuery] bool includeInactive = false, [FromQuery] string? q = null)
    {
        var query = db.Discounts.AsNoTracking();
        if (!includeInactive) query = query.Where(discount => discount.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(discount => discount.Name.ToLower().Contains(term));
        }

        var list = await query
            .OrderBy(discount => discount.Priority).ThenBy(discount => discount.Name)
            .Select(discount => new DiscountListItem(
                discount.DiscountId,
                discount.Name, 
                discount.Type,
                discount.Value,
                discount.Scope,
                discount.IsActive,
                discount.Priority,
                discount.StartsAt, 
                discount.EndsAt,
                discount.DiscountCategories.Count,
                discount.DiscountProducts.Count,
                discount.Coupons.Count))
            .ToListAsync();

        return Ok(list);
    }



    [HttpGet("{id:long}")]
    public async Task<ActionResult<DiscountDetailsDto>> Discount(long id)
    {
        var dto = await db.Discounts.AsNoTracking()
            .Where(discount => discount.DiscountId == id)
            .Select(discount => new DiscountDetailsDto(
                discount.DiscountId, 
                discount.Name, 
                discount.Type, 
                discount.Value, 
                discount.Scope, 
                discount.IsActive, 
                discount.Priority,
                discount.StartsAt, 
                discount.EndsAt, 
                discount.MinBasketSubtotal, 
                discount.MaxTotalDiscount,
                discount.DiscountCategories.Select(x => x.CategoryId).ToList(),
                discount.DiscountProducts.Select(x => x.ProductId).ToList()))
            .FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }



    [HttpPost]
    public async Task<ActionResult<long>> Discount([FromBody] DiscountCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || !IsValidType(dto.Type) || !IsValidScope(dto.Scope) || dto.Value < 0)
            return BadRequest("Invalid discount fields.");

        var row = new Discount
        {
            Name = dto.Name.Trim(),
            Type = dto.Type.Trim(),
            Value = dto.Value,
            Scope = dto.Scope.Trim(),
            IsStackable = dto.IsStackable,
            Priority = dto.Priority,
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
            MinBasketSubtotal = dto.MinBasketSubtotal,
            MaxTotalDiscount = dto.MaxTotalDiscount,
            IsActive = true
        };

        db.Discounts.Add(row);
        await db.SaveChangesAsync();
        return Ok(row.DiscountId);
    }


    [HttpPut("{id:long}")]
    public async Task<IActionResult> Discount(long id, [FromBody] DiscountUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || !IsValidType(dto.Type) || !IsValidScope(dto.Scope) || dto.Value < 0)
            return BadRequest("Invalid discount fields.");

        var row = await db.Discounts.FirstOrDefaultAsync(discount => discount.DiscountId == id);
        if (row is null) return NotFound();

        row.Name = dto.Name.Trim();
        row.Type = dto.Type.Trim();
        row.Value = dto.Value;
        row.Scope = dto.Scope.Trim();
        row.IsStackable = dto.IsStackable;
        row.Priority = dto.Priority;
        row.StartsAt = dto.StartsAt;
        row.EndsAt = dto.EndsAt;
        row.MinBasketSubtotal = dto.MinBasketSubtotal;
        row.MaxTotalDiscount = dto.MaxTotalDiscount;

        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpPut("{id:long}/active")]
    public async Task<IActionResult> Discount(long id, [FromQuery] bool value = true)
    {
        var row = await db.Discounts.FirstOrDefaultAsync(discount => discount.DiscountId == id);
        if (row is null) return NotFound();

        row.IsActive = value;
        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpPost("{id:long}/categories")]
    public async Task<IActionResult> Discount(long id, [FromBody] DiscountLinkCategoryDto dto)
    {
        var discount = await db.Discounts.Include(discount => discount.DiscountCategories).FirstOrDefaultAsync(discount => discount.DiscountId == id);
        if (discount is null) return NotFound();

        var existsCategory = await db.Categories.AnyAsync(category => category.CategoryId == dto.CategoryId);
        if (!existsCategory) return BadRequest("Category not found.");

        var already = discount.DiscountCategories.Any(x => x.CategoryId == dto.CategoryId);
        if (!already)
        {
            db.DiscountCategories.Add(new DiscountCategory { 
                DiscountId = id, 
                CategoryId = dto.CategoryId 
            });
            await db.SaveChangesAsync();
        }
        return Ok();
    }



    [HttpPost("{id:long}/products")]
    public async Task<IActionResult> Discount(long id, [FromBody] DiscountLinkProductDto dto)
    {
        var discount = await db.Discounts.Include(discount => discount.DiscountProducts).FirstOrDefaultAsync(discount => discount.DiscountId == id);
        if (discount is null) return NotFound();

        var existsProduct = await db.Products.AnyAsync(product => product.ProductId == dto.ProductId);
        if (!existsProduct) return BadRequest("Product not found.");

        var already = discount.DiscountProducts.Any(x => x.ProductId == dto.ProductId);
        if (!already)
        {
            db.DiscountProducts.Add(new DiscountProduct { 
                DiscountId = id, 
                ProductId = dto.ProductId 
            });
            await db.SaveChangesAsync();
        }
        return Ok();
    }


    [HttpDelete("{id:long}/categories/{categoryId:long}")]
    [HttpDelete("{id:long}/products/{productId:long}")]
    public async Task<IActionResult> Discount(long id,
        [FromRoute] long? categoryId,
        [FromRoute] long? productId)
    {
        if (categoryId.HasValue)
        {
            var link = await db.DiscountCategories
                .FirstOrDefaultAsync(x => x.DiscountId == id && x.CategoryId == categoryId.Value);
            if (link is null) return NotFound();

            db.DiscountCategories.Remove(link);
            await db.SaveChangesAsync();
            return NoContent();
        }

        if (productId.HasValue)
        {
            var link = await db.DiscountProducts
                .FirstOrDefaultAsync(x => x.DiscountId == id && x.ProductId == productId.Value);
            if (link is null) return NotFound();

            db.DiscountProducts.Remove(link);
            await db.SaveChangesAsync();
            return NoContent();
        }

        return BadRequest("Missing route parameter.");
    }

}
