import { useState } from 'react';
import { deleteAccountCall, logoutUser } from '../lib/firebase';
import { t } from '../i18n';
import { DELETE_ACCOUNT_URL } from '../lib/legalLinks';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.race([
        deleteAccountCall(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 25000)
        ),
      ]);
      // La cuenta ya no existe en Firebase Auth, pero el token de sesión sigue
      // siendo válido en el navegador hasta que caduque. Hay que cerrar sesión
      // explícitamente para que la app vuelva a la pantalla de bienvenida.
      onClose();
      await logoutUser().catch(() => {
        // Si el cierre de sesión fallara, recargamos como último recurso:
        // sin cuenta, la app debe volver a la pantalla de bienvenida igualmente.
        window.location.reload();
      });
    } catch (e: any) {
      console.error('Error al eliminar la cuenta:', e);
      if (e?.message === 'TIMEOUT') {
        setError(t('del.slow'));
      } else {
        setError(e?.message || t('del.failed'));
      }
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
        <h2 className="text-lg font-black text-foreground mb-2">{t('del.title')}</h2>
        <p className="text-xs text-muted-foreground mb-1">
          {t('del.body')}
        </p>
        <p className="text-[11px] text-center mt-3">
          <a
            href={DELETE_ACCOUNT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground underline hover:text-foreground"
          >
            {t('legal.deleteInfo')}
          </a>
        </p>
        {error && (
          <p className="text-xs mt-3 font-bold text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-muted/60 hover:bg-muted border border-border text-sm font-bold text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            {loading ? t('del.working') : t('nav.deleteAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
