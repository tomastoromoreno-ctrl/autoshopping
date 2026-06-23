'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import { t, Locale } from './i18n';

const I18nContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void; t: (key: string) => string }>({ locale: 'es', setLocale: () => {}, t: (k) => k });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('es');
  return (
    <I18nContext.Provider value={{ locale, setLocale, t: (key: string) => t(locale, key) }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);
