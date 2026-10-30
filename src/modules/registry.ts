import { feedEntriesModule } from './feed-entries/module';
import type { AppModule } from './types';

/**
 * Central module registry. The home screen lists these in order.
 * To add a module, import its definition and append it here.
 */
export const modules: AppModule[] = [feedEntriesModule];
