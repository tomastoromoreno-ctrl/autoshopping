'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Globe, DollarSign } from 'lucide-react';

interface StoreSelectorProps {
  languages: Array<{ language_code: string; is_default: boolean }>;
  currencies: Array<{ currency_code: string; is_default: boolean }>;
}

export default function StoreSelector({ languages, currencies }: StoreSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLang = searchParams.get('lang') || languages.find(l => l.is_default)?.language_code || 'es';
  const currentCurr = searchParams.get('currency') || currencies.find(c => c.is_default)?.currency_code || 'CLP';

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  if (languages.length <= 1 && currencies.length <= 1) {
    return null; // Don't show selectors if there's only one option
  }

  return (
    <div className="flex items-center gap-2">
      {/* Language Selector */}
      {languages.length > 1 && (
        <div className="relative flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
          <Globe className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={currentLang}
            onChange={(e) => updateParams('lang', e.target.value)}
            title="Seleccionar idioma"
            className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
          >
            {languages.map((lang) => (
              <option key={lang.language_code} value={lang.language_code}>
                {lang.language_code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Currency Selector */}
      {currencies.length > 1 && (
        <div className="relative flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-xl px-2.5 py-1.5 hover:bg-slate-100 transition-colors">
          <DollarSign className="h-3.5 w-3.5 text-slate-500" />
          <select
            value={currentCurr}
            onChange={(e) => updateParams('currency', e.target.value)}
            title="Seleccionar moneda"
            className="bg-transparent text-xs font-semibold text-slate-600 outline-none cursor-pointer pr-1"
          >
            {currencies.map((curr) => (
              <option key={curr.currency_code} value={curr.currency_code}>
                {curr.currency_code}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
