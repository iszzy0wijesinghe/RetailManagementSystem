// src/layouts/PosLayout.tsx
import { Outlet } from "react-router-dom";

export default function PosLayout() {
  return (
    <div className="pos-shell">
      <header className="pos-topbar">
        <div className="pos-brand">
          <span className="pos-logo">LoopCart POS</span>
          <span className="pos-sub">Supermarket</span>
        </div>

        <div className="pos-top-actions">
          <span id="posClock" className="pos-clock" />
        </div>
      </header>

      <main className="pos-main">
        <Outlet />
      </main>
    </div>
  );
}
