import { Pressable, StyleSheet, Text } from 'react-native';

import { spacing, useThemeColors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, onPress }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: { fontSize: 18, fontWeight: '600' },
  subtitle: { fontSize: 14 },
});
