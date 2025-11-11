namespace RetailManagementSystem.Dtos;

public record ProductStockReportItem(
    long ProductId,
    string Name,
    decimal UnitPrice,
    bool IsActive,
    int QuantityOnHand
);

public record SalesByDayItem(
    DateTime Date,
    int OrdersCount,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal
);

public record SalesByProductItem(
    long ProductId,
    string ProductName,
    int QuantitySold,
    decimal Revenue
);

public record InventoryMovementItem(
    DateTime OccurredAt,
    long ProductId,
    string ProductName,
    string RefType,
    long RefId,
    int QuantityDelta
);

public record DiscountImpactItem(
    DateTime Date,           // UTC date
    decimal DiscountTotal
);
