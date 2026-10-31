import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { EmptyState, spacing, useThemeColors } from '../ui';

/** Shown instead of a form that creates records while the farm code is not set. */
export function FarmCodeRequired() {
  const colors = useThemeColors();
  return (
    <View style={styles.root}>
      <EmptyState
        icon="barn"
        tone={colors.category.settings}
        title="Falta el código de explotación"
        message="Configúralo en Ajustes de la explotación antes de crear registros."
        action={{ label: 'Ir a Ajustes de la explotación', onPress: () => router.push('/farm-settings') }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: spacing.md },
});
