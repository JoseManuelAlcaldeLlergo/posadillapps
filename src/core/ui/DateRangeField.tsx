import { StyleSheet, View } from 'react-native';

import { dateRangePresets, type DateRange } from '../dates';
import { Chip, ChipRow } from './Chip';
import { DateField } from './DateField';
import { spacing } from './theme';

export type OptionalDateRange = { from: string | null; to: string | null };

type Props = {
  value: OptionalDateRange;
  onChange: (range: OptionalDateRange) => void;
  /** Allows leaving either end empty (open range), e.g. for list filters. */
  optional?: boolean;
  now?: Date;
};

/** Two date fields plus shortcuts: current year, previous year, current month. */
export function DateRangeField({ value, onChange, optional, now = new Date() }: Props) {
  const isPreset = (range: DateRange) => value.from === range.from && value.to === range.to;

  return (
    <View style={styles.root}>
      <View style={styles.fields}>
        <View style={styles.field}>
          <DateField
            label="Desde"
            value={value.from}
            clearable={optional}
            placeholder={optional ? 'Sin límite' : undefined}
            onChange={(from) => onChange({ ...value, from })}
          />
        </View>
        <View style={styles.field}>
          <DateField
            label="Hasta"
            value={value.to}
            clearable={optional}
            placeholder={optional ? 'Sin límite' : undefined}
            onChange={(to) => onChange({ ...value, to })}
          />
        </View>
      </View>
      <ChipRow>
        {dateRangePresets.map((preset) => {
          const range = preset.range(now);
          const selected = isPreset(range);
          return (
            <Chip
              key={preset.id}
              label={preset.label}
              selected={selected}
              onPress={() =>
                onChange(selected && optional ? { from: null, to: null } : range)
              }
            />
          );
        })}
      </ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  fields: { flexDirection: 'row', gap: spacing.sm },
  field: { flex: 1 },
});
