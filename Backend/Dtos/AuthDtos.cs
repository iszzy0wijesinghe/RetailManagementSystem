namespace RetailManagementSystem.Dtos;

public record RegisterDto(
    string UserName, 
    string Password, 
    string? Email
    );
public record LoginDto(
    string UserName, 
    string Password
    );
public record RefreshRequestDto(
    string RefreshToken
    );
public record AuthResponseDto(
    string AccessToken, 
    string RefreshToken, 
    DateTime ExpiresAtUtc
    );

public record CreateUserDto(
    string UserName, 
    string Password, 
    string? Email
    );
public record SetRoleDto(
    string RoleName
    );

public record RevokeRefreshDto(
    string RefreshToken
    );



public record UserLiteDto(
    long UserId, 
    string UserName,
    string? Email, 
    bool IsActive, 
    string[] Roles
    );
public record UserDetailsDto(
    long UserId, 
    string UserName, 
    string? Email, 
    bool IsActive,         
    string[] Roles, 
    long[] RoleIds, 
    DateTime CreatedAt, 
    DateTime UpdatedAt
    );
public record UserUpdateDto(
    string UserName, 
    string? Email, 
    string? NewPassword
    );
public record LinkRoleDto(
    long RoleId
    );