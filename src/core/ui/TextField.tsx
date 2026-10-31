import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { radius, spacing, typography, useThemeColors } from './theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

export function TextField({ label, error, optional, style, ref, ...inputProps }: Props) {
  const colors = useThemeColors();
  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {optional ? <Text style={{ color: colors.textMuted }}> (opcional)</Text> : null}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.outlineVariant,
          },
          style,
        ]}
        {...inputProps}
      />
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: typography.captionStrong,
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    ...typography.body,
    minHeight: 48,
  },
  error: typography.caption,
});
