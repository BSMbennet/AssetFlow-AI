import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function truncateString(str: string, length: number = 20) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
