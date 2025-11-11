using System.ComponentModel.DataAnnotations;

namespace RetailManagementSystem.Domain.Catalog
{
    public class Category
    {
        public long CategoryId { get; set; }
        [MaxLength(120)] public string Name { get; set; } = default!;
        public long? ParentCategoryId { get; set; }
        public Category? Parent { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public ICollection<Category> Children { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
