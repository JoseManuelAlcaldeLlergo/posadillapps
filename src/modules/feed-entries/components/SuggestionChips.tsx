import { StyleSheet, Text, View } from 'react-native';

import { Chip, ChipRow, spacing, useThemeColors } from '@/core/ui';

import { nameKey } from '../names';

type Props<T extends { id: number; name: string }> = {
  items: readonly T[];
  /** Current text; filters suggestions and hides the exact match. */
  query: string;
  onSelect: (item: T) => void;
  label?: string;
  max?: number;
};

/** Favorites matching what has been typed, as tappable chips. */
export function SuggestionChips<T extends { id: number; name: string }>({
  items,
  query,
  onSelect,
  label,
  max = 8,
}: Props<T>) {
  const colors = useThemeColors();
  const key = nameKey(query);
  const matches = items
    .filter((item) => {
      const itemKey = nameKey(item.name);
      return itemKey !== key && itemKey.includes(key);
    })
    .slice(0, max);

  if (matches.length === 0) return null;

  return (
    <View style={styles.root}>
      {label ? <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text> : null}
      <ChipRow>
        {matches.map((item) => (
          <Chip key={item.id} label={item.name} onPress={() => onSelect(item)} />
        ))}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { fontSize: 13 },
});
