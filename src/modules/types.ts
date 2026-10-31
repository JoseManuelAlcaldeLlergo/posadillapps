import type { Href } from 'expo-router';

import type { ModuleBackup } from '@/core/backup/types';
import type { Category, IconName } from '@/core/ui';

/** Entry shown on the home screen for each record module. */
export type AppModule = {
  id: string;
  title: string;
  description?: string;
  /** Home screen group; its colors come from the theme (`colors.category`). */
  category: Exclude<Category, 'settings'>;
  /** MaterialCommunityIcons glyph shown on the home card. */
  icon: IconName;
  /** Route of the module's main screen (usually its list). */
  route: Href;
  /** Backup support; modules without it are not included in backups. */
  backup?: ModuleBackup<any>;
};
