import { useState } from 'react';
import { deleteAccountCall, logoutUser } from '../lib/firebase';

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
        setError('Está tardando más de lo normal. Comprueba tu conexión y vuelve a intentarlo; si el problema persiste, revisa la consola del navegador (F12) para más detalles.');
      } else {
        setError(e?.message || 'No se pudo eliminar la cuenta. Inténtalo de nuevo.');
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
        <h2 className="text-lg font-black text-foreground mb-2">¿Eliminar tu cuenta?</h2>
        <p className="text-xs text-muted-foreground mb-1">
          Esta acción es irreversible. Se borrarán todas tus suscripciones, y dejarás de aparecer
          en los grupos de otros donde participas (esas plazas quedarán pendientes de eliminar).
          No podrás recuperar tu cuenta ni tus datos.
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
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-sm font-bold text-white transition-colors cursor-pointer"
          >
            {loading ? 'Eliminando...' : 'Eliminar mi cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}
