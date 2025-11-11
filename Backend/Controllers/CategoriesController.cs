namespace RetailManagementSystem.Controllers;
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly AppDbContext db;
    public CategoriesController(AppDbContext db) => this.db = db;

        
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryListItem>>> Category([FromQuery] bool includeInactive = false)
    {
        var query = db.Categories.AsNoTracking();
        if (!includeInactive) query = query.Where(category => category.IsActive);

        var list = await query
            .OrderBy(category => category.Name)
            .Select(category => new CategoryListItem(
                category.CategoryId, 
                category.Name, 
                category.IsActive, 
                category.ParentCategoryId))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CategoryDetailsDto>> Category(long id)
    {
        var cat = await db.Categories.AsNoTracking().FirstOrDefaultAsync(category => category.CategoryId == id);
        return cat is null
            ? NotFound()
            : Ok(new CategoryDetailsDto(
                cat.CategoryId, 
                cat.Name, 
                cat.IsActive, 
                cat.ParentCategoryId));
    }


    [HttpPost]
    public async Task<ActionResult<long>> Category([FromBody] CategoryCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) 
            return BadRequest("Name required.");

        if (dto.ParentCategoryId is long pid)
        {
            var parentExists = await db.Categories.AnyAsync(category => category.CategoryId == pid && category.IsActive);
            if (!parentExists) return BadRequest("Parent category not found or inactive.");
        }

        var row = new Category
        {
            Name = dto.Name.Trim(),
            ParentCategoryId = dto.ParentCategoryId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Categories.Add(row);
        await db.SaveChangesAsync();
        return Ok(row.CategoryId);
    }




    [HttpPut("{id:long}")]
    public async Task<IActionResult> Category(long id, [FromBody] CategoryUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) 
            return BadRequest("Name required.");

        var row = await db.Categories.FirstOrDefaultAsync(category => category.CategoryId == id);
        if (row is null) return NotFound();

        if (dto.ParentCategoryId is long pid)
        {
            var parentExists = await db.Categories.AnyAsync(category => category.CategoryId == pid && category.IsActive);
            if (!parentExists) return BadRequest("Parent category not found or inactive.");
        }

        row.Name = dto.Name.Trim();
        row.ParentCategoryId = dto.ParentCategoryId;
        row.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Category(long id, [FromServices] ILogger<CategoriesController> _)
    {
        var row = await db.Categories.Include(category => category.Products).FirstOrDefaultAsync(category => category.CategoryId == id);
        if (row is null) return NotFound();

        if (row.Products.Any())
            return BadRequest("Cannot delete category that has products. Deactivate or move products first.");

        row.IsActive = false;
        row.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }

}

