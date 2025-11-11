using Microsoft.AspNetCore.Identity;

namespace RetailManagementSystem.Services;

public class SeedService
{
    public static async Task EnsureSeedAsync(IServiceProvider sp)
    {
        using var scope = sp.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();

        // ensure roles
        var roleNames = new[] { "Admin", "Manager", "Cashier", "User" };
        foreach (var name in roleNames)
        {
            if (!await db.Roles.AnyAsync(role => role.Name == name))
                db.Roles.Add(new Role { Name = name, Description = $"{name} role" });
        }
        await db.SaveChangesAsync();

        // ensure a default admin if no users yet
        if (!await db.Users.AnyAsync())
        {
            var admin = new User
            {
                UserName = "admin",
                Email = "admin@local",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");
            db.Users.Add(admin);
            await db.SaveChangesAsync();

            var adminRoleId = await db.Roles.Where(role => role.Name == "Admin").Select(role => role.RoleId).FirstAsync();
            db.UserRoles.Add(new UserRole { UserId = admin.UserId, RoleId = adminRoleId });
            await db.SaveChangesAsync();
        }
    }
}
