export function formatPrice(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? Number(value.replace(/[^0-9]/g, '')) : Number(value ?? 0);
  return `$${Math.round(num).toLocaleString('es-CL')}`;
}
