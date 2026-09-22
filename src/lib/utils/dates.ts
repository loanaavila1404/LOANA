import { format, isValid } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { APP_CONFIG } from '../constants/config';

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return '';
  return formatInTimeZone(d, APP_CONFIG.TIMEZONE, APP_CONFIG.DATE_FORMAT);
}

export function formatDateTime(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return '';
  return formatInTimeZone(d, APP_CONFIG.TIMEZONE, APP_CONFIG.DATETIME_FORMAT);
}

export function formatDateISO(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return '';
  return formatInTimeZone(d, APP_CONFIG.TIMEZONE, APP_CONFIG.DATE_FORMAT_ISO);
}

export function parseDate(str: string): Date {
  const parsed = new Date(str);
  return isValid(parsed) ? parsed : new Date(NaN);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function nowLima(): Date {
  return toZonedTime(new Date(), APP_CONFIG.TIMEZONE);
}

export function isValidDate(str: string): boolean {
  if (!str) return false;
  const d = new Date(str);
  return isValid(d);
}
