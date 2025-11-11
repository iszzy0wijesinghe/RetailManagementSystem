
import { Component, type ReactNode } from "react";
import GenericErrorPage from "../../pages/errors/GenericErrorPage";

type State = { hasError: boolean; message?: string };

export default class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(err: unknown): State {
    return { hasError: true, message: err instanceof Error ? err.message : String(err) };
  }
  render() {
    if (this.state.hasError) return <GenericErrorPage message={this.state.message} />;
    return this.props.children;
  }
}
