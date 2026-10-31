import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import { getFarmCode } from '@/core/farm';
import {
  Button,
  CenteredMessage,
  Chip,
  ChipRow,
  ListItem,
  radius,
  Screen,
  spacing,
  typography,
  useThemeColors,
} from '@/core/ui';

import { listRecordActions, listRecords, listRecordYears } from '../repository';
import type { HygieneRecord } from '../schema';

type Section = { year: number; data: HygieneRecord[] };

/** Groups rows (already sorted newest year first) by year. */
function byYear(records: HygieneRecord[]): Section[] {
  const sections: Section[] = [];
  for (const record of records) {
    const last = sections[sections.length - 1];
    if (last?.year === record.year) last.data.push(record);
    else sections.push({ year: record.year, data: [record] });
  }
  return sections;
}

function rowCount(count: number): string {
  return count === 1 ? '1 fila' : `${count} filas`;
}

export default function RecordListScreen() {
  const colors = useThemeColors();
  const [year, setYear] = useState<number | null>(null);
  const [action, setAction] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<HygieneRecord[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [farmCode, setFarmCode] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setRecords(listRecords(db, { year, action }));
      setYears(listRecordYears(db));
      setActions(listRecordActions(db));
      setFarmCode(getFarmCode(db));
    }, [year, action]),
  );

  const activeFilters = (year ? 1 : 0) + (action ? 1 : 0);

  const header = (
    <View style={styles.header}>
      {farmCode === null ? (
        <View style={[styles.notice, { borderColor: colors.danger }]}>
          <Text style={{ color: colors.text }}>
            Falta el código de explotación. Configúralo antes de crear filas.
          </Text>
          <ChipRow>
            <Chip label="Ir a Ajustes" onPress={() => router.push('/farm-settings')} />
          </ChipRow>
        </View>
      ) : null}
      <Button label="Generar año" onPress={() => router.push('/personal-hygiene/generate')} />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Añadir fila"
            variant="secondary"
            onPress={() => router.push('/personal-hygiene/new')}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Exportar"
            variant="secondary"
            onPress={() => router.push('/personal-hygiene/export')}
          />
        </View>
      </View>
      <Button
        label="Plantillas de actuación"
        variant="secondary"
        onPress={() => router.push('/personal-hygiene/templates')}
      />
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
              setYear(null);
              setAction(null);
            }}
          />
        ) : null}
      </ChipRow>
      {showFilters ? (
        <View style={[styles.filters, { borderColor: colors.border }]}>
          <View style={styles.filter}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Año</Text>
            <ChipRow>
              <Chip label="Todos" selected={!year} onPress={() => setYear(null)} />
              {years.map((y) => (
                <Chip
                  key={y}
                  label={String(y)}
                  selected={year === y}
                  onPress={() => setYear(year === y ? null : y)}
                />
              ))}
            </ChipRow>
          </View>
          {actions.length > 0 ? (
            <View style={styles.filter}>
              <Text style={[styles.filterLabel, { color: colors.text }]}>Actuación</Text>
              <ChipRow>
                <Chip label="Todas" selected={!action} onPress={() => setAction(null)} />
                {actions.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={action === name}
                    onPress={() => setAction(action === name ? null : name)}
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
      <Stack.Screen options={{ title: 'Higiene personal' }} />
      <SectionList
        sections={byYear(records)}
        keyExtractor={(record) => String(record.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {section.year} · {rowCount(section.data.length)}
          </Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <ListItem
              title={item.action}
              subtitle={[
                `${item.productiveUnit} · ${item.place}`,
                `${item.result} · ${item.dateText}`,
                item.correctiveMeasures ? `Medidas correctoras: ${item.correctiveMeasures}` : null,
              ]
                .filter(Boolean)
                .join('\n')}
              onPress={() =>
                router.push({ pathname: '/personal-hygiene/[id]', params: { id: String(item.id) } })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <CenteredMessage
            title={activeFilters ? 'No hay filas con estos filtros' : 'Todavía no hay filas'}
            message={
              activeFilters
                ? undefined
                : 'Crea las plantillas de actuación y pulsa «Generar año» para crear las filas del año.'
            }
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md },
  header: { gap: spacing.sm, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
  notice: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm + 4, gap: spacing.sm },
  filters: { borderWidth: 1, borderRadius: radius.md, padding: spacing.md, gap: spacing.md },
  filter: { gap: spacing.xs },
  filterLabel: typography.captionStrong,
  sectionTitle: { ...typography.bodyStrong, marginTop: spacing.md, marginBottom: spacing.sm },
  item: { marginBottom: spacing.sm },
});
