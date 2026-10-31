import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { groupByMonth } from '@/core/dates';
import { db } from '@/core/db';
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
  Screen,
  SectionHeader,
  spacing,
  typography,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { plateKey } from '../../vehicle-entries';
import { vehicleCleaningModule } from '../module';
import { listOneOffs, listPeriodic, usedPlates } from '../repository';
import type { OneOffCleaning, PeriodicCleaning } from '../schema';

type Item = { kind: 'periodic'; cleaning: PeriodicCleaning } | { kind: 'oneOff'; cleaning: OneOffCleaning };
type Section = { key: string; title: string; empty?: string; data: Item[] };

/**
 * One section per year of periodic cleanings (newest first), then the
 * one-off cleanings month by month.
 */
function buildSections(
  periodic: PeriodicCleaning[],
  oneOffs: OneOffCleaning[],
  filtered: boolean,
): Section[] {
  const byYear = new Map<number, Item[]>();
  for (const cleaning of periodic) {
    const items = byYear.get(cleaning.year) ?? [];
    items.push({ kind: 'periodic', cleaning });
    byYear.set(cleaning.year, items);
  }
  const empty = filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.';
  const yearSections: Section[] = [...byYear].map(([year, data]) => ({
    key: `y${year}`,
    title: `Limpiezas periódicas ${year}`,
    data,
  }));
  const monthSections: Section[] = groupByMonth(oneOffs, (cleaning) => cleaning.date).map((month) => ({
    key: month.key,
    title: `Limpiezas puntuales · ${month.title}`,
    data: month.data.map((cleaning) => ({ kind: 'oneOff' as const, cleaning })),
  }));
  return [
    ...(yearSections.length > 0
      ? yearSections
      : [{ key: 'periodic', title: 'Limpiezas periódicas', empty, data: [] }]),
    ...(monthSections.length > 0
      ? monthSections
      : [{ key: 'oneOffs', title: 'Limpiezas puntuales', empty, data: [] }]),
  ];
}

export default function CleaningListScreen() {
  const colors = useThemeColors();
  const [range, setRange] = useState<OptionalDateRange>({ from: null, to: null });
  const [plate, setPlate] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [periodic, setPeriodic] = useState<PeriodicCleaning[]>([]);
  const [oneOffs, setOneOffs] = useState<OneOffCleaning[]>([]);
  const [plates, setPlates] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      const filters = { ...range, plate };
      setPeriodic(listPeriodic(db, filters));
      setOneOffs(listOneOffs(db, filters));
      setPlates(usedPlates(db));
    }, [range, plate]),
  );

  const activeFilters = (range.from || range.to ? 1 : 0) + (plate ? 1 : 0);
  const nothing = periodic.length === 0 && oneOffs.length === 0;
  const sections = nothing ? [] : buildSections(periodic, oneOffs, activeFilters > 0);
  const newOneOff = () => router.push('/vehicle-cleaning/one-offs/new');
  const repeat = (id: number) =>
    router.push({ pathname: '/vehicle-cleaning/one-offs/new', params: { repeat: String(id) } });

  const header = (
    <ListToolbar
      actions={
        <>
          <ActionChip
            label="Generar año"
            icon="calendar-sync"
            onPress={() => router.push('/vehicle-cleaning/generate')}
          />
          <ActionChip
            label="Exportar"
            icon="file-export-outline"
            onPress={() => router.push('/vehicle-cleaning/export')}
          />
          <ActionChip
            label="Vehículos periódicos"
            icon="car-outline"
            onPress={() => router.push('/vehicle-cleaning/vehicles')}
          />
        </>
      }
      activeFilters={activeFilters}
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      onClearFilters={() => {
        setRange({ from: null, to: null });
        setPlate(null);
      }}
      filters={
        <>
          <DateRangeField value={range} onChange={setRange} optional />
          <Text style={[typography.caption, { color: colors.textMuted }]}>
            Las limpiezas periódicas se filtran por los años del rango.
          </Text>
          <FilterGroup label="Matrícula">
            <Chip label="Todas" selected={!plate} onPress={() => setPlate(null)} />
            {plates.map((name) => {
              const selected = plate !== null && plateKey(plate) === plateKey(name);
              return (
                <Chip
                  key={name}
                  label={name}
                  selected={selected}
                  onPress={() => setPlate(selected ? null : name)}
                />
              );
            })}
          </FilterGroup>
        </>
      }
    />
  );

  return (
    <Screen fab={<Fab label="Nueva limpieza puntual" onPress={newOneOff} />}>
      <Stack.Screen options={{ title: 'Limpieza de vehículos' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.kind === 'periodic' ? 'p' : 'o'}${item.cleaning.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 && section.empty ? (
            <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>{section.empty}</Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === 'periodic' ? (
            <ListItem
              title={item.cleaning.plate}
              lines={[`${item.cleaning.frequency} · ${item.cleaning.productName}`, item.cleaning.vehicleType]}
              onPress={() =>
                router.push({
                  pathname: '/vehicle-cleaning/periodic/[id]',
                  params: { id: String(item.cleaning.id) },
                })
              }
            />
          ) : (
            <ListItem
              leading={<DateBadge date={item.cleaning.date} />}
              title={item.cleaning.plate}
              lines={[item.cleaning.productName, item.cleaning.vehicleType]}
              actions={<ActionChip label="Repetir" icon="repeat" onPress={() => repeat(item.cleaning.id)} />}
              onPress={() =>
                router.push({
                  pathname: '/vehicle-cleaning/one-offs/[id]',
                  params: { id: String(item.cleaning.id) },
                })
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          activeFilters ? (
            <EmptyState icon="filter-off-outline" title="No hay limpiezas con estos filtros" />
          ) : (
            <EmptyState
              icon={vehicleCleaningModule.icon}
              tone={colors.category[vehicleCleaningModule.category]}
              title="Todavía no hay limpiezas"
              message="Da de alta los vehículos periódicos y genera el año, o apunta una limpieza puntual."
              action={{ label: 'Nueva limpieza puntual', icon: 'plus', onPress: newOneOff }}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: FAB_CLEARANCE },
  separator: { height: spacing.sm },
  sectionEmpty: typography.caption,
});
