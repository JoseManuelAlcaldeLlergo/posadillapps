import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { dateRangePresets, type DateRange } from '@/core/dates';
import { db } from '@/core/db';
import { printTable, sharePdf, shareXlsx } from '@/core/export';
import { formatDate } from '@/core/export/format';
import {
  Button,
  DateRangeField,
  Screen,
  spacing,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { countEntriesInRange, listEntriesInRange } from '../repository';
import { feedEntriesTable } from '../tableDefinition';

type Action = 'print' | 'pdf' | 'xlsx';

export default function ExportScreen() {
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
      setCount(from && to && from <= to ? countEntriesInRange(db, { from, to }) : 0);
    }, [range]),
  );

  const run = async (action: Action) => {
    if (!complete || invalid) return;
    setBusy(action);
    try {
      const rows = listEntriesInRange(db, complete);
      const suffix = `${formatDate(complete.from)}_a_${formatDate(complete.to)}`;
      if (action === 'print') await printTable(feedEntriesTable, rows);
      if (action === 'pdf') await sharePdf(feedEntriesTable, rows, suffix);
      if (action === 'xlsx') await shareXlsx(feedEntriesTable, rows, suffix);
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
  else if (count === 0) status = 'No hay entradas en este rango.';
  else status = count === 1 ? '1 entrada en el rango.' : `${count} entradas en el rango.`;

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Exportar entradas' }} />
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
