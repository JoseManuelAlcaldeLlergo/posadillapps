import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { spacing, useThemeColors } from './theme';

type Props = {
  title: string;
  message?: string;
  loading?: boolean;
};

/** Full-area message for empty, loading and error states. */
export function CenteredMessage({ title, message, loading }: Props) {
  const colors = useThemeColors();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center' },
});
