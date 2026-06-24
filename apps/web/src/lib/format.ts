export function formatPrice(value: number | null | undefined): string {
  return `$${Math.round(value ?? 0).toLocaleString('es-CL')}`;
}
