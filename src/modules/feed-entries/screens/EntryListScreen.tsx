import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import { formatDate, formatQuantity } from '@/core/export/format';
import {
  Button,
  CenteredMessage,
  Chip,
  ChipRow,
  DateRangeField,
  ListItem,
  Screen,
  spacing,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { listEntries, listEntrySupplierNames } from '../repository';
import type { FeedEntry } from '../schema';

export default function EntryListScreen() {
  const colors = useThemeColors();
  // Set when opened from an automatic vehicle visit.
  const params = useLocalSearchParams<{ visitId?: string }>();
  const [vehicleVisitId, setVehicleVisitId] = useState<number | null>(() =>
    params.visitId ? Number(params.visitId) : null,
  );
  const [range, setRange] = useState<OptionalDateRange>({ from: null, to: null });
  const [supplierName, setSupplierName] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [supplierNames, setSupplierNames] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setEntries(listEntries(db, { ...range, supplierName, vehicleVisitId }));
      setSupplierNames(listEntrySupplierNames(db));
    }, [range, supplierName, vehicleVisitId]),
  );

  const activeFilters =
    (range.from || range.to ? 1 : 0) + (supplierName ? 1 : 0) + (vehicleVisitId ? 1 : 0);

  const header = (
    <View style={styles.header}>
      <Button label="Nueva entrada" onPress={() => router.push('/feed-entries/new')} />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Exportar"
            variant="secondary"
            onPress={() => router.push('/feed-entries/export')}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Proveedores"
            variant="secondary"
            onPress={() => router.push('/feed-entries/suppliers')}
          />
        </View>
      </View>
      <ChipRow>
        <Chip
          label={activeFilters ? `Filtros (${activeFilters})` : 'Filtros'}
          selected={showFilters}
          onPress={() => setShowFilters(!showFilters)}
        />
        {activeFilters ? (
          <Chip
            label="Quitar filtros"
            onPress={() => {
              setRange({ from: null, to: null });
              setSupplierName(null);
              setVehicleVisitId(null);
            }}
          />
        ) : null}
      </ChipRow>
      {vehicleVisitId ? (
        <View style={[styles.visitFilter, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.text }}>Entradas de una visita de Entrada de vehículos.</Text>
          <ChipRow>
            <Chip label="Ver todas" onPress={() => setVehicleVisitId(null)} />
          </ChipRow>
        </View>
      ) : null}
      {showFilters ? (
        <View style={[styles.filters, { borderColor: colors.border }]}>
          <DateRangeField value={range} onChange={setRange} optional />
          {supplierNames.length > 0 ? (
            <View style={styles.supplierFilter}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Proveedor</Text>
              <ChipRow>
                <Chip label="Todos" selected={!supplierName} onPress={() => setSupplierName(null)} />
                {supplierNames.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={supplierName === name}
                    onPress={() => setSupplierName(supplierName === name ? null : name)}
                  />
                ))}
              </ChipRow>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Entradas de alimentos' }} />
      <FlatList
        data={entries}
        keyExtractor={(entry) => String(entry.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <ListItem
            title={`${formatDate(item.date)} · ${formatQuantity(item.quantity, item.unit)}`}
            subtitle={[
              `${item.supplierName} — ${item.feedName}`,
              item.invoice ? `Factura/albarán: ${item.invoice}` : null,
              item.truckPlate ? `Camión: ${item.truckPlate}` : null,
            ]
              .filter(Boolean)
              .join('\n')}
            onPress={() =>
              router.push({ pathname: '/feed-entries/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        ListEmptyComponent={
          <CenteredMessage
            title={activeFilters ? 'No hay entradas con estos filtros' : 'Todavía no hay entradas'}
            message={activeFilters ? undefined : 'Pulsa «Nueva entrada» para registrar la primera.'}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  filters: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.md },
  supplierFilter: { gap: spacing.xs },
  filterLabel: { fontSize: 14, fontWeight: '600' },
  visitFilter: { borderWidth: 1, borderRadius: 8, padding: spacing.sm + 4, gap: spacing.sm },
});
