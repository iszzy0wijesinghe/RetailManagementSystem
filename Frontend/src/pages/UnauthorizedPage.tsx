// src/features/auth/UnauthorizedPage.tsx
import { FiLock, FiLogOut } from "react-icons/fi";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLogoutMutation } from "../features/auth/authApi";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout as logoutAction } from "../features/auth/authSlice";
import "./unauthorized.css";
import Lottie from "lottie-react";
import animUnauthorized from "../assets/lottie/unauthorized.json";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logoutApi, { isLoading }] = useLogoutMutation();
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);

  async function handleLogout() {
    try {
      // Try server-side logout (ok if it 401s)
      if (refreshToken) {
        await logoutApi().unwrap(); // our authApi sends refreshToken from localStorage
      }
    } catch {
      // ignore – we'll still clear client state
    } finally {
      dispatch(logoutAction());
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="unauth-wrap">
      <div className="unauth-cards">

        <div className="unauth-anim">
          <Lottie animationData={animUnauthorized} loop autoplay /> {/* ✅ */}
        </div>

        <h1 className="unauth-title">Unauthorized</h1>
        <p className="unauth-sub">You don’t have permission to view this page. </p>
        <p className="unauth-sub" style={{marginTop: -20 }}>Try difference credentials.</p>

        <div className="unauth-actions">
          <button className="btn-primary" onClick={handleLogout} disabled={isLoading}>
            <FiLogOut style={{ marginRight: 8 }} />
            {isLoading ? "Signing out…" : "Re-Login"}
          </button>

          {/* <Link className="btn-link" to="/">
            Go to Dashboard
          </Link> */}
        </div>
      </div>
    </div>
  );
}
