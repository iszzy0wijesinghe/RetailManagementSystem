using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace RetailManagementSystem.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext db;
    private readonly IPasswordHasher<User> hasher;
    private readonly TokenService tokens;

    public AuthController(AppDbContext db, IPasswordHasher<User> hasher, TokenService tokens)
    {
        this.db = db; this.hasher = hasher; this.tokens = tokens;
    }


    //(GET /api/auth/users)
    [HttpGet("users")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<UserLiteDto>>> Auth(
        [FromQuery] bool includeInactive = false,
        [FromQuery] string? q = null)
    {
        var query = db.Users
            .AsNoTracking()
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .AsQueryable();

        if (!includeInactive) query = query.Where(u => u.IsActive);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim().ToLower();
            query = query.Where(u =>
                u.UserName.ToLower().Contains(term) ||
                (u.Email != null && u.Email.ToLower().Contains(term)));
        }

        var list = await query
            .OrderBy(u => u.UserName)
            .Select(u => new UserLiteDto(
                u.UserId,
                u.UserName,
                u.Email,
                u.IsActive,                                 
                u.UserRoles.Select(ur => ur.Role.Name).ToArray()
            ))
            .ToListAsync();

        return Ok(list);
    }


    // GET: /api/auth/users/{id}
    [HttpGet("users/{id:long}")]
    [Authorize]
    public async Task<ActionResult<UserDetailsDto>> Auth(long id)
    {
        var u = await db.Users
            .Include(x => x.UserRoles).ThenInclude(user => user.Role)
            .FirstOrDefaultAsync(x => x.UserId == id);

        if (u is null) return NotFound();

        var roles = u.UserRoles.Select(user => user.Role.Name).ToArray();
        var roleIds = u.UserRoles.Select(user => user.RoleId).ToArray();

        return Ok(new UserDetailsDto(u.UserId, u.UserName, u.Email, u.IsActive, roles, roleIds, u.CreatedAt, u.UpdatedAt));
    }


    // GET: /api/auth/roles
    [HttpGet("roles")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<object>>> Auth([FromQuery] string? q = null)
    {
        var rolesQuery = db.Roles.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            rolesQuery = rolesQuery.Where(r => r.Name.Contains(term) || (r.Description != null && r.Description.Contains(term)));
        }

        var roles = await rolesQuery
            .OrderBy(r => r.Name)
            .Select(r => new
            {
                r.RoleId,
                r.Name,
                r.Description
            })
            .ToListAsync();

        return Ok(roles);
    }


    // POST: /api/auth/register
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<long>> Auth([FromBody] RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest("Username and password required.");

        if (await db.Users.AnyAsync(user => user.UserName == dto.UserName))
            return Conflict("Username already exists.");
        if (!string.IsNullOrWhiteSpace(dto.Email) && await db.Users.AnyAsync(user => user.Email == dto.Email))
            return Conflict("Email already used.");

        var user = new User
        {
            UserName = dto.UserName.Trim(),
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim(),
            PasswordHash = "",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user.PasswordHash = hasher.HashPassword(user, dto.Password);

        var role = await db.Roles.FirstOrDefaultAsync(r => r.Name == "User");
        if (role is null) { role = new Role { Name = "User", Description = "Default user role" }; db.Roles.Add(role); }
        db.Users.Add(user);
        await db.SaveChangesAsync();

        db.UserRoles.Add(new UserRole { UserId = user.UserId, RoleId = role.RoleId });
        await db.SaveChangesAsync();

        return Ok(user.UserId);
    }


    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Auth([FromBody] LoginDto dto)
    {
        var user = await db.Users
            .Include(user => user.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(user => user.UserName == dto.UserName);

        if (user is null || !user.IsActive) return Unauthorized("Invalid credentials.");
        var check = hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
        if (check == PasswordVerificationResult.Failed) return Unauthorized("Invalid credentials.");

        var (access, exp) = await tokens.IssueAccessTokenAsync(user);
        var refresh = await tokens.IssueRefreshTokenAsync(user);
        return Ok(new AuthResponseDto(access, refresh, exp));
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Auth([FromBody] RefreshRequestDto dto)
    {
        var row = await db.RefreshTokens.Include(row => row.User).FirstOrDefaultAsync(row => row.Token == dto.RefreshToken);
        if (row is null || row.RevokedAt != null || row.ExpiresAt <= DateTime.UtcNow) return Unauthorized("Invalid or expired refresh token.");
        if (row.User is null || !row.User.IsActive) return Unauthorized("User not active.");

        row.RevokedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var (access, exp) = await tokens.IssueAccessTokenAsync(row.User);
        var refresh = await tokens.IssueRefreshTokenAsync(row.User);
        return Ok(new AuthResponseDto(access, refresh, exp));
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Auth([FromBody] RevokeRefreshDto dto)
    {
        var ok = await tokens.RevokeRefreshTokenAsync(dto.RefreshToken);
        return ok ? Ok() : NotFound();
    }


    [HttpGet("me")]
    [Authorize]
    public IActionResult Auth()
    {
        var uid = User.Claims.FirstOrDefault(c => c.Type == "uid")?.Value;
        var name = User.Identity?.Name ?? "";
        var roles = User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToArray();
        return Ok(new { userId = uid, userName = name, roles });
    }





    // PUT: /api/auth/users/{id}
    [HttpPut("users/{id:long}")]
    [Authorize]
    public async Task<IActionResult> Auth(long id, [FromBody] UserUpdateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.UserName))
            return BadRequest("UserName required.");

        var user = await db.Users.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null) return NotFound();

        // unique checks
        var nameTaken = await db.Users.AnyAsync(x => x.UserName == dto.UserName && x.UserId != id);
        if (nameTaken) return Conflict("Username already exists.");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var emailTaken = await db.Users.AnyAsync(x => x.Email == dto.Email && x.UserId != id);
            if (emailTaken) return Conflict("Email already used.");
        }

        user.UserName = dto.UserName.Trim();
        user.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email.Trim();

        if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            user.PasswordHash = hasher.HashPassword(user, dto.NewPassword);

        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }


    // PUT: /api/auth/users/{id}/active?value=true|false
    [HttpPut("users/{id:long}/active")]
    [Authorize]
    public async Task<IActionResult> Auth(long id, [FromQuery] bool value = true)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null) return NotFound();

        user.IsActive = value;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }



    // DELETE: /api/auth/users/{id}  -> soft delete (IsActive = false)
    [HttpDelete("users/{id:long}")]
    [Authorize]
    public async Task<IActionResult> Auth(long id, [FromQuery] string op = "soft")
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.UserId == id);
        if (user is null) return NotFound();

        if (!user.IsActive) return NoContent();
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return NoContent();
    }




    // POST: /api/auth/users/{id}/roles
    [HttpPost("users/{id:long}/roles")]
    [Authorize]
    public async Task<IActionResult> AuthLinkRole(long id, [FromBody] LinkRoleDto dto)
    {
        var user = await db.Users.Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.UserId == id);
        if (user is null) return NotFound("User not found.");

        var role = await db.Roles.FirstOrDefaultAsync(r => r.RoleId == dto.RoleId);
        if (role is null) return NotFound("Role not found.");

        var exists = user.UserRoles.Any(ur => ur.RoleId == dto.RoleId);
        if (!exists)
        {
            db.UserRoles.Add(new UserRole { UserId = id, RoleId = dto.RoleId });
            await db.SaveChangesAsync();
        }
        return Ok();
    }




    // DELETE: /api/auth/users/{id}/roles/{roleId}   -> unlink a role from a user
    [HttpDelete("users/{id:long}/roles/{roleId:long}")]
    [Authorize]
    public async Task<IActionResult> AuthUnlinkRole(long id, long roleId)
    {
        var link = await db.UserRoles.FirstOrDefaultAsync(ur => ur.UserId == id && ur.RoleId == roleId);
        if (link is null) return NotFound("Role link not found.");

        db.UserRoles.Remove(link);
        await db.SaveChangesAsync();
        return NoContent();
    }

}
