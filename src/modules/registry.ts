import { cleaningDisinfectionModule } from './cleaning-disinfection/module';
import { feedEntriesModule } from './feed-entries/module';
import { personalHygieneModule } from './personal-hygiene/module';
import type { AppModule } from './types';
import { vehicleCleaningModule } from './vehicle-cleaning/module';
import { vehicleEntriesModule } from './vehicle-entries/module';

/**
 * Central module registry. The home screen lists these in order.
 * To add a module, import its definition and append it here.
 */
export const modules: AppModule[] = [
  feedEntriesModule,
  vehicleEntriesModule,
  personalHygieneModule,
  cleaningDisinfectionModule,
  vehicleCleaningModule,
];
