using System.Security.Claims;

namespace RetailManagementSystem.Security;

public static class UserExtensions
{
    public static long? GetUserId(this ClaimsPrincipal user)
    {
        var id = user.FindFirstValue("userId") ?? user.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(id, out var parsed) ? parsed : null;
    }
}
