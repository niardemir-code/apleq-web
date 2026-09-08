import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { friendlyAuthErrorMessage } from '../lib/firebase';

interface EmailAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailAuthModal({ isOpen, onClose }: EmailAuthModalProps) {
  const { registerWithEmailPassword, loginWithEmailPassword } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const passwordTooShort = password.length > 0 && password.length < 6;
  const passwordsMismatch = mode === 'register' && confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    email.trim().length > 3 &&
    password.length >= 6 &&
    (mode === 'login' || (name.trim().length > 0 && password === confirmPassword));

  const resetFields = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        await registerWithEmailPassword(email, password, name);
      } else {
        await loginWithEmailPassword(email, password);
      }
      resetFields();
      onClose();
    } catch (e: any) {
      setError(friendlyAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-2 mb-5 bg-muted/60 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              mode === 'register' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              mode === 'login' ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ya tengo cuenta
          </button>
        </div>

        <h2 className="text-lg font-black text-foreground mb-1">
          {mode === 'register' ? 'Registrarme con correo' : 'Iniciar sesión con correo'}
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {mode === 'register'
            ? 'Crea tu cuenta para sincronizar tus suscripciones.'
            : 'Introduce tus datos para acceder.'}
        </p>

        <div className="space-y-3">
          {mode === 'register' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:border-blue-500"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border border-border text-sm focus:outline-none focus:border-blue-500"
          />
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className={`w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border text-sm focus:outline-none ${
                passwordTooShort ? 'border-rose-500' : 'border-border focus:border-blue-500'
              }`}
            />
            {mode === 'register' && (
              <p className={`text-[11px] mt-1.5 px-1 ${passwordTooShort ? 'text-rose-500 font-semibold' : 'text-muted-foreground'}`}>
                {passwordTooShort ? 'Demasiado corta: mínimo 6 caracteres' : 'Mínimo 6 caracteres'}
              </p>
            )}
          </div>
          {mode === 'register' && (
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className={`w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border text-sm focus:outline-none ${
                  passwordsMismatch ? 'border-rose-500' : 'border-border focus:border-blue-500'
                }`}
              />
              {passwordsMismatch && (
                <p className="text-[11px] mt-1.5 px-1 text-rose-500 font-semibold">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs mt-3 text-center font-semibold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            {loading ? 'Un momento...' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
