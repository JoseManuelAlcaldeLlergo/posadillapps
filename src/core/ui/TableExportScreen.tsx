import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { dateRangePresets } from '../dates';
import { periodFileSuffix } from '../export/format';
import { resolvePeriod, type PeriodInput } from '../export/period';
import { printTable, sharePdf, shareXlsx } from '../export/share';
import type { PeriodType, PeriodValue, TableDefinition } from '../export/types';
import { Button } from './Button';
import { DateRangeField, type OptionalDateRange } from './DateRangeField';
import { Screen } from './Screen';
import { spacing, useThemeColors } from './theme';
import { YearRangeField, type YearRangeText } from './YearRangeField';

type Action = 'print' | 'pdf' | 'xlsx';

type Props<Row, P extends PeriodType> = {
  /** Header title, e.g. `Exportar entradas`. */
  screenTitle: string;
  table: TableDefinition<Row, P>;
  /** Records in the period (both ends inclusive), for the status line. */
  count: (period: PeriodValue<P>) => number;
  /** Rows to export for the period. */
  load: (period: PeriodValue<P>) => Row[];
  /** Status line for the count, e.g. `3 entradas en el rango.` */
  countMessage: (count: number) => string;
  /** Shown when the period has no records. */
  emptyMessage: string;
};

const INVALID_MESSAGES = {
  dateRange: {
    incomplete: 'Elige las dos fechas del rango.',
    invalidYear: '',
    reversed: 'La fecha «Desde» es posterior a «Hasta».',
  },
  yearRange: {
    incomplete: 'Escribe los dos años del rango.',
    invalidYear: 'Año no válido (ejemplo: 2025).',
    reversed: 'El año «Desde» es posterior a «Hasta».',
  },
} as const;

/**
 * Period (date range or year range, as the table declares) and Print /
 * Share PDF / Share Excel actions.
 */
export function TableExportScreen<Row, P extends PeriodType = 'dateRange'>({
  screenTitle,
  table,
  count: countInPeriod,
  load,
  countMessage,
  emptyMessage,
}: Props<Row, P>) {
  const colors = useThemeColors();
  const periodType: PeriodType = table.periodType ?? 'dateRange';
  const [dateRange, setDateRange] = useState<OptionalDateRange>(() =>
    dateRangePresets[0].range(new Date()),
  );
  const [yearRange, setYearRange] = useState<YearRangeText>(() => {
    const year = String(new Date().getFullYear());
    return { from: year, to: year };
  });
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState<Action | null>(null);

  const resolved = useMemo(() => {
    const input: PeriodInput =
      periodType === 'yearRange'
        ? { type: 'yearRange', ...yearRange }
        : { type: 'dateRange', ...dateRange };
    return resolvePeriod(input);
  }, [periodType, dateRange, yearRange]);
  // resolvePeriod returns the shape that matches the table's period type.
  const period = resolved.ok ? (resolved.period as PeriodValue<P>) : null;

  useFocusEffect(
    useCallback(() => {
      setCount(period ? countInPeriod(period) : 0);
    }, [period, countInPeriod]),
  );

  const run = async (action: Action) => {
    if (!period) return;
    setBusy(action);
    try {
      const rows = load(period);
      const suffix = periodFileSuffix(period);
      if (action === 'print') await printTable(table, rows);
      if (action === 'pdf') await sharePdf(table, rows, suffix);
      if (action === 'xlsx') await shareXlsx(table, rows, suffix);
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(null);
    }
  };

  const disabled = !period || count === 0 || busy !== null;
  const invalid = !resolved.ok && resolved.reason !== 'incomplete';

  let status: string;
  if (!resolved.ok) status = INVALID_MESSAGES[periodType][resolved.reason];
  else if (count === 0) status = emptyMessage;
  else status = countMessage(count);

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: screenTitle }} />
      {periodType === 'yearRange' ? (
        <YearRangeField value={yearRange} onChange={setYearRange} />
      ) : (
        <DateRangeField value={dateRange} onChange={setDateRange} />
      )}
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
