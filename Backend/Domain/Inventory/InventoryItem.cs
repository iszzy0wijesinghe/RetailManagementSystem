using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RetailManagementSystem.Domain.Inventory
{
    public class InventoryItem
    {
        [Key]
        public long InventoryItemId { get; set; }

        public long ProductId { get; set; }

        public int QuantityOnHand { get; set; }

        public DateTime UpdatedAt { get; set; }

        [JsonIgnore]
        public Product Product { get; set; } = default!;
    }
}
