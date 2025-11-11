// src/pages/errors/OfflinePage.tsx
import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import ErrorShell from "../../components/errors/ErrorShell";
import animOffline from "../../assets/lottie/offline.json";

export default function OfflinePage() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <ErrorShell>
      <div className="err-anim"><Lottie animationData={animOffline} loop autoplay /></div>
      <h1 className="err-title">{online ? "Hooraay! " : "Hmmmmmmm!"}</h1>
      <p className="err-sub">
        {online ? "You’re connected again. Continue where you left off." : "Check your connection and try again."}
      </p>
      <div className="err-actions">
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </ErrorShell>
  );
}
