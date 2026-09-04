import { useState } from 'react';
import { claimInvite } from '../lib/firebase';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    const clean = code.trim();
    if (!clean) return;
    setLoading(true);
    setMessage(null);
    try {
      await claimInvite(clean);
      setMessage({ type: 'success', text: '¡Te has unido al grupo!' });
      setCode('');
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || 'No se pudo unir. Revisa el código.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCode(text.trim());
    } catch {
      setMessage({ type: 'error', text: 'No se pudo leer el portapapeles. Pega con Ctrl+V.' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-black text-foreground mb-1">Unirse a un grupo</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Introduce el código de invitación que te han compartido.
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej. 7K3-P9M"
          maxLength={8}
          className="w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border border-border text-center text-lg font-black tracking-widest uppercase focus:outline-none focus:border-blue-500"
        />
        <button
          type="button"
          onClick={handlePaste}
          className="mt-2 w-full py-2 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-xs font-bold text-foreground transition-colors cursor-pointer"
        >
          Pegar del portapapeles
        </button>
        {message && (
          <p
            className={`text-xs mt-3 text-center font-semibold ${
              message.type === 'success'
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {message.text}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white transition-colors"
          >
            {loading ? 'Uniéndote...' : 'Unirse'}
          </button>
        </div>
      </div>
    </div>
  );
}
