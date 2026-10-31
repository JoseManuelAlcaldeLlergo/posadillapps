import { formatQuantity } from '@/core/export/format';

/** Unit of a waiting period: `1 día`, `0 días`, `15 días`. */
export function waitingDaysUnit(days: number): string {
  return days === 1 ? 'día' : 'días';
}

export function formatWaitingDays(days: number): string {
  return formatQuantity(days, waitingDaysUnit(days));
}
