using RetailManagementSystem.Domain.Customers;

namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext db;
    public CustomersController(AppDbContext db) => this.db = db;


    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerListItem>>> Customer([FromQuery] bool includeInactive = false, [FromQuery] string? q = null)
    {
        var query = db.Customers.AsNoTracking();
        if (!includeInactive) query = query.Where(customer => customer.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(customer =>
                customer.FirstName.ToLower().Contains(term) ||
                customer.LastName.ToLower().Contains(term) ||
                (customer.Email != null && customer.Email.ToLower().Contains(term)) ||
                customer.Phones.Any(product => product.PhoneNumber.ToLower().Contains(term)));
        }

        var list = await query
            .OrderBy(customer => customer.FirstName).ThenBy(customer => customer.LastName)
            .Select(customer => new CustomerListItem(
                customer.CustomerId,
                customer.FirstName,
                customer.LastName,
                customer.Email,
                customer.IsActive,
                customer.Phones.Count))
            .ToListAsync();

        return Ok(list);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CustomerDetailsDto>> Customer(long id)
    {
        var dto = await db.Customers.AsNoTracking()
            .Where(customer => customer.CustomerId == id)
            .Select(customer => new CustomerDetailsDto(
                customer.CustomerId,
                customer.FirstName,
                customer.LastName,
                customer.Email,
                customer.IsActive,
                customer.Phones
                    .OrderBy(product => product.IsPrimary ? 0 : 1)
                    .ThenBy(product => product.CustomerPhoneId)
                    .Select(product => new CustomerPhoneItem(
                        product.CustomerPhoneId,
                        product.PhoneNumber,
                        product.Label,
                        product.IsPrimary))
                    .ToList()))
            .FirstOrDefaultAsync();

        return dto is null ? NotFound() : Ok(dto);
    }


    [HttpPost]
    public async Task<ActionResult<long>> Customer([FromBody] CustomerCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
            return BadRequest("FirstName and LastName are required.");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var exists = await db.Customers.AnyAsync(customer => customer.Email == dto.Email.Trim());
            if (exists) return Conflict("Email already in use.");
        }

        var row = new Customer
        {
            FirstName = dto.FirstName.Trim(),
            LastName = dto.LastName.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        db.Customers.Add(row);
        await db.SaveChangesAsync();
        return Ok(row.CustomerId);
    }


    [HttpPut("{id:long}")]
    public async Task<IActionResult> Customer(long id, [FromBody] CustomerUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName))
            return BadRequest("FirstName and LastName are required.");

        var row = await db.Customers.FirstOrDefaultAsync(customer => customer.CustomerId == id);
        if (row is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var exists = await db.Customers.AnyAsync(customer => customer.Email == dto.Email.Trim() && customer.CustomerId != id);
            if (exists) return Conflict("Email already in use.");
        }

        row.FirstName = dto.FirstName.Trim();
        row.LastName = dto.LastName.Trim();
        row.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();
        row.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Customer(long id, [FromServices] ILogger<CustomersController> _)
    {
        var row = await db.Customers.FirstOrDefaultAsync(customer => customer.CustomerId == id);
        if (row is null) return NotFound();

        db.Customers.Remove(row);
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:long}/phones")]
    public async Task<ActionResult<long>> Customer(long id, [FromBody] CustomerPhoneCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber)) return BadRequest("PhoneNumber required.");

        var customer = await db.Customers.Include(customer => customer.Phones).FirstOrDefaultAsync(customer => customer.CustomerId == id);
        if (customer is null) return NotFound();

        if (dto.IsPrimary)
        {
            foreach (var p in customer.Phones) p.IsPrimary = false;
        }

        var phone = new CustomerPhone
        {
            CustomerId = id,
            PhoneNumber = dto.PhoneNumber.Trim(),
            Label = dto.Label?.Trim(),
            IsPrimary = dto.IsPrimary
        };

        db.CustomerPhones.Add(phone);
        await db.SaveChangesAsync();
        return Ok(phone.CustomerPhoneId);
    }


    [HttpPut("{id:long}/phones/{phoneId:long}")]
    public async Task<IActionResult> Customer(long id, long phoneId, [FromBody] CustomerPhoneUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PhoneNumber)) return BadRequest("PhoneNumber required.");

        var customer = await db.Customers.Include(customer => customer.Phones).FirstOrDefaultAsync(customer => customer.CustomerId == id);
        if (customer is null) return NotFound();

        var phone = customer.Phones.FirstOrDefault(phone => phone.CustomerPhoneId == phoneId);
        if (phone is null) return NotFound();

        if (dto.IsPrimary)
        {
            foreach (var p in customer.Phones) p.IsPrimary = false;
        }

        phone.PhoneNumber = dto.PhoneNumber.Trim();
        phone.Label = dto.Label?.Trim();
        phone.IsPrimary = dto.IsPrimary;

        await db.SaveChangesAsync();
        return NoContent();
    }


    [HttpDelete("{id:long}/phones/{phoneId:long}")]
    public async Task<IActionResult> Customer(long id, long phoneId, [FromServices] ILogger<CustomersController> _)
    {
        var phone = await db.CustomerPhones.FirstOrDefaultAsync(phone => phone.CustomerId == id && phone.CustomerPhoneId == phoneId);
        if (phone is null) return NotFound();

        db.CustomerPhones.Remove(phone);
        await db.SaveChangesAsync();
        return NoContent();
    }


}
