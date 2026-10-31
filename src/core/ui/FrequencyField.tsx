import { StyleSheet, View } from 'react-native';

import { SuggestionChips } from './SuggestionChips';
import { TextField } from './TextField';
import { spacing } from './theme';

type Props = {
  value: string;
  onChange: (frequency: string) => void;
  /** Usual frequencies, e.g. presets followed by the ones already used. */
  suggestions: readonly string[];
  error?: string;
  label?: string;
};

/** Frequency of a regular record (e.g. `A diario`), with suggestions. */
export function FrequencyField({ value, onChange, suggestions, error, label = 'Frecuencia' }: Props) {
  return (
    <View style={styles.group}>
      <TextField
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder="A diario"
        autoCapitalize="sentences"
        error={error}
      />
      <SuggestionChips
        items={suggestions.map((text) => ({ id: text, name: text }))}
        query={value}
        label="Sugerencias"
        onSelect={(item) => onChange(item.name)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
