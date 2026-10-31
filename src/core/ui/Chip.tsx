import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from './categories';
import { radius, spacing, typography, useThemeColors } from './theme';

/** Chips look 40 tall; this brings the touch area to 48. */
const HIT_SLOP = { top: 4, bottom: 4 };

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  /** Shows a check when selected. Off for short rows that must fit on one line. */
  check?: boolean;
};

/** Choice or filter: selected ones are tonal and show a check. */
export function Chip({ label, selected, onPress, check = true }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={HIT_SLOP}
      android_ripple={{ color: colors.ripple }}
      style={[
        styles.chip,
        selected
          ? { backgroundColor: colors.primaryContainer, borderColor: colors.primaryContainer }
          : { backgroundColor: colors.surface, borderColor: colors.outlineVariant },
      ]}
    >
      {selected && check ? (
        <MaterialCommunityIcons name="check" size={18} color={colors.onPrimaryContainer} />
      ) : null}
      <Text style={[styles.label, { color: selected ? colors.onPrimaryContainer : colors.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

type ActionProps = {
  label: string;
  icon: IconName;
  onPress: () => void;
};

/** Secondary action of a screen, e.g. Exportar or Proveedores. */
export function ActionChip({ label, icon, onPress }: ActionProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      hitSlop={HIT_SLOP}
      android_ripple={{ color: colors.ripple }}
      style={[
        styles.chip,
        { backgroundColor: colors.surfaceContainerHigh, borderColor: colors.surfaceContainerHigh },
      ]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  label: { ...typography.body, flexShrink: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
