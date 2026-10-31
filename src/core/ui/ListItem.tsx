import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useThemeColors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  /** Short tag next to the title, e.g. `Automática`. */
  badge?: string;
  onPress?: () => void;
};

export function ListItem({ title, subtitle, badge, onPress }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.outlineVariant,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {badge ? (
          <Text style={[styles.badge, { color: colors.primary, borderColor: colors.primary }]}>
            {badge}
          </Text>
        ) : null}
      </View>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.heading, flexShrink: 1 },
  badge: {
    ...typography.label,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  subtitle: typography.caption,
});
