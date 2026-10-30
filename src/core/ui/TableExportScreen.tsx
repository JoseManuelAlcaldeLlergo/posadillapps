import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { dateRangePresets, type DateRange } from '../dates';
import { formatDate } from '../export/format';
import { printTable, sharePdf, shareXlsx } from '../export/share';
import type { TableDefinition } from '../export/types';
import { Button } from './Button';
import { DateRangeField, type OptionalDateRange } from './DateRangeField';
import { Screen } from './Screen';
import { spacing, useThemeColors } from './theme';

type Action = 'print' | 'pdf' | 'xlsx';

type Props<Row> = {
  /** Header title, e.g. `Exportar entradas`. */
  screenTitle: string;
  table: TableDefinition<Row>;
  /** Records in the range (both ends inclusive), for the status line. */
  count: (range: DateRange) => number;
  /** Rows to export for the range. */
  load: (range: DateRange) => Row[];
  /** Status line for the count, e.g. `3 entradas en el rango.` */
  countMessage: (count: number) => string;
  /** Shown when the range has no records. */
  emptyMessage: string;
};

/** Date range with shortcuts and Print / Share PDF / Share Excel actions. */
export function TableExportScreen<Row>({
  screenTitle,
  table,
  count: countInRange,
  load,
  countMessage,
  emptyMessage,
}: Props<Row>) {
  const colors = useThemeColors();
  const [range, setRange] = useState<OptionalDateRange>(() =>
    dateRangePresets[0].range(new Date()),
  );
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState<Action | null>(null);

  const complete: DateRange | null =
    range.from && range.to ? { from: range.from, to: range.to } : null;
  const invalid = complete !== null && complete.from > complete.to;

  useFocusEffect(
    useCallback(() => {
      const { from, to } = range;
      setCount(from && to && from <= to ? countInRange({ from, to }) : 0);
    }, [range, countInRange]),
  );

  const run = async (action: Action) => {
    if (!complete || invalid) return;
    setBusy(action);
    try {
      const rows = load(complete);
      const suffix = `${formatDate(complete.from)}_a_${formatDate(complete.to)}`;
      if (action === 'print') await printTable(table, rows);
      if (action === 'pdf') await sharePdf(table, rows, suffix);
      if (action === 'xlsx') await shareXlsx(table, rows, suffix);
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const disabled = !complete || invalid || count === 0 || busy !== null;

  let status: string;
  if (!complete) status = 'Elige las dos fechas del rango.';
  else if (invalid) status = 'La fecha «Desde» es posterior a «Hasta».';
  else if (count === 0) status = emptyMessage;
  else status = countMessage(count);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: screenTitle }} />
      <DateRangeField value={range} onChange={setRange} />
      <Text style={[styles.status, { color: invalid ? colors.danger : colors.textMuted }]}>
        {status}
      </Text>
      <View style={styles.buttons}>
        <Button
          label="Imprimir"
          onPress={() => run('print')}
          disabled={disabled}
          loading={busy === 'print'}
        />
        <Button
          label="Compartir PDF"
          variant="secondary"
          onPress={() => run('pdf')}
          disabled={disabled}
          loading={busy === 'pdf'}
        />
        <Button
          label="Compartir Excel"
          variant="secondary"
          onPress={() => run('xlsx')}
          disabled={disabled}
          loading={busy === 'xlsx'}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { fontSize: 15 },
  buttons: { gap: spacing.sm },
});
