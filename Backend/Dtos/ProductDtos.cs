namespace RetailManagementSystem.Dtos;

public record ProductCreateDto(
    long CategoryId, 
    string Name, 
    string? Description, 
    decimal UnitPrice);

public record ProductUpdateDto(
    long CategoryId, 
    string Name, 
    string? Description, 
    decimal UnitPrice,
    bool IsActive
    );

public record ProductListItem(
    long ProductId,
    long CategoryId,
    string Name, 
    decimal UnitPrice, 
    bool IsActive, 
    int QuantityOnHand);

public record ProductDetailsDto(
    long ProductId,
    long CategoryId,
    string Name,
    string? Description,
    decimal UnitPrice,
    bool IsActive,
    long? InventoryItemId,
    int? QuantityOnHand,
    DateTime? InventoryUpdatedAt);
