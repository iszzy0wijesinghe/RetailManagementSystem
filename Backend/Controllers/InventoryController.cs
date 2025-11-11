namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext db;
    public InventoryController(AppDbContext db) => this.db = db;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InventoryDetailsDto>>> Inventory()
    {
        var snapshots = await db.InventoryItems
            .AsNoTracking()
            .OrderBy(item => item.ProductId)
            .Select(item => new InventoryDetailsDto(
                item.InventoryItemId,
                item.ProductId,
                item.QuantityOnHand,
                item.UpdatedAt))
            .ToListAsync();

        return Ok(snapshots);
    }

    [HttpGet("{productId:long}")]
    public async Task<ActionResult<InventoryDetailsDto>> Inventory(long productId)
    {
        var snapshot = await db.InventoryItems
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.ProductId == productId);

        if (snapshot is null)
            return NotFound("Inventory entry not found for this product.");

        return Ok(new InventoryDetailsDto(
            snapshot.InventoryItemId,
            snapshot.ProductId,
            snapshot.QuantityOnHand,
            snapshot.UpdatedAt));
    }


    [HttpPost("adjust")]
    public async Task<IActionResult> Inventory([FromBody] AdjustStockDto dto)
    {
        if (dto is null) return BadRequest("Body required.");
        if (dto.QuantityDelta == 0) return BadRequest("QuantityDelta cannot be 0.");

        // ensure the snapshot exists (created when product was created)
        var snapshot = await db.InventoryItems.FirstOrDefaultAsync(item => item.ProductId == dto.ProductId);
        if (snapshot is null)
            return NotFound("Inventory entry not found (create product first).");

        // record manual adjustment
        db.StockAdjustments.Add(new StockAdjustment
        {
            ProductId = dto.ProductId,
            QuantityDelta = dto.QuantityDelta,
            Note = dto.Note,
            CreatedBy = 0,                   // replace with current user id when auth is added
            CreatedAt = DateTime.UtcNow
        });

        // write matching ledger movement
        db.StockLedger.Add(new StockLedger
        {
            ProductId = dto.ProductId,
            RefType = "ADJUSTMENT",
            RefId = 0,
            QuantityDelta = dto.QuantityDelta, // +in / -out
            Reason = dto.Note,
            OccurredAt = DateTime.UtcNow
        });

        // update snapshot
        snapshot.QuantityOnHand += dto.QuantityDelta;
        snapshot.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok();
    }

   


}
