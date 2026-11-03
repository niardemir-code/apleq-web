import { useState } from 'react';
import { claimInvite } from '../lib/firebase';
import { t } from '../i18n';

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
      setMessage({ type: 'success', text: t('jg.success') });
      setCode('');
      // Cierre automático: pequeña pausa para que se alcance a leer el mensaje de éxito.
      setTimeout(() => {
        setMessage(null);
        onClose();
      }, 900);
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.message || t('jg.failed') });
    } finally {
      setLoading(false);
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
        <h2 className="text-lg font-black text-foreground mb-1">{t('common.joinGroup')}</h2>
        <p className="text-xs text-muted-foreground mb-4">
          {t('jg.text')}
        </p>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t('jg.placeholder')}
          maxLength={8}
          className="w-full bg-muted/60 text-foreground px-4 py-3 rounded-2xl border border-border text-center text-lg font-black tracking-widest uppercase focus:outline-none focus:border-blue-500"
        />
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
            {t('common.close')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !code.trim()}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm font-bold text-white transition-colors"
          >
            {loading ? t('jg.joining') : t('nav.join')}
          </button>
        </div>
      </div>
    </div>
  );
}
