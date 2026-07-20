import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4 font-sans dark:bg-brand-950">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 shadow-xl dark:border-red-900/30 dark:bg-brand-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="mt-4 font-serif text-2xl font-semibold text-brand-900 dark:text-white">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-brand-600 dark:text-brand-300">
              An unexpected error occurred in the application view. Please reload or contact support
              if the issue persists.
            </p>
            {this.state.error && (
              <div className="mt-4 max-h-32 overflow-auto rounded bg-brand-50 p-3 text-xs font-mono text-red-700 dark:bg-brand-950 dark:text-red-400">
                {this.state.error.toString()}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 active:bg-brand-800 dark:bg-brand-500 dark:hover:bg-brand-400"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
