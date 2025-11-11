namespace RetailManagementSystem.Dtos;

public record AdjustStockDto(
    long ProductId, 
    int QuantityDelta, 
    string? Note);

public record InventoryDetailsDto(
    long InventoryItemId,
    long ProductId,
    int QuantityOnHand,
    DateTime UpdatedAt);

//public record UpdateOrderStatusDto(
//    string Status,
//    long ChangedByUserId
//);

