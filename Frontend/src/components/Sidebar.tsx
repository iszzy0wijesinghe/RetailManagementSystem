// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import "./sidebar.css";
import logo from "./images/logowhite.png";
import RoleGate from "./RoleGate";
import { ROLE } from "../features/auth/roleUtils";

export default function Sidebar() {
  return (
    <aside className="sb">
      <div className="sb__brand">
        <img className="sb__logo" src={logo} alt="LoopCart" />
      </div>

      <nav className="sb__nav">
        {/* Analytics: any authenticated user */}
        <RoleGate requireAuth>
          <NavLink
            to={ROUTES.dashboard}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-chart-histogram" />
            </span>
            <span>Analytics</span>
          </NavLink>
        </RoleGate>

        {/* Product Management (Admin, Manager) */}
        <RoleGate allow={[ROLE.Admin]}>
          <NavLink
            to={ROUTES.products}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-box-open" />
            </span>
            <span>Product Management</span>
          </NavLink>
        </RoleGate>

        {/* Order Management (Admin, Manager) */}
        <RoleGate allow={[ROLE.Admin, ROLE.Manager]}>
          <NavLink
            to={ROUTES.orders}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-receipt" />
            </span>
            <span>Order Management</span>
          </NavLink>
        </RoleGate>

        {/* Discount Management (Admin, Manager) */}
        <RoleGate allow={[ROLE.Admin, ROLE.Manager]}>
          <NavLink
            to={ROUTES.discounts}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-tags" />
            </span>
            <span>Discount Management</span>
          </NavLink>
        </RoleGate>

        {/* Inventory Management (Admin, Manager) */}
        <RoleGate allow={[ROLE.Admin, ROLE.Manager]}>
          <NavLink
            to={ROUTES.inventory}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-warehouse-alt" />
            </span>
            <span>Inventory Management</span>
          </NavLink>
        </RoleGate>

        {/* Category Management (Admin, Manager) */}
        <RoleGate allow={[ROLE.Admin, ROLE.Manager]}>
          <NavLink
            to={ROUTES.category}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-shopping-basket" aria-hidden="true" />
            </span>
            <span>Category Management</span>
          </NavLink>
        </RoleGate>

        {/* User Management (Admin only) */}
        <RoleGate allow={[ROLE.Admin]}>
          <NavLink
            to={ROUTES.users}
            className={({ isActive }) => `sb__link ${isActive ? "is-active" : ""}`}
          >
            <span className="sb__icon">
              <i className="fi fi-rr-users-alt" />
            </span>
            <span>User Management</span>
          </NavLink>
        </RoleGate>
      </nav>

      <div className="sb__footer">
        <NavLink
          to={ROUTES.logout}
          className={({ isActive }) =>
            `sb__link sb__logout ${isActive ? "is-active" : ""}`
          }
        >
          <span className="sb__icon">
            <i className="fi fi-rr-sign-out-alt" />
          </span>
          <span>Logout</span>
        </NavLink>
      </div>
    </aside>
  );
}
















// import { NavLink } from "react-router-dom";
// import { ROUTES } from "../constants/routes";
// import "./sidebar.css";
// import logo from "./images/logowhite.png";

// export default function Sidebar() {
//   return (
//     <aside className="sb">
//       <div className="sb__brand">
//         {/* Logo image instead of emoji mark */}
//         <img className="sb__logo" src={logo} alt="LoopCart" />
//       </div>

//       <nav className="sb__nav">
//         <NavLink
//           to={ROUTES.dashboard}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-chart-histogram" />
//           </span>
//           <span>Analytics</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.products}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-box-open" />
//           </span>
//           <span>Product Management</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.orders}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-receipt" />
//           </span>
//           <span>Order Management</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.discounts}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-tags" />
//           </span>
//           <span>Discount Management</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.inventory}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-warehouse-alt" />
//           </span>
//           <span>Inventory Management</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.category}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-shopping-basket" aria-hidden="true" />
//           </span>
//           <span>Category Management</span>
//         </NavLink>

//         <NavLink
//           to={ROUTES.users}
//           className={({ isActive }) =>
//             `sb__link ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-users-alt" />
//           </span>
//           <span>User Management</span>
//         </NavLink>
//       </nav>

//       <div className="sb__footer">
//         <NavLink
//           to={ROUTES.logout}
//           className={({ isActive }) =>
//             `sb__link sb__logout ${isActive ? "is-active" : ""}`
//           }
//         >
//           <span className="sb__icon">
//             <i className="fi fi-rr-sign-out-alt" />
//           </span>
//           <span>Logout</span>
//         </NavLink>
//       </div>
//     </aside>
//   );
// }
