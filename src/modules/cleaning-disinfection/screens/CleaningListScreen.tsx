import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { groupByMonth } from '@/core/dates';
import { db } from '@/core/db';
import { getFarmCode } from '@/core/farm';
import { nameKey } from '@/core/text';
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
  typography,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { cleaningDisinfectionModule } from '../module';
import { listApplications, listRegulars, usedProductNames } from '../repository';
import type { CleaningApplication, CleaningRegular } from '../schema';
import { formatWaitingDays } from '../waitingPeriod';

type Item =
  { kind: 'regular'; regular: CleaningRegular } | { kind: 'application'; application: CleaningApplication };
type Section = { key: string; title: string; empty?: string; data: Item[] };

function details(record: CleaningRegular | CleaningApplication): string {
  return `Espera ${formatWaitingDays(record.waitingDays)} · ${record.productiveUnit}`;
}

/** Regular applications first, then the applications month by month. */
function buildSections(
  regulars: CleaningRegular[],
  applications: CleaningApplication[],
  filtered: boolean,
): Section[] {
  const empty = filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.';
  return [
    {
      key: 'regulars',
      title: 'Aplicaciones habituales',
      empty,
      data: regulars.map((regular) => ({ kind: 'regular' as const, regular })),
    },
    ...(applications.length > 0
      ? groupByMonth(applications, (application) => application.date).map((month) => ({
          key: month.key,
          title: month.title,
          data: month.data.map((application) => ({ kind: 'application' as const, application })),
        }))
      : [{ key: 'applications', title: 'Aplicaciones', empty, data: [] }]),
  ];
}

export default function CleaningListScreen() {
  const colors = useThemeColors();
  const [range, setRange] = useState<OptionalDateRange>({ from: null, to: null });
  const [product, setProduct] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [regulars, setRegulars] = useState<CleaningRegular[]>([]);
  const [applications, setApplications] = useState<CleaningApplication[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [farmCode, setFarmCode] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      const filters = { ...range, product };
      setRegulars(listRegulars(db, filters));
      setApplications(listApplications(db, filters));
      setProducts(usedProductNames(db));
      setFarmCode(getFarmCode(db));
    }, [range, product]),
  );

  const activeFilters = (range.from || range.to ? 1 : 0) + (product ? 1 : 0);
  const nothing = regulars.length === 0 && applications.length === 0;
  const sections = nothing ? [] : buildSections(regulars, applications, activeFilters > 0);
  const newApplication = () => router.push('/cleaning-disinfection/applications/new');
  const repeat = (id: number) =>
    router.push({ pathname: '/cleaning-disinfection/applications/new', params: { repeat: String(id) } });

  const header = (
    <View style={styles.header}>
      {farmCode === null ? (
        <Notice
          tone="danger"
          message="Falta el código de explotación. Configúralo antes de crear registros."
          action={{ label: 'Ir a Ajustes', onPress: () => router.push('/farm-settings') }}
        />
      ) : null}
      <ListToolbar
        actions={
          <>
            <ActionChip
              label="Nueva habitual"
              icon="calendar-plus"
              onPress={() => router.push('/cleaning-disinfection/regulars/new')}
            />
            <ActionChip
              label="Exportar"
              icon="file-export-outline"
              onPress={() => router.push('/cleaning-disinfection/export')}
            />
            <ActionChip
              label="Productos favoritos"
              icon="flask-outline"
              onPress={() => router.push('/cleaning-disinfection/products')}
            />
          </>
        }
        activeFilters={activeFilters}
        filtersOpen={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {
          setRange({ from: null, to: null });
          setProduct(null);
        }}
        filters={
          <>
            <DateRangeField value={range} onChange={setRange} optional />
            <FilterGroup label="Producto">
              <Chip label="Todos" selected={!product} onPress={() => setProduct(null)} />
              {products.map((name) => {
                const selected = product !== null && nameKey(product) === nameKey(name);
                return (
                  <Chip
                    key={name}
                    label={name}
                    selected={selected}
                    onPress={() => setProduct(selected ? null : name)}
                  />
                );
              })}
            </FilterGroup>
          </>
        }
      />
    </View>
  );

  return (
    <Screen fab={<Fab label="Nueva aplicación" onPress={newApplication} />}>
      <Stack.Screen options={{ title: 'Limpieza y desinfección' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => (item.kind === 'regular' ? `r${item.regular.id}` : `a${item.application.id}`)}
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
          item.kind === 'regular' ? (
            <ListItem
              title={item.regular.productName}
              lines={[`${item.regular.frequency} · ${item.regular.place}`, details(item.regular)]}
              badge={item.regular.active ? undefined : 'Inactiva'}
              onPress={() =>
                router.push({
                  pathname: '/cleaning-disinfection/regulars/[id]',
                  params: { id: String(item.regular.id) },
                })
              }
            />
          ) : (
            <ListItem
              leading={<DateBadge date={item.application.date} />}
              title={item.application.productName}
              lines={[item.application.place, details(item.application)]}
              actions={
                <ActionChip label="Repetir" icon="repeat" onPress={() => repeat(item.application.id)} />
              }
              onPress={() =>
                router.push({
                  pathname: '/cleaning-disinfection/applications/[id]',
                  params: { id: String(item.application.id) },
                })
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          activeFilters ? (
            <EmptyState icon="filter-off-outline" title="No hay aplicaciones con estos filtros" />
          ) : (
            <EmptyState
              icon={cleaningDisinfectionModule.icon}
              tone={colors.category[cleaningDisinfectionModule.category]}
              title="Todavía no hay aplicaciones"
              message="Apunta cada limpieza, desinfección, desinsectación o desratización."
              action={{ label: 'Nueva aplicación', icon: 'plus', onPress: newApplication }}
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
  sectionEmpty: typography.caption,
});
