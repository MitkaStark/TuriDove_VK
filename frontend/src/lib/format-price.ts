export function formatPrice(amount: number | string, options?: { currency?: string; locale?: string }): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '$0';

  return new Intl.NumberFormat(options?.locale ?? 'en-US', {
    style: 'currency',
    currency: options?.currency ?? 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatPriceWithCents(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
