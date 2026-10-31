import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';

import { DatabaseProvider } from '@/core/db';
import { settingsEntries } from '@/core/settingsEntries';
import { AppHeaderTitle, categoryForRoute, useThemeColors } from '@/core/ui';
import { modules } from '@/modules/registry';

const headerEntries = [...modules, ...settingsEntries];

export default function RootLayout() {
  const colors = useThemeColors();

  // Root view behind the screens and the edge-to-edge system bars.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <DatabaseProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={({ route }) => {
          // Screens of a module take its category color; the home screen blends with the background.
          const category = categoryForRoute(route.name, headerEntries);
          return {
            headerStyle: {
              backgroundColor: category ? colors.category[category].container : colors.background,
            },
            headerShadowVisible: false,
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.background },
          };
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'PosadillApps',
            headerTitle: ({ children }) => <AppHeaderTitle title={children} />,
          }}
        />
      </Stack>
    </DatabaseProvider>
  );
}
