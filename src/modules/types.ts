import type { Href } from 'expo-router';

import type { ModuleBackup } from '@/core/backup/types';

/** Entry shown on the home screen for each record module. */
export type AppModule = {
  id: string;
  title: string;
  description?: string;
  /** Route of the module's main screen (usually its list). */
  route: Href;
  /** Backup support; modules without it are not included in backups. */
  backup?: ModuleBackup<any>;
};
