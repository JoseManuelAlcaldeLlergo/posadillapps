import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { DatabaseProvider } from '@/core/db';
import { AppHeaderTitle, useThemeColors } from '@/core/ui';

export default function RootLayout() {
  const colors = useThemeColors();
  return (
    <DatabaseProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.background },
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
