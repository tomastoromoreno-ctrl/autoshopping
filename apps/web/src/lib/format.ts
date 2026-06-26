import type { Locale } from './i18n';

const localeMap: Record<Locale, string> = { es: 'es-CL', en: 'en-US', pt: 'pt-BR' };
const currencyMap: Record<Locale, string> = { es: '$', en: '$', pt: 'R$' };

export function formatPrice(value: number | string | null | undefined, locale: Locale = 'es'): string {
  const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : Number(value ?? 0);
  const fmt = new Intl.NumberFormat(localeMap[locale], { style: 'decimal', maximumFractionDigits: 0 });
  return `${currencyMap[locale]}${fmt.format(Math.round(num))}`;
}
