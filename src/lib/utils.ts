import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, formatStr: string = 'yyyy-MM-dd') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr, { locale: ko });
}

export function formatDateKorean(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy년 M월 d일 (EEE)', { locale: ko });
}

export function getDDay(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diff = differenceInDays(d, new Date());
  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

export function getProgressBar(progress: number, length: number = 10): string {
  const filled = Math.round((progress / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
