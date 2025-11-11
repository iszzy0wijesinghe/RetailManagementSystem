// src/components/RoleGate.tsx
import { type PropsWithChildren, type ReactNode } from "react";
import { useSelector } from "react-redux";
import {
  selectIsAuthed,
  makeHasAnyRoleIdSelector,
  type RoleId,
} from "../features/auth/roleUtils";

type Props = PropsWithChildren<{
  allow?: RoleId[];          // e.g. [ROLE.Admin, ROLE.Manager]
  fallback?: ReactNode;      // what to render if blocked
  requireAuth?: boolean;     // default true: hide if not logged in
}>;

export default function RoleGate({
  allow = [],
  fallback = null,
  requireAuth = true,
  children,
}: Props) {
  const isAuthed = useSelector(selectIsAuthed);
  const okByRole = useSelector(makeHasAnyRoleIdSelector(allow));

  if (requireAuth && !isAuthed) return <>{fallback}</>;
  if (!okByRole) return <>{fallback}</>;
  return <>{children}</>;
}
