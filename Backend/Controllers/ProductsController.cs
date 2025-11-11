using Microsoft.AspNetCore.Authorization;

namespace RetailManagementSystem.Controllers;
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ProductsController : ControllerBase
    {
        private readonly AppDbContext db;
        private readonly AuditService _audit;
    public ProductsController(AppDbContext db, AuditService audit)
    {
        this.db = db;
        _audit = audit;
    }


    [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductListItem>>> Product([FromQuery] string? q, [FromQuery] bool? active)
        {
        IQueryable<Product> query = db.Products.AsNoTracking();

        if (active.HasValue)
            query = query.Where(product => product.IsActive == active.Value);

        if (!string.IsNullOrWhiteSpace(q))
            {
                var term = q.Trim().ToLower();
                query = query.Where(product =>
                    product.Name.ToLower().Contains(term));
            }

            var list = await query
                .OrderBy(product => product.Name)
                .Select(product => new ProductListItem(
                    product.ProductId,
                    product.CategoryId,
                    product.Name,
                    product.UnitPrice,
                    product.IsActive,
                    product.InventoryItem != null ? product.InventoryItem.QuantityOnHand : 0))
                .ToListAsync();

            return Ok(list);
        }


    [HttpGet("{id:long}")]
    public async Task<ActionResult<ProductDetailsDto>> Product(long id)
    {
        var dto = await db.Products.AsNoTracking()
            .Where(product => product.ProductId == id)
            .Select(product => new ProductDetailsDto(
                product.ProductId,
                product.CategoryId,
                product.Name,
                product.Description,
                product.UnitPrice,
                product.IsActive,
                product.InventoryItem == null ? (long?)null : product.InventoryItem.InventoryItemId,
                product.InventoryItem == null ? (int?)null : product.InventoryItem.QuantityOnHand,
                product.InventoryItem == null ? (DateTime?)null : product.InventoryItem.UpdatedAt))
            .FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }



    [HttpGet("search")]
    [AllowAnonymous]
    public async Task<ActionResult<IEnumerable<object>>> Product(
        [FromQuery] string? q = "",
        [FromQuery] int take = 20,
        [FromQuery] bool onlyActive = true)
    {
        q ??= "";
        q = q.Trim();
        take = Math.Clamp(take, 1, 100);

        // base scope
        IQueryable<Product> baseQry = db.Products.AsNoTracking();
        if (onlyActive) baseQry = baseQry.Where(p => p.IsActive);

        IQueryable<Product> qry;

        if (q.Length == 0)
        {
            // show top items if empty query (nice for POS)
            qry = baseQry.OrderBy(p => p.Name);
        }
        else
        {
            // case-insensitive name match
            var pattern = $"%{q}%";
            qry = baseQry.Where(p => EF.Functions.Like(p.Name, pattern));

            // ALSO allow numeric q to match ProductId
            if (long.TryParse(q, out var pid))
            {
                var byId = baseQry.Where(p => p.ProductId == pid);
                qry = qry.Union(byId);
            }

            qry = qry.OrderBy(p => p.Name);
        }

        var rows = await qry
            .Take(take)
            .Select(p => new
            {
                p.ProductId,
                p.Name,
                p.UnitPrice,
                QtyOnHand = db.InventoryItems
                    .Where(i => i.ProductId == p.ProductId)
                    .Select(i => (int?)i.QuantityOnHand)
                    .FirstOrDefault() ?? 0
            })
            .ToListAsync();

        return Ok(rows);
    }



    [HttpPost]
    public async Task<ActionResult<long>> Product([FromBody] ProductCreateDto dto)
        {
            if (dto.UnitPrice < 0 || string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Invalid product fields.");

            
            var categoryExists = await db.Categories.AnyAsync(category => category.CategoryId == dto.CategoryId && category.IsActive);
            if (!categoryExists) return BadRequest("Category not found or inactive.");


            var newProduct = new Product
            {
                CategoryId = dto.CategoryId,
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                UnitPrice = dto.UnitPrice,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Products.Add(newProduct);

            // Ensure 1:1 inventory snapshot (0 by default)
            db.InventoryItems.Add(new RetailManagementSystem.Domain.Inventory.InventoryItem
            {
                Product = newProduct,
                QuantityOnHand = 0,
                UpdatedAt = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

             await _audit.LogAsync(
                entityName: "Product",
                entityId: newProduct.ProductId,
                action: "Create",
                changes: new { newProduct.ProductId, newProduct.Name, newProduct.CategoryId, newProduct.UnitPrice }
            );



            return Ok(newProduct.ProductId);
        }

    [HttpPut("{id:long}")]
    public async Task<ActionResult> Product(long id, [FromBody] ProductUpdateDto dto)
    {
        if (dto.UnitPrice < 0 || string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest("Invalid product fields.");

        var existingProduct = await db.Products.FirstOrDefaultAsync(product => product.ProductId == id);
        if (existingProduct is null) return NotFound();

        var categoryExists = await db.Categories.AnyAsync(category => category.CategoryId == dto.CategoryId && category.IsActive);
        if (!categoryExists) return BadRequest("Category not found or inactive.");

        var before = new
        {
            existingProduct.ProductId,
            existingProduct.Name,
            existingProduct.CategoryId,
            existingProduct.UnitPrice,
            existingProduct.IsActive,
            QtyOnHand = existingProduct.InventoryItem?.QuantityOnHand
        };

        var wasActive = existingProduct.IsActive;
        existingProduct.IsActive = dto.IsActive;
        if (wasActive && !dto.IsActive && existingProduct.InventoryItem is not null)
        {
            existingProduct.InventoryItem.QuantityOnHand = 0;
            existingProduct.InventoryItem.UpdatedAt = DateTime.UtcNow;
        }

        existingProduct.CategoryId = dto.CategoryId;
        existingProduct.Name = dto.Name.Trim();
        existingProduct.Description = dto.Description?.Trim();
        existingProduct.UnitPrice = dto.UnitPrice;
        existingProduct.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();

        // snapshot AFTER
        var after = new
        {
            existingProduct.ProductId,
            existingProduct.Name,
            existingProduct.CategoryId,
            existingProduct.UnitPrice,
            existingProduct.IsActive,
            QtyOnHand = existingProduct.InventoryItem?.QuantityOnHand
        };

        // AUDIT
        await _audit.LogAsync(
            entityName: "Product",
            entityId: existingProduct.ProductId,
            action: "Update",
            changes: new { before, after }
        );


        return NoContent();
    }


    [HttpDelete("{id:long}")]
        public async Task<IActionResult> Product(long id, [FromServices] ILogger<ProductsController> _)
        {
            var existingProduct = await db.Products
                .Include(product => product.InventoryItem)
                .FirstOrDefaultAsync(product => product.ProductId == id);

            if (existingProduct is null) return NotFound();


        var before = new
        {
            existingProduct.ProductId,
            existingProduct.Name,
            existingProduct.IsActive,
            QtyOnHand = existingProduct.InventoryItem?.QuantityOnHand
        };

        existingProduct.IsActive = false;
            existingProduct.UpdatedAt = DateTime.UtcNow;

            if (existingProduct.InventoryItem is not null)
            {
                existingProduct.InventoryItem.QuantityOnHand = 0;
                existingProduct.InventoryItem.UpdatedAt = DateTime.UtcNow;
            }

            await db.SaveChangesAsync();


        await _audit.LogAsync(
       entityName: "Product",
       entityId: id,
       action: "Delete",
       changes: new { before, softDeleted = true, qtySetTo = 0 }
   );



        return NoContent();
        }
    }








