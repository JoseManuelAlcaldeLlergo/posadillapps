import type { AppModule } from '../types';
import { vehicleCleaningBackup } from './backup';

export const vehicleCleaningModule: AppModule = {
  id: 'vehicle-cleaning',
  title: 'Limpieza de vehículos',
  description: 'Plan de limpieza y desinfección de vehículos de las explotaciones',
  route: '/vehicle-cleaning',
  backup: vehicleCleaningBackup,
};
