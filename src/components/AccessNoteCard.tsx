import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { getAccessNote, saveAccessNote } from '../services/subscriptionService';
import { t } from '../i18n';

interface AccessNoteCardProps {
  userId: string;
  subscriptionId: string | number;
}

export function AccessNoteCard({ userId, subscriptionId }: AccessNoteCardProps) {
  const subId = String(subscriptionId);
  const [note, setNote] = useState<string | null>(null); // null = cargando
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setNote(null);
    setRevealed(false);
    setEditing(false);
    setError(false);
    getAccessNote(userId, subId)
      .then((v) => { if (!cancelled) setNote(v); })
      .catch(() => { if (!cancelled) setNote(''); });
    return () => { cancelled = true; };
  }, [userId, subId]);

  const persist = async (value: string) => {
    setSaving(true);
    setError(false);
    try {
      await saveAccessNote(userId, subId, value);
      setNote(value.trim().slice(0, 500));
      setEditing(false);
      setRevealed(false);
    } catch (e) {
      console.error('No se pudieron guardar los datos de acceso', e);
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('an.deleteConfirm'))) persist('');
  };

  if (note === null) return null;

  const btn =
    'px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold text-foreground hover:bg-muted cursor-pointer';

  return (
    <div className="p-4 rounded-2xl bg-muted/30 border border-border">
      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-1">
        <Lock className="w-3.5 h-3.5" />
        <span>{t('an.title')}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2">{t('an.help')}</p>

      {editing ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder={t('an.placeholder')}
            className="w-full bg-muted/60 text-foreground px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:border-blue-500"
          />
          {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{t('an.error')}</p>}
          <div className="flex gap-2">
            <button type="button" disabled={saving} onClick={() => persist(draft)} className={`${btn} bg-blue-600 text-white border-blue-600 hover:bg-blue-500`}>
              {t('an.save')}
            </button>
            <button type="button" disabled={saving} onClick={() => { setEditing(false); setError(false); }} className={btn}>
              {t('an.cancel')}
            </button>
          </div>
        </div>
      ) : note ? (
        <div className="space-y-2">
          <p className="text-xs text-foreground whitespace-pre-wrap break-words">
            {revealed ? note : '••••••••'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setRevealed((v) => !v)} className={btn}>
              {revealed ? t('an.hide') : t('an.show')}
            </button>
            <button type="button" onClick={() => { setDraft(note); setEditing(true); }} className={btn}>
              {t('an.edit')}
            </button>
            <button type="button" disabled={saving} onClick={handleDelete} className={btn}>
              {t('an.delete')}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => { setDraft(''); setEditing(true); }} className={btn}>
          {t('an.add')}
        </button>
      )}
    </div>
  );
}
