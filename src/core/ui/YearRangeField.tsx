import { StyleSheet, View } from 'react-native';

import { Chip, ChipRow } from './Chip';
import { TextField } from './TextField';
import { spacing } from './theme';

/** Years as typed; parse them with `parseYear`. */
export type YearRangeText = { from: string; to: string };

type Props = {
  value: YearRangeText;
  onChange: (range: YearRangeText) => void;
  now?: Date;
};

/** Two year fields plus shortcuts: current year, previous year. */
export function YearRangeField({ value, onChange, now = new Date() }: Props) {
  const current = now.getFullYear();
  const presets = [
    { label: 'Año actual', year: String(current) },
    { label: 'Año anterior', year: String(current - 1) },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.fields}>
        <View style={styles.field}>
          <TextField
            label="Desde año"
            value={value.from}
            onChangeText={(from) => onChange({ ...value, from })}
            keyboardType="number-pad"
            maxLength={4}
            example={String(current)}
          />
        </View>
        <View style={styles.field}>
          <TextField
            label="Hasta año"
            value={value.to}
            onChangeText={(to) => onChange({ ...value, to })}
            keyboardType="number-pad"
            maxLength={4}
            example={String(current)}
          />
        </View>
      </View>
      <ChipRow>
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            selected={value.from.trim() === preset.year && value.to.trim() === preset.year}
            onPress={() => onChange({ from: preset.year, to: preset.year })}
          />
        ))}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  fields: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1 },
});
