using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace RetailManagementSystem.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    private readonly AppDbContext _db;
    public TokenService(IConfiguration config, AppDbContext db)
    {
        _config = config; _db = db;
    }


    public async Task<(string token, DateTime expiresUtc)> IssueAccessTokenAsync(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roles = await _db.UserRoles
            .Where(ur => ur.UserId == user.UserId)
            .Select(ur => ur.Role.Name)
            .ToListAsync();

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.UserName),
            new Claim("uid", user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
        };
        claims.AddRange(roles.Select(r => new Claim(ClaimTypes.Role, r)));

        var expires = DateTime.UtcNow.AddMinutes(int.Parse(jwt["AccessTokenMinutes"]!));

        var token = new JwtSecurityToken(
            issuer: jwt["Issuer"],
            audience: jwt["Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }

    public async Task<string> IssueRefreshTokenAsync(User user)
    {
        var days = int.Parse(_config["Jwt:RefreshTokenDays"]!);
        var token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

        var row = new RefreshToken
        {
            UserId = user.UserId,
            Token = token,
            ExpiresAt = DateTime.UtcNow.AddDays(days)
        };
        _db.RefreshTokens.Add(row);
        await _db.SaveChangesAsync();
        return token;
    }

    public async Task<bool> RevokeRefreshTokenAsync(string token)
    {
        var row = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.Token == token && t.RevokedAt == null);
        if (row is null) return false;
        row.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }
}
