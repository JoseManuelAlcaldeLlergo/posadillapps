import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { Button, CenteredMessage, ListItem, Screen, spacing, TextField } from '@/core/ui';

import {
  createSupplier,
  DuplicateNameError,
  listSuppliersWithFeeds,
  type SupplierWithFeeds,
} from '../favoritesRepository';

function feedCount(count: number): string {
  if (count === 0) return 'Sin piensos habituales';
  return count === 1 ? '1 pienso habitual' : `${count} piensos habituales`;
}

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState<SupplierWithFeeds[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  const reload = useCallback(() => setSuppliers(listSuppliersWithFeeds(db)), []);
  useFocusEffect(reload);

  const onAdd = () => {
    if (!name.trim()) {
      setError('Escribe el nombre del proveedor');
      return;
    }
    try {
      createSupplier(db, name);
      setName('');
      setError(undefined);
      reload();
    } catch (e) {
      if (e instanceof DuplicateNameError) setError('Ese proveedor ya está en favoritos');
      else throw e;
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Proveedores favoritos' }} />
      <FlatList
        data={suppliers}
        keyExtractor={(supplier) => String(supplier.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.add}>
            <TextField
              label="Nuevo proveedor"
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError(undefined);
              }}
              example="Mezclas del Valle"
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={onAdd}
              error={error}
            />
            <Button label="Añadir proveedor" variant="outlined" onPress={onAdd} />
          </View>
        }
        renderItem={({ item }) => (
          <ListItem
            title={item.name}
            subtitle={feedCount(item.feeds.length)}
            onPress={() =>
              router.push({
                pathname: '/feed-entries/suppliers/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <CenteredMessage
            title="No hay proveedores favoritos"
            message="Añádelos aquí o marca «Guardar como favorito» al registrar una entrada."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.sm },
  add: { gap: spacing.sm, marginBottom: spacing.sm },
});
