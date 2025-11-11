using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Auth
{
    public class Role
    {
        public long RoleId { get; set; }
        [MaxLength(50)] public string Name { get; set; } = default!;
        [MaxLength(200)] public string? Description { get; set; }
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
