import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing, typography, useThemeColors } from './theme';

export type SelectOption<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  options: readonly SelectOption<T>[];
  /** Selected value, or null when empty. */
  value: T | null;
  onChange: (value: T) => void;
  error?: string;
  placeholder?: string;
};

/** Dropdown with a fixed list of options; opens them in a bottom sheet. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
}: Props<T>) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  const choose = (option: SelectOption<T>) => {
    setOpen(false);
    onChange(option.value);
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? 'sin elegir'}`}
        onPress={() => setOpen(true)}
        android_ripple={{ color: colors.ripple }}
        style={[
          styles.field,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.outline,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        <Text style={[styles.value, { color: selected ? colors.text : colors.textMuted }]}>
          {selected?.label ?? placeholder ?? 'Elige una opción'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={24} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Modal
        visible={open}
        transparent
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpen(false)}
      >
        <View style={[styles.backdrop, { backgroundColor: colors.scrim }]}>
          <Pressable
            accessibilityLabel="Cerrar"
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <View
            style={[
              styles.sheet,
              { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.sm },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(option) => option.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => choose(item)}
                    android_ripple={{ color: colors.ripple }}
                    style={[styles.option, isSelected && { backgroundColor: colors.primaryContainer }]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? colors.onPrimaryContainer : colors.text },
                        isSelected && styles.optionSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <MaterialCommunityIcons name="check" size={24} color={colors.onPrimaryContainer} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: spacing.sm + spacing.xs,
    minHeight: 48,
    overflow: 'hidden',
  },
  value: { ...typography.body, flex: 1 },
  error: typography.caption,
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.sm,
    maxHeight: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    ...typography.heading,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  optionLabel: { ...typography.body, flex: 1 },
  optionSelected: { fontWeight: typography.bodyStrong.fontWeight },
});
