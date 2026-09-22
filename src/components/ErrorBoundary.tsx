import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State;
  public props: Props;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-screen h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Something went wrong</h2>
              <p className="text-xs text-neutral-400 mt-1">
                The game encountered an unexpected interface error.
              </p>
            </div>
            {this.state.error && (
              <div className="w-full bg-black/60 border border-white/5 rounded-xl p-3 text-left font-mono text-[11px] text-red-300 max-h-32 overflow-y-auto custom-scrollbar">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex items-center gap-3 w-full mt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-200 transition-colors"
              >
                Dismiss & Resume
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <RefreshCw size={14} />
                Reload Game
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
