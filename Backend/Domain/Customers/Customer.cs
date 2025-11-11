using System.ComponentModel.DataAnnotations;
using RetailManagementSystem.Domain.Orders;

namespace RetailManagementSystem.Domain.Customers
{
    public class Customer
    {
        public long CustomerId { get; set; }
        [MaxLength(100)] public string FirstName { get; set; } = default!;
        [MaxLength(100)] public string LastName { get; set; } = default!;
        [MaxLength(200)] public string? Email { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public ICollection<CustomerPhone> Phones { get; set; } = new List<CustomerPhone>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
