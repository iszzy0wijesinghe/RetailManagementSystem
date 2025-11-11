using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Auth
{
    public class User
    {
        public long UserId { get; set; }
        [MaxLength(100)] public string UserName { get; set; } = default!;
        [MaxLength(320)] public string? Email { get; set; }
        public string PasswordHash { get; set; } = default!;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public long? CreatedBy { get; set; }
        public long? UpdatedBy { get; set; }
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();

    }
}
