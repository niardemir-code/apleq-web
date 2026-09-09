import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { EmailAuthModal } from './EmailAuthModal';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export function WelcomeScreen() {
  const { signIn, authError, clearAuthError } = useAuth();
  const { isDark } = useTheme();
  const [emailModalMode, setEmailModalMode] = useState<'register' | 'login' | null>(null);

  return (
    <div className="min-h-screen bg-main text-foreground flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <img
            src={isDark ? '/apleq_lockup_web_oscuro.png' : '/apleq_lockup_web_claro.png'}
            alt="Apleq"
            className="h-16 w-auto object-contain select-none mb-3"
          />
          <p className="text-sm text-muted-foreground">
            Control inteligente de suscripciones
          </p>
        </div>

        {authError && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-3">
            <span>{authError}</span>
            <button
              onClick={clearAuthError}
              className="underline hover:text-rose-700 dark:hover:text-rose-200 cursor-pointer shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={signIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border border-border bg-card hover:bg-muted text-sm font-bold text-foreground shadow-sm transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 text-blue-500" />
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">o con correo electrónico</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => setEmailModalMode('register')}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-colors cursor-pointer"
        >
          Registrarme con correo
        </button>

        <button
          type="button"
          onClick={() => setEmailModalMode('login')}
          className="w-full mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer text-center"
        >
          ¿Ya tienes cuenta? Iniciar sesión con correo
        </button>

        <div className="mt-10 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Sincronización en la Nube</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tus suscripciones y miembros seguros y accesibles en cualquier dispositivo.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Privacidad y Control</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Tus datos viajan encriptados y asociados únicamente a tu cuenta.
              </p>
            </div>
          </div>
        </div>
      </div>

      <EmailAuthModal
        isOpen={emailModalMode !== null}
        initialMode={emailModalMode || 'register'}
        onClose={() => setEmailModalMode(null)}
      />
    </div>
  );
}
