import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, CenteredMessage, spacing } from '@/core/ui';

/** Shown instead of a form that creates rows while the farm code is not set. */
export function FarmCodeRequired() {
  return (
    <View style={styles.root}>
      <CenteredMessage
        title="Falta el código de explotación"
        message="Configúralo en Ajustes de la explotación antes de crear filas."
      />
      <Button label="Ir a Ajustes de la explotación" onPress={() => router.push('/farm-settings')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.md, gap: spacing.md },
});
