import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fromIsoDate, toIsoDate } from '../dates';
import { formatDate } from '../export/format';
import { radius, spacing, typography, useThemeColors } from './theme';

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
          <Text style={[styles.value, { color: value ? colors.text : colors.textMuted }]}>
            {value ? formatDate(value) : (placeholder ?? 'dd-mm-aaaa')}
          </Text>
          <MaterialCommunityIcons name="calendar-month-outline" size={24} color={colors.textMuted} />
        </Pressable>
        {clearable && value ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Quitar ${label}`}
            onPress={() => onChange(null)}
            android_ripple={{ color: colors.ripple, borderless: true }}
            style={styles.clear}
          >
            <MaterialCommunityIcons name="close-circle-outline" size={24} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  label: typography.captionStrong,
  row: { flexDirection: 'row', alignItems: 'center' },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm + spacing.xs,
    minHeight: 48,
    overflow: 'hidden',
  },
  value: { ...typography.body, flex: 1 },
  clear: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  error: typography.caption,
});
