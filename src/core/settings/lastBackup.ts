/** Days without a backup after which the reminder is highlighted. */
export const BACKUP_OVERDUE_DAYS = 30;

/** `never` and `overdue` are highlighted on the home screen; `never` is the most urgent. */
export type LastBackupLevel = 'ok' | 'overdue' | 'never';

export type LastBackupStatus = { text: string; level: LastBackupLevel };

/** Human text for the home reminder, counting calendar days in local time. */
export function describeLastBackup(lastBackupAt: string | null, now: Date = new Date()): LastBackupStatus {
  if (!lastBackupAt) return { text: 'Nunca has hecho una copia de seguridad', level: 'never' };

  const days = calendarDaysBetween(new Date(lastBackupAt), now);
  let when: string;
  if (days <= 0) when = 'hoy';
  else if (days === 1) when = 'ayer';
  else when = `hace ${days} días`;

  return { text: `Última copia: ${when}`, level: days > BACKUP_OVERDUE_DAYS ? 'overdue' : 'ok' };
}

function calendarDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}
