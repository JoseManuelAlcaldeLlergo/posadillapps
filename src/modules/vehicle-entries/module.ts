import type { AppModule } from '../types';
import { vehicleEntriesBackup } from './backup';

export const vehicleEntriesModule: AppModule = {
  id: 'vehicle-entries',
  title: 'Entrada de vehículos',
  description: 'Control de bioseguridad de los vehículos que entran en la explotación',
  category: 'biosecurity',
  icon: 'truck-check',
  route: '/vehicle-entries',
  backup: vehicleEntriesBackup,
};
