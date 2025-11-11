namespace RetailManagementSystem.Dtos;

public record CouponCreateDto(
    long DiscountId,
    string Code,
    int? UsageLimitTotal,
    int? UsageLimitPerCustomer,
    bool IsActive
);

public record CouponUpdateDto(
    string Code,
    int? UsageLimitTotal,
    int? UsageLimitPerCustomer,
    bool IsActive
);

public record CouponListItem(
    long CouponId,
    long DiscountId,
    string Code,
    bool IsActive,
    int? UsageLimitTotal,
    int? UsageLimitPerCustomer,
    int RedemptionCount
);

public record CouponDetailsDto(
    long CouponId,
    long DiscountId,
    string Code,
    bool IsActive,
    int? UsageLimitTotal,
    int? UsageLimitPerCustomer
);

public record ApplyCouponDto(string Code, long? CustomerId);