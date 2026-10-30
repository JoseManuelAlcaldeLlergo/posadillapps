import type { ComponentRef, Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { spacing, useThemeColors } from './theme';

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
            borderColor: error ? colors.danger : colors.border,
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
  label: { fontSize: 14, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    fontSize: 16,
    minHeight: 48,
  },
  error: { fontSize: 13 },
});
