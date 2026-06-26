'use client';

import { useI18n } from '@/lib/i18n-context';
import type { Locale } from '@/lib/i18n';

const locales: { value: Locale; label: string }[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className="rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-sm text-slate-200 shadow-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    >
      {locales.map((l) => (
        <option key={l.value} value={l.value}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
