// src/pages/errors/ServerErrorPage.tsx
import Lottie from "lottie-react";
import ErrorShell from "../../components/errors/ErrorShell";
import animServer from "../../assets/lottie/500.json";

export default function ServerErrorPage() {
  return (
    <ErrorShell>
      <div className="err-anim"><Lottie animationData={animServer} loop autoplay /></div>
      {/* <h1 className="err-title">Server error</h1>
      <p className="err-sub">Our servers had a hiccup. Please try again.</p> */}
      <div className="err-actions">
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </ErrorShell>
  );
}
