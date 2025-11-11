// src/features/users/types.ts

// ===== API DTOs / Models =====
export type UserListItem = {
  userId: number;
  userName: string;
  email?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;   // ISO string from API
  updatedAt: string;   // ISO string from API
};

export type UserDetailsDto = {
  userId: number;
  userName: string;
  email?: string | null;
  isActive: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
};

// Used by POST /auth/register when creating a user from the Users UI
export type RegisterDto = {
  userName: string;
  password: string;
  email?: string | null;
};

// Used by PUT /api/auth/users/{id}
export type UserUpdateDto = {
  userName: string;
  email?: string | null;
  newPassword?: string | null; // optional password change
};

// Optional: for a login form if you wire it here
export type LoginDto = {
  userName: string;
  password: string;
};

// Roles list (GET /api/auth/roles)
export type RoleListItem = {
  roleId: number;
  name: string;
  description?: string | null;
};
