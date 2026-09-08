import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App render error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen grid place-items-center bg-background px-6 text-center">
          <div>
            <h1 className="font-display text-3xl text-brand-black">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page. If this keeps happening, try again in a minute.
            </p>
            <button
              className="btn-yellow mt-6"
              onClick={() => window.location.assign("/")}
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
