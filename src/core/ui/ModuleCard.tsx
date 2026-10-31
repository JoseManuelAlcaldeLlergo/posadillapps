import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Category, IconName } from './categories';
import { radius, spacing, typography, useThemeColors } from './theme';

type Props = {
  title: string;
  subtitle?: string;
  icon: IconName;
  category: Category;
  onPress: () => void;
};

/** Home screen card: category-colored icon, title, description and chevron. */
export function ModuleCard({ title, subtitle, icon, category, onPress }: Props) {
  const colors = useThemeColors();
  const { accent, container } = colors.category[category];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
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
      <View style={[styles.iconBox, { backgroundColor: container }]}>
        <MaterialCommunityIcons name={icon} size={26} color={accent} />
      </View>
      <View style={styles.texts}>
        <Text style={[typography.heading, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 48,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
});
