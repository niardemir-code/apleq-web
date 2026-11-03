import { createContext, useContext, useState, Fragment, ReactNode } from 'react';
import { es, ca, en, TranslationKey } from './translations';

export type Lang = 'es' | 'ca' | 'en';

export const LANGS: { code: Lang; short: string; name: string }[] = [
  { code: 'es', short: 'ES', name: 'Castellano' },
  { code: 'ca', short: 'CA', name: 'Català' },
  { code: 'en', short: 'EN', name: 'English' },
];

const STORAGE_KEY = 'apleq_lang';
const dictionaries: Record<Lang, Record<TranslationKey, string>> = { es, ca, en };

/** Idioma guardado; si no hay, el del navegador (es / ca); y para cualquier otro, inglés. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'es' || saved === 'ca' || saved === 'en') return saved;
  } catch {
    /* sin acceso al almacenamiento: seguimos con el idioma del navegador */
  }
  const base = (typeof navigator !== 'undefined' ? navigator.language || '' : '').toLowerCase().slice(0, 2);
  if (base === 'es') return 'es';
  if (base === 'ca') return 'ca';
  return 'en';
}

// Idioma actual a nivel de módulo: así t() se puede usar en cualquier sitio
// (componentes, servicios, utilidades), no solo dentro de componentes React.
let currentLang: Lang = detectLang();

function applyToDocument(lang: Lang) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  document.title = dictionaries[lang]['app.title'];
}
applyToDocument(currentLang);

export function getLang(): Lang {
  return currentLang;
}

/** Traduce una clave. Los parámetros sustituyen a {nombre} dentro del texto. */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = dictionaries[currentLang][key] ?? es[key] ?? key;
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (_, name) =>
      params[name] !== undefined ? String(params[name]) : `{${name}}`
    );
  }
  return text;
}

/** Código de idioma para fechas y números (toLocaleDateString, Intl...). */
export function dateLocale(): string {
  if (currentLang === 'ca') return 'ca-ES';
  if (currentLang === 'en') return 'en-GB';
  return 'es-ES';
}

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(currentLang);

  const setLang = (next: Lang) => {
    currentLang = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignorar */
    }
    applyToDocument(next);
    setLangState(next);
  };

  return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}

/**
 * Al cambiar de idioma vuelve a montar su contenido, así TODOS los textos se
 * refrescan sin tener que suscribir cada componente por separado.
 */
export function LanguageKeyed({ children }: { children: ReactNode }) {
  const { lang } = useLanguage();
  return <Fragment key={lang}>{children}</Fragment>;
}

type PluralBase = Extract<TranslationKey, `${string}.one`> extends infer K
  ? K extends `${infer B}.one`
    ? B
    : never
  : never;

/** Traduce con singular/plural: usa la clave «base.one» si n es 1 y «base.other» en caso contrario. */
export function tp(base: PluralBase, n: number, params?: Record<string, string | number>): string {
  const key = `${base}.${n === 1 ? 'one' : 'other'}` as TranslationKey;
  return t(key, { n, ...params });
}

/** Como t(), pero los fragmentos entre **dobles asteriscos** salen en negrita. */
export function tRich(
  key: TranslationKey,
  params?: Record<string, string | number>,
  strongClassName?: string
): ReactNode {
  return richParts(t(key, params), strongClassName);
}

/** Como tp(), con negritas entre **dobles asteriscos**. */
export function tpRich(
  base: PluralBase,
  n: number,
  params?: Record<string, string | number>,
  strongClassName?: string
): ReactNode {
  return richParts(tp(base, n, params), strongClassName);
}

function richParts(text: string, strongClassName?: string): ReactNode {
  return text.split('**').map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className={strongClassName}>
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
  );
}

// Las categorías se guardan en castellano en la base de datos; solo se traducen al mostrarlas.
const CATEGORY_KEYS: Record<string, TranslationKey> = {
  'Streaming': 'catv.streaming',
  'Música': 'catv.music',
  'Productividad': 'catv.productivity',
  'Gaming': 'catv.gaming',
  'Educación': 'catv.education',
  'Salud': 'catv.health',
  'Estilo de vida': 'catv.lifestyle',
  'Seguridad': 'catv.security',
  'Finanzas': 'catv.finance',
  'General': 'catv.general',
};

export function categoryName(value?: string): string {
  if (!value) return t('catv.streaming');
  const key = CATEGORY_KEYS[value];
  return key ? t(key) : value;
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Nombre del mes (1-12) en el idioma actual, con inicial mayúscula. */
export function monthName(month: number): string {
  const m = Math.min(12, Math.max(1, month)) - 1;
  return capitalize(new Date(2024, m, 1).toLocaleDateString(dateLocale(), { month: 'long' }));
}

/** Nombre de una moneda (EUR, USD...) en el idioma actual; si no se puede, el texto de respaldo. */
export function currencyName(code: string, fallback?: string): string {
  try {
    const name = new Intl.DisplayNames([dateLocale()], { type: 'currency' }).of(code);
    if (name) return capitalize(name);
  } catch {
    /* el navegador no lo soporta */
  }
  return fallback || code;
}

