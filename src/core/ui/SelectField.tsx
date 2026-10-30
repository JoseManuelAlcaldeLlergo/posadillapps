import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, useThemeColors } from './theme';

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

/** Dropdown with a fixed list of options; opens them in a modal sheet. */
export function SelectField<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  placeholder,
}: Props<T>) {
  const colors = useThemeColors();
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
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border },
        ]}
      >
        <Text style={[styles.value, { color: selected ? colors.text : colors.textMuted }]}>
          {selected?.label ?? placeholder ?? 'Elige una opción'}
        </Text>
        <Text style={[styles.arrow, { color: colors.textMuted }]}>▾</Text>
      </Pressable>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Cerrar"
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
          />
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
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
                    style={({ pressed }) => [
                      styles.option,
                      { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLabel,
                        { color: isSelected ? colors.primary : colors.text },
                        isSelected && styles.optionSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? <Text style={{ color: colors.primary }}>✓</Text> : null}
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
  label: { fontSize: 14, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 4,
    minHeight: 48,
  },
  value: { flex: 1, fontSize: 16 },
  arrow: { fontSize: 16 },
  error: { fontSize: 13 },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: { borderRadius: 12, paddingVertical: spacing.sm, maxHeight: '80%' },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  optionLabel: { flex: 1, fontSize: 16 },
  optionSelected: { fontWeight: '600' },
});
