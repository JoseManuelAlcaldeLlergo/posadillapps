import type { AppModule } from '../types';
import { cleaningDisinfectionBackup } from './backup';

export const cleaningDisinfectionModule: AppModule = {
  id: 'cleaning-disinfection',
  title: 'Limpieza y desinfección',
  description: 'Plan de limpieza, desinfección, desinsectación y desratización',
  category: 'hygiene',
  icon: 'spray-bottle',
  route: '/cleaning-disinfection',
  backup: cleaningDisinfectionBackup,
};
