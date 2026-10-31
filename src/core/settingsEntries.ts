import type { Href } from 'expo-router';

import type { Category, IconName } from './ui/categories';

/** An entry of the home screen: a module or one of the app's own screens. */
export type HomeEntry = {
  id: string;
  title: string;
  description?: string;
  category: Category;
  icon: IconName;
  route: Href;
};

/** The app's own screens, shown in the Configuración group of the home screen. */
export const settingsEntries: HomeEntry[] = [
  {
    id: 'farm-settings',
    title: 'Ajustes de la explotación',
    description: 'Código de explotación y unidades productivas',
    category: 'settings',
    icon: 'barn',
    route: '/farm-settings',
  },
  {
    id: 'backup',
    title: 'Copia de seguridad',
    description: 'Guardar o restaurar todos los datos',
    category: 'settings',
    icon: 'backup-restore',
    route: '/backup',
  },
];
