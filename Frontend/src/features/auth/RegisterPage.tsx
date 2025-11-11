import { type FormEvent, useState } from "react";
import { useRegisterMutation, useLoginMutation } from "./authApi";

export default function RegisterPage() {
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, { isLoading, error }] = useRegisterMutation();
  const [login] = useLoginMutation();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await register({ userName, password, email: email || null }).unwrap();
    // auto-login after register
    await login({ userName, password }).unwrap();
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h3 className="mt-4 mb-3">Create account</h3>
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input className="form-control" value={userName} onChange={e => setUserName(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Email (optional)</label>
          <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div className="alert alert-danger">Registration failed</div>}
        <button className="btn btn-success w-100" disabled={isLoading}>Create account</button>
      </form>
    </div>
  );
}
