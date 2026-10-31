import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import { formatDate } from '@/core/export/format';
import { getFarmCode } from '@/core/farm';
import { nameKey } from '@/core/text';
import {
  Button,
  Chip,
  ChipRow,
  DateRangeField,
  ListItem,
  Screen,
  spacing,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { listApplications, listRegulars, usedProductNames } from '../repository';
import type { CleaningApplication, CleaningRegular } from '../schema';
import { formatWaitingDays } from '../waitingPeriod';

type Item =
  | { kind: 'regular'; regular: CleaningRegular }
  | { kind: 'application'; application: CleaningApplication };
type Section = { title: string; empty: string; data: Item[] };

function details(record: CleaningRegular | CleaningApplication): string {
  return `${record.place} — espera ${formatWaitingDays(record.waitingDays)} — ${record.productiveUnit}`;
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
  const filtered = activeFilters > 0;

  const sections: Section[] = [
    {
      title: 'Aplicaciones habituales',
      empty: filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.',
      data: regulars.map((regular) => ({ kind: 'regular', regular })),
    },
    {
      title: 'Aplicaciones',
      empty: filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.',
      data: applications.map((application) => ({ kind: 'application', application })),
    },
  ];

  const repeat = (id: number) =>
    router.push({ pathname: '/cleaning-disinfection/applications/new', params: { repeat: String(id) } });

  const header = (
    <View style={styles.header}>
      {farmCode === null ? (
        <View style={[styles.notice, { borderColor: colors.danger }]}>
          <Text style={{ color: colors.text }}>
            Falta el código de explotación. Configúralo antes de crear registros.
          </Text>
          <ChipRow>
            <Chip label="Ir a Ajustes" onPress={() => router.push('/farm-settings')} />
          </ChipRow>
        </View>
      ) : null}
      <Button
        label="Nueva aplicación"
        onPress={() => router.push('/cleaning-disinfection/applications/new')}
      />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Nueva habitual"
            variant="secondary"
            onPress={() => router.push('/cleaning-disinfection/regulars/new')}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Exportar"
            variant="secondary"
            onPress={() => router.push('/cleaning-disinfection/export')}
          />
        </View>
      </View>
      <ChipRow>
        <Chip
          label="Productos favoritos"
          onPress={() => router.push('/cleaning-disinfection/products')}
        />
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
              setProduct(null);
            }}
          />
        ) : null}
      </ChipRow>
      {showFilters ? (
        <View style={[styles.filters, { borderColor: colors.border }]}>
          <DateRangeField value={range} onChange={setRange} optional />
          <View style={styles.productFilter}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Producto</Text>
            <ChipRow>
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
            </ChipRow>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Limpieza y desinfección' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.kind === 'regular' ? `r${item.regular.id}` : `a${item.application.id}`
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
        )}
        renderSectionFooter={({ section }) =>
          section.data.length === 0 ? (
            <Text style={[styles.sectionEmpty, { color: colors.textMuted }]}>{section.empty}</Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.kind === 'regular' ? (
            <ListItem
              title={`${item.regular.productName} · ${item.regular.frequency}`}
              subtitle={details(item.regular)}
              badge={item.regular.active ? undefined : 'Inactiva'}
              onPress={() =>
                router.push({
                  pathname: '/cleaning-disinfection/regulars/[id]',
                  params: { id: String(item.regular.id) },
                })
              }
            />
          ) : (
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <ListItem
                  title={`${formatDate(item.application.date)} · ${item.application.productName}`}
                  subtitle={details(item.application)}
                  onPress={() =>
                    router.push({
                      pathname: '/cleaning-disinfection/applications/[id]',
                      params: { id: String(item.application.id) },
                    })
                  }
                />
              </View>
              <Button label="Repetir" variant="secondary" onPress={() => repeat(item.application.id)} />
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
  notice: { borderWidth: 1, borderRadius: 8, padding: spacing.sm + 4, gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  filters: { borderWidth: 1, borderRadius: 12, padding: spacing.md, gap: spacing.md },
  productFilter: { gap: spacing.xs },
  filterLabel: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: spacing.md },
  sectionEmpty: { fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  rowItem: { flex: 1 },
});
