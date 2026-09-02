import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
import { logoutUser } from '../lib/firebase';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Splitzy React Uncaught Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleSignOutAndReload = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.error(e);
    }
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-3xl bg-[#0f0f0f] border border-slate-800 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Problema al cargar los datos
            </h2>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {this.state.error?.message || 'Se ha producido un error al sincronizar con tu cuenta.'}
            </p>

            <div className="space-y-2.5">
              <button
                onClick={this.handleReset}
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-600/25"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar y Recargar</span>
              </button>

              <button
                onClick={this.handleSignOutAndReload}
                type="button"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Cerrar sesión de Google y entrar como invitado</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
