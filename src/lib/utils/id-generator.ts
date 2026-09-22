export const ID_PREFIXES = {
  PERSON: 'PER',
  STUDENT: 'EST',
  PROGRAM: 'PRG',
  PLAN: 'PLA',
  EDITION: 'EDI',
  COURSE: 'MAT',
  ENROLLMENT: 'MAT',
  FEE: 'CUO',
  PAYMENT: 'PAG',
  AUDIT: 'AUD',
  USER: 'USR',
  PROSPECT: 'PRO',
} as const;

export function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  // Fallback if randomUUID is not available
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
  return `${prefix}-${uuid}`;
}

export function generateStudentCode(prefix: string, year: number, sequence: number): string {
  const seqStr = sequence.toString().padStart(5, '0');
  return `${prefix}-${year}-${seqStr}`;
}
