import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { SectionList, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { getFarmCode } from '@/core/farm';
import {
  ActionChip,
  Chip,
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
} from '@/core/ui';

import { personalHygieneModule } from '../module';
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
  const generateYear = () => router.push('/personal-hygiene/generate');

  const header = (
    <View style={styles.header}>
      {farmCode === null ? (
        <Notice
          tone="danger"
          message="Falta el código de explotación. Configúralo antes de crear filas."
          action={{ label: 'Ir a Ajustes', onPress: () => router.push('/farm-settings') }}
        />
      ) : null}
      <ListToolbar
        actions={
          <>
            <ActionChip
              label="Añadir fila"
              icon="plus"
              onPress={() => router.push('/personal-hygiene/new')}
            />
            <ActionChip
              label="Exportar"
              icon="file-export-outline"
              onPress={() => router.push('/personal-hygiene/export')}
            />
            <ActionChip
              label="Plantillas de actuación"
              icon="file-document-multiple-outline"
              onPress={() => router.push('/personal-hygiene/templates')}
            />
          </>
        }
        activeFilters={activeFilters}
        filtersOpen={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={() => {
          setYear(null);
          setAction(null);
        }}
        filters={
          <>
            <FilterGroup label="Año">
              <Chip label="Todos" selected={!year} onPress={() => setYear(null)} />
              {years.map((y) => (
                <Chip
                  key={y}
                  label={String(y)}
                  selected={year === y}
                  onPress={() => setYear(year === y ? null : y)}
                />
              ))}
            </FilterGroup>
            {actions.length > 0 ? (
              <FilterGroup label="Actuación">
                <Chip label="Todas" selected={!action} onPress={() => setAction(null)} />
                {actions.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    selected={action === name}
                    onPress={() => setAction(action === name ? null : name)}
                  />
                ))}
              </FilterGroup>
            ) : null}
          </>
        }
      />
    </View>
  );

  return (
    <Screen fab={<Fab label="Generar año" icon="calendar-sync" onPress={generateYear} />}>
      <Stack.Screen options={{ title: 'Higiene personal' }} />
      <SectionList
        sections={byYear(records)}
        keyExtractor={(record) => String(record.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <SectionHeader title={`${section.year} · ${rowCount(section.data.length)}`} />
        )}
        renderItem={({ item }) => (
          <ListItem
            title={item.action}
            lines={[
              `${item.productiveUnit} · ${item.place}`,
              `${item.result} · ${item.dateText}`,
              item.correctiveMeasures ? `Medidas correctoras: ${item.correctiveMeasures}` : null,
            ]}
            onPress={() =>
              router.push({ pathname: '/personal-hygiene/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          activeFilters ? (
            <EmptyState icon="filter-off-outline" title="No hay filas con estos filtros" />
          ) : (
            <EmptyState
              icon={personalHygieneModule.icon}
              tone={colors.category[personalHygieneModule.category]}
              title="Todavía no hay filas"
              message="Crea las plantillas de actuación y pulsa «Generar año» para crear las filas del año."
              action={{ label: 'Generar año', icon: 'calendar-sync', onPress: generateYear }}
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
