/**
 * The app's language: which of the eight locales this page is in, remembered
 * across visits and stamped on <html> so `dir` and every `Intl` call follow it.
 *
 * Deliberately not i18next: the customer pages and the desk keep their own
 * words (`customer/words`, `desk/i18n`) and read only the locale from here.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { LOCALES, dirFor, isLocaleTag, resolveLocale, type LocaleTag } from './locales';

const STORAGE_KEY = 'bookings-locale';

interface I18nValue {
  locale: LocaleTag;
  dir: 'ltr' | 'rtl';
  setLocale: (t: LocaleTag) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): LocaleTag {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocaleTag(stored)) return stored;
  } catch {
    // Private mode / storage disabled — fall through to the browser's list.
  }
  return resolveLocale(navigator.languages ?? [navigator.language]);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleTag>(initialLocale);
  const dir = dirFor(locale);

  // Stamp <html> so CSS logical properties resolve and screen readers announce
  // the right language. This is the single switch that turns RTL on.
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute('lang', LOCALES[locale].tag);
    el.setAttribute('dir', dir);
  }, [locale, dir]);

  const setLocale = useCallback((next: LocaleTag) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice is not a reason to refuse it.
    }
  }, []);

  const value = useMemo<I18nValue>(() => ({ locale, dir, setLocale }), [locale, dir, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (ctx === null) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
}

export { LOCALES, LOCALE_TAGS, DEFAULT_LOCALE, type LocaleTag } from './locales';
