using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Auth
{
    public class RefreshToken
    {
        public long RefreshTokenId { get; set; }
        public long UserId { get; set; }
        [MaxLength(200)] public string Token { get; set; } = default!;
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }
        public User User { get; set; } = default!;
    }
}
