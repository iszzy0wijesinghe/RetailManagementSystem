import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import PosLayout from "../layouts/PosLayout";
import ProductListPage from "../features/products/pages/ProductListPage";
import InventoryPage from "../features/inventory/pages/InventoryPage";
import OrdersPage from "../features/orders/pages/OrderPage";
import DiscountsPage from "../features/discounts/pages/DiscountListPage";
import CategoryPage from "../features/categories/pages/CategoryListPage";
import UsersPage from "../features/users/pages/UsersPage";
import PosPage from "../features/orders/pages/POSpage";
import LoginPage from "../features/auth/LoginPage";
import LogoutRoute from "../features/auth/LogoutRoute";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import RequireAuth from "../components/RequireAuth";
import ServerErrorPage from "../pages/errors/ServerErrorPage";
import OfflinePage from "../pages/errors/OfflinePage";
import GenericErrorPage from "../pages/errors/GenericErrorPage";

export const router = createBrowserRouter([
  // public
  { path: "/login", element: <LoginPage /> },
  { path: "/logout", element: <LogoutRoute /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/error/500", element: <ServerErrorPage /> },
  { path: "/error/offline", element: <OfflinePage /> },
  { path: "/error/oops", element: <GenericErrorPage /> },

  // app
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/products" replace /> },

      // Admin or Manager
      {
        path: "/products",
        element: (
          <RequireAuth roles={["Admin", "Manager"]}>
            <ProductListPage />
          </RequireAuth>
        ),
      },
      {
        path: "/inventory",
        element: (
          <RequireAuth roles={["Admin", "Manager"]}>
            <InventoryPage />
          </RequireAuth>
        ),
      },
      {
        path: "/orders",
        element: (
          <RequireAuth roles={["Admin", "Manager"]}>
            <OrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: "/discounts",
        element: (
          <RequireAuth roles={["Admin", "Manager"]}>
            <DiscountsPage />
          </RequireAuth>
        ),
      },
      {
        path: "/category",
        element: (
          <RequireAuth roles={["Admin", "Manager"]}>
            <CategoryPage />
          </RequireAuth>
        ),
      },

      // Admin only
      {
        path: "/users",
        element: (
          <RequireAuth roles={["Admin"]}>
            <UsersPage />
          </RequireAuth>
        ),
      },
    ],
  },

  // POS — allow Cashier, Manager, Admin
  {
    element: (
      <RequireAuth roles={["Cashier", "Manager", "Admin"]}>
        <PosLayout />
      </RequireAuth>
    ),
    children: [{ path: "/pos", element: <PosPage /> }],
  },

  // fallback
  { path: "*", element: <Navigate to="/" replace /> },
]);
