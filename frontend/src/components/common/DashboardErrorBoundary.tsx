"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Section name displayed in the fallback (e.g. "My Appointments") */
  sectionName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

/**
 * Localized dashboard error boundary.
 * Wraps individual dashboard sections to prevent one section from
 * crashing the entire page. Keeps the rest of the dashboard functional.
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[DashboardErrorBoundary] Error in section "${this.props.sectionName}":`,
        error,
        info
      );
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 flex items-start gap-4">
          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg
              className="w-4 h-4 text-orange-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800 mb-1">
              {this.props.sectionName
                ? `${this.props.sectionName} failed to load`
                : "This section failed to load"}
            </p>
            <p className="text-xs text-orange-600 mb-3">
              The rest of your dashboard is still available.
            </p>
            <button
              onClick={this.handleRetry}
              className="text-xs font-semibold text-orange-700 hover:text-orange-900 underline-offset-2 hover:underline transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
