// src/features/auth/types.ts
export type LoginDto = {
  userName: string;
  password: string;
};

export type RegisterDto = {
  userName: string;
  password: string;
  email?: string | null;
};

export type AuthResponseDto = {
  accessToken: string;
  refreshToken: string;
  // your API returns a DateTime — keep as ISO string on the client
  expiresAtUtc: string;
};

export type MeResponse = {
  userId: string | null;   // backend returns string (claim) and may be null
  userName: string;
  roles: string[];
};
