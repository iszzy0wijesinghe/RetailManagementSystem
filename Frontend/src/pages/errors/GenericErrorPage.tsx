// src/pages/errors/GenericErrorPage.tsx
import Lottie from "lottie-react";
import ErrorShell from "../../components/errors/ErrorShell";
import animGeneric from "../../assets/lottie/oops.json";

type Props = { message?: string };

export default function GenericErrorPage({ message }: Props) {
  return (
    <ErrorShell>
      <div className="err-anim"><Lottie animationData={animGeneric} loop autoplay /></div>
      <div className="err-actions">
        <button className="btn-primary" onClick={() => window.location.reload()}>Retry</button>
      </div>
    </ErrorShell>
  );
}
