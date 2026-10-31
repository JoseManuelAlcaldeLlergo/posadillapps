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
  TextField,
  typography,
  useThemeColors,
  type OptionalDateRange,
} from '@/core/ui';

import { isAutomatic, listRegulars, listVisits } from '../repository';
import type { VehicleRegular, VehicleVisit } from '../schema';
import { VEHICLE_TYPE_LABELS, VEHICLE_TYPE_OPTIONS, type VehicleType } from '../vehicleTypes';

type Item = { kind: 'regular'; regular: VehicleRegular } | { kind: 'visit'; visit: VehicleVisit };
type Section = { title: string; empty: string; data: Item[] };

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

  const activeFilters =
    (range.from || range.to ? 1 : 0) + (plate.trim() ? 1 : 0) + (vehicleType ? 1 : 0);
  const filtered = activeFilters > 0;

  const sections: Section[] = [
    {
      title: 'Vehículos habituales',
      empty: filtered ? 'Ninguno con estos filtros.' : 'Ninguno todavía.',
      data: regulars.map((regular) => ({ kind: 'regular', regular })),
    },
    {
      title: 'Visitas',
      empty: filtered ? 'Ninguna con estos filtros.' : 'Ninguna todavía.',
      data: visits.map((visit) => ({ kind: 'visit', visit })),
    },
  ];

  const header = (
    <View style={styles.header}>
      <Button label="Nueva visita" onPress={() => router.push('/vehicle-entries/visits/new')} />
      <View style={styles.actions}>
        <View style={styles.action}>
          <Button
            label="Nuevo habitual"
            variant="secondary"
            onPress={() => router.push('/vehicle-entries/regulars/new')}
          />
        </View>
        <View style={styles.action}>
          <Button
            label="Exportar"
            variant="secondary"
            onPress={() => router.push('/vehicle-entries/export')}
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
              setPlate('');
              setVehicleType(null);
            }}
          />
        ) : null}
      </ChipRow>
      {showFilters ? (
        <View style={[styles.filters, { borderColor: colors.outlineVariant }]}>
          <DateRangeField value={range} onChange={setRange} optional />
          <TextField
            label="Matrícula"
            value={plate}
            onChangeText={setPlate}
            placeholder="Parte de la matrícula"
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <View style={styles.typeFilter}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Tipo de vehículo</Text>
            <ChipRow>
              <Chip label="Todos" selected={!vehicleType} onPress={() => setVehicleType(null)} />
              {VEHICLE_TYPE_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={vehicleType === option.value}
                  onPress={() =>
                    setVehicleType(vehicleType === option.value ? null : option.value)
                  }
                />
              ))}
            </ChipRow>
          </View>
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Entrada de vehículos' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) =>
          item.kind === 'regular' ? `r${item.regular.id}` : `v${item.visit.id}`
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
              title={`${item.regular.plate} · ${item.regular.frequency}`}
              subtitle={`${VEHICLE_TYPE_LABELS[item.regular.vehicleType]} — ${item.regular.reason}`}
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
              title={`${formatDate(item.visit.date)} · ${item.visit.plate}`}
              subtitle={`${VEHICLE_TYPE_LABELS[item.visit.vehicleType]} — ${item.visit.reason}`}
              badge={isAutomatic(item.visit) ? 'Automática' : undefined}
              onPress={() =>
                router.push({
                  pathname: '/vehicle-entries/visits/[id]',
                  params: { id: String(item.visit.id) },
                })
              }
            />
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
  typeFilter: { gap: spacing.xs },
  filterLabel: typography.captionStrong,
  sectionTitle: { ...typography.bodyStrong, marginTop: spacing.md },
  sectionEmpty: typography.caption,
});
