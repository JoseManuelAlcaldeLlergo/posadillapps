import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useThemeColors, type ThemeColors } from './theme';

type BadgeTone = 'neutral' | 'primary' | 'warning';

type Props = {
  title: string;
  /**
   * Lines under the title. The first one is the most important and goes in
   * the main text color; the rest are muted.
   */
  lines?: (string | null | undefined)[];
  /** Single muted line under the title; use `lines` for more. */
  subtitle?: string;
  /** Shown on the left, e.g. a `DateBadge`. */
  leading?: ReactNode;
  /** Short tag next to the title, e.g. `Automática`. */
  badge?: string;
  badgeTone?: BadgeTone;
  onPress?: () => void;
};

function badgeColor(colors: ThemeColors, tone: BadgeTone): string {
  if (tone === 'primary') return colors.primary;
  if (tone === 'warning') return colors.warning;
  return colors.textMuted;
}

export function ListItem({
  title,
  lines,
  subtitle,
  leading,
  badge,
  badgeTone = 'neutral',
  onPress,
}: Props) {
  const colors = useThemeColors();
  const shown = (lines ?? [subtitle]).filter((line): line is string => Boolean(line));
  const tagColor = badgeColor(colors, badgeTone);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={[styles.card, { backgroundColor: colors.surfaceContainer }]}
    >
      {leading}
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {badge ? (
            <Text style={[styles.badge, { color: tagColor, borderColor: tagColor }]}>{badge}</Text>
          ) : null}
        </View>
        {shown.map((line, i) => (
          <Text
            key={i}
            style={[
              i === 0 && lines ? typography.body : typography.caption,
              { color: i === 0 && lines ? colors.text : colors.textMuted },
            ]}
          >
            {line}
          </Text>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
    overflow: 'hidden',
  },
  texts: { flex: 1, gap: spacing.xxs },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  title: { ...typography.heading, flexShrink: 1 },
  badge: {
    ...typography.label,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
});
