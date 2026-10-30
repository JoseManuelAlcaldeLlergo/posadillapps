import type { AppModule } from '../types';
import { feedEntriesBackup } from './backup';

export const feedEntriesModule: AppModule = {
  id: 'feed-entries',
  title: 'Entradas de alimentos',
  description: 'Pienso y forraje recibidos, con proveedor y factura',
  route: '/feed-entries',
  backup: feedEntriesBackup,
};
