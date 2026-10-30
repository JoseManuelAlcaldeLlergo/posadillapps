import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import type { ReactNode } from 'react';

import { CenteredMessage } from '@/core/ui/CenteredMessage';

import { db } from './client';
import migrations from './migrations/migrations';

type Props = {
  children: ReactNode;
};

/** Applies pending migrations before rendering the app. */
export function DatabaseProvider({ children }: Props) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <CenteredMessage
        title="Error al preparar la base de datos"
        message={error.message}
      />
    );
  }
  if (!success) {
    return <CenteredMessage title="Preparando datos…" loading />;
  }
  return <>{children}</>;
}
