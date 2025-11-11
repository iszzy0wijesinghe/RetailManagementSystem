// src/features/auth/LoginPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation, useLazyMeQuery } from "./authApi";
import { useDispatch } from "react-redux";
import { setAuth, setProfile } from "./authSlice";
import "./login.css";
import logo from "../../components/images/logoblack.png";

export default function LoginPage() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const [login, { isLoading }] = useLoginMutation();
  const [getMe] = useLazyMeQuery();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const res = await login({ userName, password }).unwrap();
      dispatch(setAuth(res));

      // fetch current user profile
      const me = await getMe().unwrap();
      dispatch(setProfile(me));

      const goPos = (me.roles ?? []).some((r) => r.toLowerCase() === "cashier");
      navigate(goPos ? "/pos" : "/discounts", { replace: true });
    } catch (e: any) {
      setErr(e?.data ?? "Login failed");
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-left">
          <div className="brand">
            
            {/* <div className="brand-text">
              <div className="brand-name">LoopCart</div>
              <div className="brand-sub">RMS</div>
            </div> */}
            <div className="sb__brand">
              <img className="sb__logo" src={logo} alt="LoopCart" />
            </div>
          </div>

          <div className="welcome">
            <div className="hello">Welcome Back!</div>
            <div className="title">
              <span >Let’s</span>
              <span >Login</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <form className="form" onSubmit={onSubmit}>
            <label className="label">Username</label>
            <input
              className="input"
              autoFocus
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter username"
            />

            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />

            {err && <div className="error">{String(err)}</div>}

            <button className="btn-primary" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Login"}
            </button>

            <div className="note">
              Not a member?
              <br />
              Contact Admin to Register.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
