// src/components/RequireAuth.tsx
import { type PropsWithChildren } from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import {
  selectIsAuthed,
  makeHasAnyRoleIdSelector,
  ROLE,
  type RoleId,
} from "../features/auth/roleUtils";

type Props = PropsWithChildren<{
  // You can pass role IDs [ROLE.Admin, ROLE.Manager] or names ["Admin","Manager"]
  roles?: RoleId[] | (keyof typeof ROLE)[];
}>;

function toRoleIds(roles?: Props["roles"]): RoleId[] {
  if (!roles || roles.length === 0) return [];
  // If first entry is a number, assume RoleId[]
  if (typeof roles[0] === "number") return roles as RoleId[];
  // Otherwise map names -> ids
  return (roles as (keyof typeof ROLE)[]).map((name) => ROLE[name]);
}

export default function RequireAuth({ roles, children }: Props) {
  const loc = useLocation();
  const isAuthed = useSelector(selectIsAuthed);
  const okByRole = useSelector(makeHasAnyRoleIdSelector(toRoleIds(roles)));

  if (!isAuthed) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (!okByRole) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}
