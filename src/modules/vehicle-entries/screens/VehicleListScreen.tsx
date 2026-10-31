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
  TextField,
  typography,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { vehicleEntriesModule } from '../module';
import { isAutomatic, listRegulars, listVisits } from '../repository';
import type { VehicleRegular, VehicleVisit } from '../schema';
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS, type VehicleType } from '../vehicleTypes';

type Item = { kind: 'regular'; regular: VehicleRegular } | { kind: 'visit'; visit: VehicleVisit };
type Section = { key: string; title: string; empty?: string; data: Item[] };

/** Regular vehicles first, then the visits month by month. */
function buildSections(regulars: VehicleRegular[], visits: VehicleVisit[], filtered: boolean): Section[] {
  return [
    {
      key: 'regulars',
      title: 'Vehículos habituales',
      empty: filtered ? 'Ninguno con estos filtros.' : 'Ninguno todavía.',
      data: regulars.map((regular) => ({ kind: 'regular' as const, regular })),
    },
    ...(visits.length > 0
      ? groupByMonth(visits, (visit) => visit.date).map((month) => ({
          key: month.key,
          title: month.title,
          data: month.data.map((visit) => ({ kind: 'visit' as const, visit })),
        }))
      : [
          {
            key: 'visits',
            title: 'Visitas',
            empty: filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.',
            data: [],
          },
        ]),
  ];
}

export default function VehicleListScreen() {
  const colors = useThemeColors();
  const [range, setRange] = useState<OptionalDateRange>({ from: null, to: null });
  const [plate, setPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [regulars, setRegulars] = useState<VehicleRegular[]>([]);
  const [visits, setVisits] = useState<VehicleVisit[]>([]);

  useFocusEffect(
    useCallback(() => {
      const filters = { ...range, plate: plate.trim() || null, vehicleType };
      setRegulars(listRegulars(db, filters));
      setVisits(listVisits(db, filters));
    }, [range, plate, vehicleType]),
  );

  const activeFilters = (range.from || range.to ? 1 : 0) + (plate.trim() ? 1 : 0) + (vehicleType ? 1 : 0);
  const nothing = regulars.length === 0 && visits.length === 0;
  const sections = nothing ? [] : buildSections(regulars, visits, activeFilters > 0);
  const newVisit = () => router.push('/vehicle-entries/visits/new');

  const header = (
    <ListToolbar
      actions={
        <>
          <ActionChip
            label="Nuevo habitual"
            icon="truck-plus-outline"
            onPress={() => router.push('/vehicle-entries/regulars/new')}
          />
          <ActionChip
            label="Exportar"
            icon="file-export-outline"
            onPress={() => router.push('/vehicle-entries/export')}
          />
        </>
      }
      activeFilters={activeFilters}
      filtersOpen={showFilters}
      onToggleFilters={() => setShowFilters(!showFilters)}
      onClearFilters={() => {
        setRange({ from: null, to: null });
        setPlate('');
        setVehicleType(null);
      }}
      filters={
        <>
          <DateRangeField value={range} onChange={setRange} optional />
          <TextField
            label="Matrícula"
            value={plate}
            onChangeText={setPlate}
            placeholder="Parte de la matrícula"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <FilterGroup label="Tipo de vehículo">
            <Chip label="Todos" selected={!vehicleType} onPress={() => setVehicleType(null)} />
            {VEHICLE_TYPE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={vehicleType === option.value}
                onPress={() => setVehicleType(vehicleType === option.value ? null : option.value)}
              />
            ))}
          </FilterGroup>
        </>
      }
    />
  );

  return (
    <Screen fab={<Fab label="Nueva visita" onPress={newVisit} />}>
      <Stack.Screen options={{ title: 'Entrada de vehículos' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => (item.kind === 'regular' ? `r${item.regular.id}` : `v${item.visit.id}`)}
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
              title={item.regular.plate}
              lines={[
                item.regular.reason,
                `${VEHICLE_TYPE_LABELS[item.regular.vehicleType]} · ${item.regular.frequency}`,
              ]}
              badge={item.regular.active ? undefined : 'Inactivo'}
              onPress={() =>
                router.push({
                  pathname: '/vehicle-entries/regulars/[id]',
                  params: { id: String(item.regular.id) },
                })
              }
            />
          ) : (
            <ListItem
              leading={<DateBadge date={item.visit.date} />}
              title={item.visit.plate}
              lines={[item.visit.reason, VEHICLE_TYPE_LABELS[item.visit.vehicleType]]}
              badge={isAutomatic(item.visit) ? 'Automática' : undefined}
              badgeTone="primary"
              onPress={() =>
                router.push({
                  pathname: '/vehicle-entries/visits/[id]',
                  params: { id: String(item.visit.id) },
                })
              }
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          activeFilters ? (
            <EmptyState icon="filter-off-outline" title="No hay vehículos ni visitas con estos filtros" />
          ) : (
            <EmptyState
              icon={vehicleEntriesModule.icon}
              tone={colors.category[vehicleEntriesModule.category]}
              title="Todavía no hay visitas"
              message="Apunta cada vehículo que entra en la explotación, o da de alta los habituales."
              action={{ label: 'Nueva visita', icon: 'plus', onPress: newVisit }}
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
