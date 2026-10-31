import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { db } from '@/core/db';
import { EmptyState, Fab, FAB_CLEARANCE, ListItem, Screen, spacing, useThemeColors } from '@/core/ui';

import { vehicleCleaningModule } from '../module';
import { listVehicles } from '../repository';
import type { CleaningVehicle } from '../schema';

export default function VehiclesScreen() {
  const colors = useThemeColors();
  const [vehicles, setVehicles] = useState<CleaningVehicle[]>([]);

  useFocusEffect(useCallback(() => setVehicles(listVehicles(db)), []));

  const newVehicle = () => router.push('/vehicle-cleaning/vehicles/new');

  return (
    <Screen fab={<Fab label="Nuevo vehículo" onPress={newVehicle} />}>
      <Stack.Screen options={{ title: 'Vehículos de limpieza periódica' }} />
      <FlatList
        data={vehicles}
        keyExtractor={(vehicle) => String(vehicle.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListItem
            title={item.plate}
            lines={[`${item.frequency} · ${item.productName}`, item.vehicleType]}
            badge={item.active ? undefined : 'Inactivo'}
            onPress={() =>
              router.push({ pathname: '/vehicle-cleaning/vehicles/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="car-outline"
            tone={colors.category[vehicleCleaningModule.category]}
            title="No hay vehículos"
            message="Añade los vehículos que se limpian periódicamente para poder generar el año."
            action={{ label: 'Nuevo vehículo', icon: 'plus', onPress: newVehicle }}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: FAB_CLEARANCE, gap: spacing.sm },
});
