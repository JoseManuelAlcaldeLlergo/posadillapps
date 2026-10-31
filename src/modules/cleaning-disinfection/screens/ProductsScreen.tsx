import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { Button, CenteredMessage, ListItem, Screen, spacing } from '@/core/ui';

import { listProducts } from '../productsRepository';
import type { CleaningProduct } from '../schema';
import { formatWaitingDays } from '../waitingPeriod';

function defaults(product: CleaningProduct): string {
  const waiting = `Espera ${formatWaitingDays(product.defaultWaitingDays)}`;
  return product.defaultPlace ? `${waiting} — ${product.defaultPlace}` : waiting;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<CleaningProduct[]>([]);

  useFocusEffect(useCallback(() => setProducts(listProducts(db)), []));

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Productos favoritos' }} />
      <FlatList
        data={products}
        keyExtractor={(product) => String(product.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button
              label="Nuevo producto"
              onPress={() => router.push('/cleaning-disinfection/products/new')}
            />
          </View>
        }
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
          <CenteredMessage
            title="No hay productos favoritos"
            message="Añádelos aquí o marca «Guardar como producto favorito» al registrar una aplicación."
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
