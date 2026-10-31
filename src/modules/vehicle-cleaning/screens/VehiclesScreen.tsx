import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { Button, CenteredMessage, ListItem, Screen, spacing } from '@/core/ui';

import { listVehicles } from '../repository';
import type { CleaningVehicle } from '../schema';

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<CleaningVehicle[]>([]);

  useFocusEffect(useCallback(() => setVehicles(listVehicles(db)), []));

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Vehículos de limpieza periódica' }} />
      <FlatList
        data={vehicles}
        keyExtractor={(vehicle) => String(vehicle.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button label="Nuevo vehículo" onPress={() => router.push('/vehicle-cleaning/vehicles/new')} />
          </View>
        }
        renderItem={({ item }) => (
          <ListItem
            title={`${item.plate} · ${item.frequency}`}
            subtitle={`${item.vehicleType} — ${item.productName}`}
            badge={item.active ? undefined : 'Inactivo'}
            onPress={() =>
              router.push({ pathname: '/vehicle-cleaning/vehicles/[id]', params: { id: String(item.id) } })
            }
          />
        )}
        ListEmptyComponent={
          <CenteredMessage
            title="No hay vehículos"
            message="Añade los vehículos que se limpian periódicamente para poder generar el año."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  header: { marginBottom: spacing.sm },
});
