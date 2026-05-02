import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("ErrorBoundary caught:", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="simulation-wrap" style={{ display: "grid", placeItems: "center", padding: "32px", textAlign: "center" }}>
          <p style={{ color: "#fb7185", fontWeight: 800, margin: "0 0 8px" }}>3D view encountered an error</p>
          <p style={{ color: "#a7b2ad", fontSize: "0.85rem", margin: "0 0 16px", maxWidth: "400px" }}>
            {this.state.errorMessage}
          </p>
          <p style={{ color: "#61706a", fontSize: "0.78rem", margin: 0 }}>
            Switch to 2D mode or try resetting the scene.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
