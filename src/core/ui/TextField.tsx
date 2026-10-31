import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import type { IconName } from './categories';
import { radius, spacing, typography, useThemeColors } from './theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  optional?: boolean;
  /**
   * Sample value shown while empty, as `p. ej. 9.340`, so it is not taken for
   * data already filled in. Use `placeholder` for hints that are not examples.
   */
  example?: string;
  /** Icon at the right of the field. */
  icon?: IconName;
  ref?: Ref<ComponentRef<typeof TextInput>>;
};

/** Horizontal padding inside the field; the border grows inwards when focused. */
const PADDING = spacing.sm + spacing.xs;

export function TextField({
  label,
  error,
  optional,
  example,
  icon,
  placeholder,
  style,
  ref,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const borderWidth = focused || error ? 2 : 1;
  let borderColor = colors.outline;
  if (error) borderColor = colors.danger;
  else if (focused) borderColor = colors.primary;
  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.text }]}>
        {label}
        {optional ? <Text style={{ color: colors.textMuted }}> (opcional)</Text> : null}
      </Text>
      <View
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderWidth,
            paddingHorizontal: PADDING - (borderWidth - 1),
          },
        ]}
      >
        <TextInput
          ref={ref}
          placeholder={example ? `p. ej. ${example}` : placeholder}
          placeholderTextColor={colors.textMuted}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[styles.input, { color: colors.text }, style]}
          {...inputProps}
        />
        {icon ? <MaterialCommunityIcons name={icon} size={24} color={colors.textMuted} /> : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: typography.captionStrong,
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    minHeight: 48,
  },
  input: {
    ...typography.body,
    // A line height on an Android TextInput shifts the text and cursor down.
    lineHeight: undefined,
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
  },
  error: typography.caption,
});
