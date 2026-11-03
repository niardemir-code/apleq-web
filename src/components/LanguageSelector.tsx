import { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGS, useLanguage, t } from '../i18n';

export function LanguageSelector() {
  const { lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-bold rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border transition-all cursor-pointer shadow-xs"
        title={t('lang.label')}
        aria-label={t('lang.label')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4 text-blue-500" />
        <span>{current.short}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1.5 w-40 p-1.5 rounded-2xl bg-card border border-border shadow-2xl z-50"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === lang}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-xl transition-colors cursor-pointer ${
                l.code === lang
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-foreground hover:bg-muted font-medium'
              }`}
            >
              <span>{l.name}</span>
              {l.code === lang && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
