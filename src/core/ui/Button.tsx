import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import type { IconName } from './categories';
import { radius, spacing, typography, useThemeColors, type ThemeColors } from './theme';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

type Props = {
  label: string;
  onPress: () => void;
  /** `filled` for the main action, `tonal` or `outlined` for the others, `danger` to delete. */
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
};

function variantColors(colors: ThemeColors, variant: Variant) {
  switch (variant) {
    case 'filled':
      return { background: colors.primary, content: colors.onPrimary, border: colors.primary };
    case 'tonal':
      return {
        background: colors.primaryContainer,
        content: colors.onPrimaryContainer,
        border: colors.primaryContainer,
      };
    case 'outlined':
      return { background: 'transparent', content: colors.primary, border: colors.outline };
    case 'text':
      return { background: 'transparent', content: colors.primary, border: 'transparent' };
    case 'danger':
      return { background: 'transparent', content: colors.danger, border: colors.danger };
  }
}

export function Button({ label, onPress, variant = 'filled', icon, disabled, loading }: Props) {
  const colors = useThemeColors();
  const { background, content, border } = variantColors(colors, variant);
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      android_ripple={{ color: colors.ripple }}
      style={[
        styles.button,
        { backgroundColor: background, borderColor: border, opacity: inactive ? 0.5 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={content} />
      ) : (
        <>
          {icon ? <MaterialCommunityIcons name={icon} size={20} color={content} /> : null}
          <Text style={[styles.label, { color: content }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: { ...typography.bodyStrong, textAlign: 'center', flexShrink: 1 },
});
