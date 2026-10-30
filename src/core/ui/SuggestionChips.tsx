import { StyleSheet, Text, View } from 'react-native';

import { nameKey } from '../text';
import { Chip, ChipRow } from './Chip';
import { spacing, useThemeColors } from './theme';

type Suggestion = { id: number | string; name: string };

type Props<T extends Suggestion> = {
  items: readonly T[];
  /** Current text; filters suggestions and hides the exact match. */
  query: string;
  onSelect: (item: T) => void;
  label?: string;
  max?: number;
  /** Comparison key for names and query. Defaults to `nameKey`. */
  matchKey?: (text: string) => string;
};

/** Suggestions matching what has been typed, as tappable chips. */
export function SuggestionChips<T extends Suggestion>({
  items,
  query,
  onSelect,
  label,
  max = 8,
  matchKey = nameKey,
}: Props<T>) {
  const colors = useThemeColors();
  const key = matchKey(query);
  const matches = items
    .filter((item) => {
      const itemKey = matchKey(item.name);
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
