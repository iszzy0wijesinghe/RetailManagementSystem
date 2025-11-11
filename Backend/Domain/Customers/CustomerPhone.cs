using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Customers
{
    public class CustomerPhone
    {
        public long CustomerPhoneId { get; set; }
        public long CustomerId { get; set; }
        [MaxLength(32)] public string PhoneNumber { get; set; } = default!;
        [MaxLength(50)] public string? Label { get; set; }
        public bool IsPrimary { get; set; }
        public Customer Customer { get; set; } = default!;
    }
}
