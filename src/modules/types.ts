import type { Href } from 'expo-router';

/** Entry shown on the home screen for each record module. */
export type AppModule = {
  id: string;
  title: string;
  description?: string;
  /** Route of the module's main screen (usually its list). */
  route: Href;
};
