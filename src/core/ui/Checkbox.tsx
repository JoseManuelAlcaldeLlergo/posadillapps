import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useThemeColors } from './theme';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function Checkbox({ label, checked, onChange }: Props) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.row}
    >
      <View
        style={[
          styles.box,
          {
            borderColor: colors.primary,
            backgroundColor: checked ? colors.primary : 'transparent',
          },
        ]}
      >
        {checked ? <Text style={[styles.tick, { color: colors.surface }]}>✓</Text> : null}
      </View>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: typography.bodyStrong,
  label: { ...typography.body, flexShrink: 1 },
});
