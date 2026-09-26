import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(nombres: string, apellidos: string): string {
  return ((nombres?.[0] || '') + (apellidos?.[0] || '')).toUpperCase() || '?';
}
