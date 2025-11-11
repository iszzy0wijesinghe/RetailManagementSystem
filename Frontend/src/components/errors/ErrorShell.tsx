
import { type PropsWithChildren } from "react";
import "./error-pages.css";

export default function ErrorShell({ children }: PropsWithChildren) {
  return (
    <div className="err-wrap">
      <div className="err-card">{children}</div>
    </div>
  );
}
