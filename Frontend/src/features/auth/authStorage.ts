// simple localStorage helpers
const KEY = "rms_auth_v1";

export type PersistedAuth = {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiresAt: number | null; // epoch ms
  user?: { userId: string; userName: string; roles: string[] } | null;
};

export function loadAuth(): PersistedAuth {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as PersistedAuth : { accessToken: null, refreshToken: null, tokenExpiresAt: null, user: null };
  } catch {
    return { accessToken: null, refreshToken: null, tokenExpiresAt: null, user: null };
  }
}

export function saveAuth(v: PersistedAuth) {
  localStorage.setItem(KEY, JSON.stringify(v));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
