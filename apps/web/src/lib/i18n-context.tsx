'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { t, Locale } from './i18n';

const COOKIE = 'locale';
function getCookie(): Locale | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]*)`));
  const val = match?.[1] as Locale | undefined;
  return val && ['es', 'en', 'pt'].includes(val) ? val : null;
}
function setCookie(locale: Locale) {
  document.cookie = `${COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
}
function detectLocale(): Locale {
  const fromCookie = getCookie();
  if (fromCookie) return fromCookie;
  if (typeof navigator === 'undefined') return 'es';
  const lang = navigator.language;
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('en')) return 'en';
  return 'es';
}

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string }>({ locale: 'es', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    setCookie(l);
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key: string) => t(locale, key) }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
