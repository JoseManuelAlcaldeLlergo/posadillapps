import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'expo',
  schema: ['./src/modules/*/schema.ts', './src/core/*/schema.ts'],
  out: './src/core/db/migrations',
});
