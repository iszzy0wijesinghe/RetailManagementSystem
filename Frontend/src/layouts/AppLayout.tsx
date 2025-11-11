import Sidebar from "../components/Sidebar";
import { Outlet, useLocation } from "react-router-dom";
import "./appLayout.css";

export default function AppLayout() {
  const { pathname } = useLocation();
  const title =
    pathname.startsWith("/products") ? "Product Management" :
    pathname.startsWith("/orders") ? "Order Management" :
    pathname.startsWith("/discounts") ? "Discount Management" :
    pathname.startsWith("/inventory") ? "Inventory Management" :
    pathname.startsWith("/users") ? "User Management" : "Analytics";

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout__main">
        
        <div className="layout__content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}




// // src/layouts/AppLayout.tsx
// import Sidebar from "../components/Sidebar";
// import { Outlet, useLocation } from "react-router-dom";
// import type { PropsWithChildren, ReactNode } from "react";
// import "./appLayout.css";

// type AppLayoutProps = PropsWithChildren<{ children?: ReactNode }>;

// export default function AppLayout({ children }: AppLayoutProps) {
//   const { pathname } = useLocation();
//   const title =
//     pathname.startsWith("/products") ? "Product Management" :
//     pathname.startsWith("/orders") ? "Order Management" :
//     pathname.startsWith("/discounts") ? "Discount Management" :
//     pathname.startsWith("/inventory") ? "Inventory Management" :
//     pathname.startsWith("/users") ? "User Management" : "Analytics";

//   return (
//     <div className="layout">
//       <Sidebar />
//       <main className="layout__main">
//         <header className="layout__header">
//           <h1 className="layout__title">{title}</h1>
//         </header>
//         <div className="layout__content">
//           {/* If someone passed children (wrapper style), render it; otherwise use <Outlet/> (layout-route style) */}
//           {children ?? <Outlet />}
//         </div>
//       </main>
//     </div>
//   );
// }
