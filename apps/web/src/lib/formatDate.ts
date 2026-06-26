import { format } from 'date-fns';
import { es as localeES, enUS, ptBR } from 'date-fns/locale';
import type { Locale } from './i18n';

const dateLocaleMap: Record<Locale, any> = { es: localeES, en: enUS, pt: ptBR };

export function formatDate(date: string | Date, locale: Locale = 'es'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: dateLocaleMap[locale] });
}