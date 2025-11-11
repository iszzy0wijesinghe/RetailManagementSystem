namespace RetailManagementSystem.Dtos;

public record OrderItemDto(
    long OrderItemId,
    long ProductId,
    string ProductName,
    decimal UnitPrice,
    int Quantity,
    decimal LineDiscount,
    decimal LineTotal);

public record OrderDetailsDto(
    long OrderId,
    string OrderNumber,
    long? CustomerId,
    string Status,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    bool IsActive,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    List<OrderItemDto> Items);

public record CreateOrderDto(
    long? CustomerId);

public record AddItemDto(
    long ProductId, 
    int Quantity);

public record PayOrderDto(
    long ChangedByUserId);

public record VoidOrderDto(
    string Reason);

public record OrderListItemDto(
    long OrderId,
    string OrderNumber,
    string Status,
    long? CustomerId,
    decimal Subtotal,
    decimal DiscountTotal,
    decimal TaxTotal,
    decimal GrandTotal,
    int ItemsCount,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record PagedResult<T>(
    IReadOnlyList<T> Items,
    int Page,
    int PageSize,
    long Total
);

