import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SelectOption } from './SelectField';
import { radius, spacing, typography, useThemeColors } from './theme';

type Props<T extends string> = {
  options: readonly SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Read by screen readers, e.g. `Unidad`. */
  accessibilityLabel: string;
};

/** A short, fixed choice in one bar of 48 (units kg / t / l). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const colors = useThemeColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[styles.bar, { borderColor: colors.outline }]}
    >
      {options.map((option, i) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            android_ripple={{ color: colors.ripple }}
            style={[
              styles.segment,
              i > 0 && { borderLeftWidth: 1, borderLeftColor: colors.outline },
              selected && { backgroundColor: colors.primaryContainer },
            ]}
          >
            {selected ? (
              <MaterialCommunityIcons name="check" size={18} color={colors.onPrimaryContainer} />
            ) : null}
            <Text
              style={[
                selected ? typography.bodyStrong : typography.body,
                { color: selected ? colors.onPrimaryContainer : colors.text },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
