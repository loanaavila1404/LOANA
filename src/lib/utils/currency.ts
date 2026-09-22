import { APP_CONFIG } from '../constants/config';

export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${APP_CONFIG.CURRENCY_SYMBOL} 0.00`;
  }
  return new Intl.NumberFormat(APP_CONFIG.LOCALE, {
    style: 'currency',
    currency: APP_CONFIG.CURRENCY,
  }).format(amount);
}

export function parseCurrency(str: string): number {
  if (!str) return 0;
  const numStr = str.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? 0 : num;
}
