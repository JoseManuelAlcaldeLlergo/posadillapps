import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import type { IconName } from './categories';
import { elevation, radius, spacing, typography, useThemeColors } from './theme';

const FAB_HEIGHT = 56;

/** Bottom padding a list needs so the FAB does not cover its last item. */
export const FAB_CLEARANCE = FAB_HEIGHT + spacing.md * 2;

type Props = {
  label: string;
  icon?: IconName;
  onPress: () => void;
};

/**
 * Extended floating button for the main action of a list (`+ Nueva entrada`).
 * Pass it to `Screen` through its `fab` prop, which places it.
 */
export function Fab({ label, icon = 'plus', onPress }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={[styles.fab, { backgroundColor: colors.primaryContainer }]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.onPrimaryContainer} />
      <Text style={[typography.bodyStrong, { color: colors.onPrimaryContainer }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    minHeight: FAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingRight: spacing.lg - spacing.xs,
    borderRadius: radius.xl,
    elevation: elevation.fab,
    overflow: 'hidden',
  },
});
