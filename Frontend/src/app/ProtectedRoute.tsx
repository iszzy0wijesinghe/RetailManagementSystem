// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";

export default function ProtectedRoute() {
  const token = useSelector((s: RootState) => s.auth.accessToken) || localStorage.getItem("accessToken");
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
