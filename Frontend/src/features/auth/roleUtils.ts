// src/features/auth/roleUtils.ts
import type { RootState } from "../../app/store";

// Sitewide role-id map
export const ROLE = {
  User: 1,
  Admin: 2,
  Manager: 3,
  Cashier: 4,
} as const;

export type RoleId = (typeof ROLE)[keyof typeof ROLE];

// Is the user authenticated?
export const selectIsAuthed = (state: RootState) => Boolean(state.auth?.accessToken);

// Pull role IDs from auth slice; if only names exist, map names -> ids
export const selectRoleIds = (state: RootState): RoleId[] => {
  const ids: number[] | undefined = (state.auth as any)?.roleIds;
  if (Array.isArray(ids) && ids.length) return ids as RoleId[];

  const names: string[] = state.auth?.roles ?? [];
  const byName: Record<string, RoleId> = {
    user: ROLE.User,
    admin: ROLE.Admin,
    manager: ROLE.Manager,
    cashier: ROLE.Cashier,
  };
  return names
    .map((n) => byName[n.toLowerCase()])
    .filter((x): x is RoleId => typeof x === "number");
};

// Factory: returns a selector that checks if user has ANY of the allowed role IDs
export const makeHasAnyRoleIdSelector =
  (allowed: RoleId[] = []) =>
  (state: RootState) => {
    if (!allowed.length) return true;
    const have = new Set(selectRoleIds(state));
    return allowed.some((id) => have.has(id));
  };

// (Optional) ALL-roles version
export const makeHasAllRoleIdSelector =
  (required: RoleId[] = []) =>
  (state: RootState) => {
    if (!required.length) return true;
    const have = new Set(selectRoleIds(state));
    return required.every((id) => have.has(id));
  };
