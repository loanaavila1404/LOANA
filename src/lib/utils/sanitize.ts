export function cleanText(value: unknown, maxLength?: number): string {
  if (typeof value !== 'string') return '';
  let cleaned = value.trim().replace(/\s+/g, ' ');
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }
  return cleaned;
}

export function normalizeSearch(value: string): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

export function normalizeEmail(value: string): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

export function normalizePhone(value: string): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

export function normalizeDocument(type: string, number: string): string {
  if (!number) return '';
  const cleaned = number.replace(/[\s-]/g, '').toUpperCase();
  if (type === 'DNI') {
    return cleaned.replace(/\D/g, '').substring(0, 8);
  } else if (type === 'CE') {
    return cleaned.replace(/[^A-Z0-9]/g, '').substring(0, 12);
  }
  return cleaned;
}
