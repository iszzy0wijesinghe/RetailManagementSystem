namespace RetailManagementSystem.Dtos;
public record CustomerCreateDto(
string FirstName,
string LastName,
string? Email
);

public record CustomerUpdateDto(
    string FirstName,
    string LastName,
    string? Email
);

public record CustomerListItem(
    long CustomerId,
    string FirstName,
    string LastName,
    string? Email,
    bool IsActive,
    int PhoneCount
);

public record CustomerPhoneCreateDto(
    string PhoneNumber,
    string? Label,
    bool IsPrimary
);

public record CustomerPhoneUpdateDto(
    string PhoneNumber,
    string? Label,
    bool IsPrimary
);

public record CustomerPhoneItem(
    long CustomerPhoneId,
    string PhoneNumber,
    string? Label,
    bool IsPrimary
);

public record CustomerDetailsDto(
    long CustomerId,
    string FirstName,
    string LastName,
    string? Email,
    bool IsActive,
    IEnumerable<CustomerPhoneItem> Phones
);

