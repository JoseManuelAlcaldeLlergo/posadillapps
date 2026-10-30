import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fromIsoDate, toIsoDate } from '../dates';
import { formatDate } from '../export/format';
import { spacing, useThemeColors } from './theme';

type Props = {
  label: string;
  /** ISO `YYYY-MM-DD`, or null when empty. */
  value: string | null;
  onChange: (iso: string | null) => void;
  error?: string;
  placeholder?: string;
  /** Shows a button to empty the field. */
  clearable?: boolean;
};

/** Date shown as `dd-mm-aaaa`; opens the native Android calendar. */
export function DateField({ label, value, onChange, error, placeholder, clearable }: Props) {
  const colors = useThemeColors();

  const open = () => {
    DateTimePickerAndroid.open({
      value: value ? fromIsoDate(value) : new Date(),
      mode: 'date',
      onChange: (event, date) => {
        if (event.type === 'set' && date) onChange(toIsoDate(date));
      },
    });
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${value ? formatDate(value) : 'sin fecha'}`}
          onPress={open}
          style={[
            styles.field,
            {
              backgroundColor: colors.surface,
              borderColor: error ? colors.danger : colors.border,
            },
          ]}
        >
          <Text style={[styles.value, { color: value ? colors.text : colors.textMuted }]}>
            {value ? formatDate(value) : (placeholder ?? 'dd-mm-aaaa')}
          </Text>
        </Pressable>
        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${label}`}
            onPress={() => onChange(null)}
            style={styles.clear}
          >
            <Text style={[styles.clearText, { color: colors.textMuted }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  field: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.sm + 4,
    minHeight: 48,
    justifyContent: 'center',
  },
  value: { fontSize: 16 },
  clear: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  clearText: { fontSize: 18 },
  error: { fontSize: 13 },
});
