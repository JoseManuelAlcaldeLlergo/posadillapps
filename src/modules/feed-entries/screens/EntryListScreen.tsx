import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { groupByMonth } from '@/core/dates';
import { db } from '@/core/db';
import { formatQuantity } from '@/core/export/format';
import {
  ActionChip,
  Chip,
  DateBadge,
  DateRangeField,
  EmptyState,
  Fab,
  FAB_CLEARANCE,
  FilterGroup,
  ListItem,
  ListToolbar,
  Notice,
  Screen,
  SectionHeader,
  spacing,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { feedEntriesModule } from '../module';
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

  const activeFilters = (range.from || range.to ? 1 : 0) + (supplierName ? 1 : 0) + (vehicleVisitId ? 1 : 0);
  const newEntry = () => router.push('/feed-entries/new');

  const header = (
    <View style={styles.header}>
      <ListToolbar
        actions={
          <>
            <ActionChip
              label="Exportar"
              icon="file-export-outline"
              onPress={() => router.push('/feed-entries/export')}
            />
            <ActionChip
              label="Proveedores"
              icon="truck-outline"
              onPress={() => router.push('/feed-entries/suppliers')}
            />
          </>
        }
        activeFilters={activeFilters}
        filtersOpen={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {
          setRange({ from: null, to: null });
          setSupplierName(null);
          setVehicleVisitId(null);
        }}
        filters={
          <>
            <DateRangeField value={range} onChange={setRange} optional />
            {supplierNames.length > 0 ? (
              <FilterGroup label="Proveedor">
                <Chip label="Todos" selected={!supplierName} onPress={() => setSupplierName(null)} />
                {supplierNames.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={supplierName === name}
                    onPress={() => setSupplierName(supplierName === name ? null : name)}
                  />
                ))}
              </FilterGroup>
            ) : null}
          </>
        }
      />
      {vehicleVisitId ? (
        <Notice
          message="Entradas de una visita de Entrada de vehículos."
          action={{ label: 'Ver todas', onPress: () => setVehicleVisitId(null) }}
        />
      ) : null}
    </View>
  );

  return (
    <Screen fab={<Fab label="Nueva entrada" onPress={newEntry} />}>
      <Stack.Screen options={{ title: 'Entradas de alimentos' }} />
      <SectionList
        sections={groupByMonth(entries, (entry) => entry.date)}
        keyExtractor={(entry) => String(entry.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderItem={({ item }) => (
          <ListItem
            leading={<DateBadge date={item.date} />}
            title={formatQuantity(item.quantity, item.unit)}
            lines={[
              item.feedName,
              item.supplierName,
              [
                item.invoice ? `Factura/albarán ${item.invoice}` : null,
                item.truckPlate ? `Camión ${item.truckPlate}` : null,
              ]
                .filter(Boolean)
                .join(' · '),
            ]}
            onPress={() => router.push({ pathname: '/feed-entries/[id]', params: { id: String(item.id) } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          activeFilters ? (
            <EmptyState icon="filter-off-outline" title="No hay entradas con estos filtros" />
          ) : (
            <EmptyState
              icon={feedEntriesModule.icon}
              tone={colors.category[feedEntriesModule.category]}
              title="Todavía no hay entradas"
              message="Registra aquí el pienso y el forraje que llegan a la explotación."
              action={{ label: 'Nueva entrada', icon: 'plus', onPress: newEntry }}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: FAB_CLEARANCE },
  header: { gap: spacing.sm },
  separator: { height: spacing.sm },
});
