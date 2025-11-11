// src/pages/errors/NotFoundPage.tsx
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import ErrorShell from "../../components/errors/ErrorShell";
import animNotFound from "../../assets/lottie/404.json";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <ErrorShell>
      <div className="err-anim"><Lottie animationData={animNotFound} loop autoplay /></div>
      <h1 className="err-title">Page not found</h1>
      <p className="err-sub">The link might be broken or the page may have moved.</p>
      <div className="err-actions">
        <button className="btn-primary" onClick={() => navigate("/", { replace: true })}>Go Home</button>
        <button className="btn-ghost" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </ErrorShell>
  );
}
