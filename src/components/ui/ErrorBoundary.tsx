"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("DiveFinder UI error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-xl2 border border-coral-400/40 bg-coral-400/5 p-6 text-center">
            <p className="font-medium text-abyss-900">Something went wrong.</p>
            <p className="mt-1 text-sm text-abyss-500">Try reloading this page.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
