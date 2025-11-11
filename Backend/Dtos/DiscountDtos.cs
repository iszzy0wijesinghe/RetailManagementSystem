namespace RetailManagementSystem.Dtos;

public record DiscountCreateDto(
    string Name,
    string Type,
    decimal Value,
    string Scope,
    bool IsStackable,
    int Priority,
    DateTime? StartsAt,
    DateTime? EndsAt,
    decimal? MinBasketSubtotal,
    decimal? MaxTotalDiscount
);

public record DiscountUpdateDto(
    string Name,
    string Type,
    decimal Value,
    string Scope,
    bool IsStackable,
    int Priority,
    DateTime? StartsAt,
    DateTime? EndsAt,
    decimal? MinBasketSubtotal,
    decimal? MaxTotalDiscount
);

public record DiscountListItem(
    long DiscountId,
    string Name,
    string Type,
    decimal Value,
    string Scope,
    bool IsActive,
    int Priority,
    DateTime? StartsAt,
    DateTime? EndsAt,
    int CategoryCount,
    int ProductCount,
    int CouponCount
);

public record DiscountDetailsDto(
    long DiscountId,
    string Name,
    string Type,
    decimal Value,
    string Scope,
    bool IsActive,
    int Priority,
    DateTime? StartsAt,
    DateTime? EndsAt,
    decimal? MinBasketSubtotal,
    decimal? MaxTotalDiscount,
    IEnumerable<long> CategoryIds,
    IEnumerable<long> ProductIds
);

public record DiscountLinkCategoryDto(long CategoryId);
public record DiscountLinkProductDto(long ProductId);
