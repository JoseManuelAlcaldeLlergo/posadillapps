import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { db } from '@/core/db';
import { EmptyState, Fab, FAB_CLEARANCE, ListItem, Screen, spacing, useThemeColors } from '@/core/ui';

import { cleaningDisinfectionModule } from '../module';
import { listProducts } from '../productsRepository';
import type { CleaningProduct } from '../schema';
import { formatWaitingDays } from '../waitingPeriod';

function defaults(product: CleaningProduct): string {
  const waiting = `Espera ${formatWaitingDays(product.defaultWaitingDays)}`;
  return product.defaultPlace ? `${waiting} — ${product.defaultPlace}` : waiting;
}

export default function ProductsScreen() {
  const colors = useThemeColors();
  const [products, setProducts] = useState<CleaningProduct[]>([]);

  useFocusEffect(useCallback(() => setProducts(listProducts(db)), []));

  const newProduct = () => router.push('/cleaning-disinfection/products/new');

  return (
    <Screen fab={<Fab label="Nuevo producto" onPress={newProduct} />}>
      <Stack.Screen options={{ title: 'Productos favoritos' }} />
      <FlatList
        data={products}
        keyExtractor={(product) => String(product.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ListItem
            title={item.name}
            subtitle={defaults(item)}
            onPress={() =>
              router.push({
                pathname: '/cleaning-disinfection/products/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="flask-outline"
            tone={colors.category[cleaningDisinfectionModule.category]}
            title="No hay productos favoritos"
            message="Añádelos aquí o marca «Guardar como producto favorito» al registrar una aplicación."
            action={{ label: 'Nuevo producto', icon: 'plus', onPress: newProduct }}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: FAB_CLEARANCE, gap: spacing.sm },
});
