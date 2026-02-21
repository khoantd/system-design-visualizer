import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, () =>
          this.setState({ hasError: false, error: null })
        );
      }

      return (
        <div
          className="flex flex-col items-center justify-center min-h-[200px] p-8 rounded-xl"
          style={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          <p className="text-lg font-semibold mb-2">Something went wrong</p>
          <p
            className="text-sm mb-4 text-center max-w-md"
            style={{ color: "var(--text-secondary)" }}
          >
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: "var(--accent-blue)",
              color: "white",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
