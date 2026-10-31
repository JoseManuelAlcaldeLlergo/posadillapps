import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import { formatDate } from '@/core/export/format';
import {
  Button,
  Chip,
  ChipRow,
  DateRangeField,
  ListItem,
  radius,
  Screen,
  spacing,
  typography,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { plateKey } from '../../vehicle-entries';
import { listOneOffs, listPeriodic, usedPlates } from '../repository';
import type { OneOffCleaning, PeriodicCleaning } from '../schema';

type Item =
  | { kind: 'periodic'; cleaning: PeriodicCleaning }
  | { kind: 'oneOff'; cleaning: OneOffCleaning };
type Section = { key: string; title: string; empty?: string; data: Item[] };

function details(cleaning: PeriodicCleaning | OneOffCleaning): string {
  return `${cleaning.vehicleType} — ${cleaning.productName}`;
}

/** One section per year of periodic cleanings (newest first), then the one-off cleanings. */
function buildSections(periodic: PeriodicCleaning[], oneOffs: OneOffCleaning[], filtered: boolean): Section[] {
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
  return [
    ...(yearSections.length > 0
      ? yearSections
      : [{ key: 'periodic', title: 'Limpiezas periódicas', empty, data: [] }]),
    {
      key: 'oneOffs',
      title: 'Limpiezas puntuales',
      empty,
      data: oneOffs.map((cleaning) => ({ kind: 'oneOff' as const, cleaning })),
    },
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
  const sections = buildSections(periodic, oneOffs, activeFilters > 0);

  const repeat = (id: number) =>
    router.push({ pathname: '/vehicle-cleaning/one-offs/new', params: { repeat: String(id) } });

  const header = (
    <View style={styles.header}>
      <Button label="Nueva limpieza puntual" onPress={() => router.push('/vehicle-cleaning/one-offs/new')} />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Generar año"
            variant="secondary"
            onPress={() => router.push('/vehicle-cleaning/generate')}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Exportar"
            variant="secondary"
            onPress={() => router.push('/vehicle-cleaning/export')}
          />
        </View>
      </View>
      <ChipRow>
        <Chip label="Vehículos periódicos" onPress={() => router.push('/vehicle-cleaning/vehicles')} />
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
              setPlate(null);
            }}
          />
        ) : null}
      </ChipRow>
      {showFilters ? (
        <View style={[styles.filters, { borderColor: colors.border }]}>
          <DateRangeField value={range} onChange={setRange} optional />
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Las limpiezas periódicas se filtran por los años del rango.
          </Text>
          <View style={styles.plateFilter}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Matrícula</Text>
            <ChipRow>
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
            </ChipRow>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Limpieza de vehículos' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.kind === 'periodic' ? 'p' : 'o'}${item.cleaning.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 && section.empty ? (
            <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>{section.empty}</Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === 'periodic' ? (
            <ListItem
              title={`${item.cleaning.plate} · ${item.cleaning.frequency}`}
              subtitle={details(item.cleaning)}
              onPress={() =>
                router.push({
                  pathname: '/vehicle-cleaning/periodic/[id]',
                  params: { id: String(item.cleaning.id) },
                })
              }
            />
          ) : (
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ListItem
                  title={`${formatDate(item.cleaning.date)} · ${item.cleaning.plate}`}
                  subtitle={details(item.cleaning)}
                  onPress={() =>
                    router.push({
                      pathname: '/vehicle-cleaning/one-offs/[id]',
                      params: { id: String(item.cleaning.id) },
                    })
                  }
                />
              </View>
              <Button label="Repetir" variant="secondary" onPress={() => repeat(item.cleaning.id)} />
            </View>
          )
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
  filters: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  hint: typography.caption,
  plateFilter: { gap: spacing.xs },
  filterLabel: typography.captionStrong,
  sectionTitle: { ...typography.bodyStrong, marginTop: spacing.md },
  sectionEmpty: typography.caption,
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowItem: { flex: 1 },
});
