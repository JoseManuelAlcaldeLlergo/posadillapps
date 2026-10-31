import type { AppModule } from '../types';
import { personalHygieneBackup } from './backup';

export const personalHygieneModule: AppModule = {
  id: 'personal-hygiene',
  title: 'Higiene personal',
  description: 'Plan anual de buenas prácticas de higiene personal',
  category: 'hygiene',
  icon: 'hand-wash',
  route: '/personal-hygiene',
  backup: personalHygieneBackup,
};
