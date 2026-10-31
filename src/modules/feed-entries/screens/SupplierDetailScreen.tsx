import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import {
  Button,
  CenteredMessage,
  confirmAsync,
  radius,
  Screen,
  spacing,
  TextField,
  typography,
  useThemeColors,
} from '@/core/ui';

import { FeedRow } from '../components/FeedRow';
import { normalizePlate } from '../../vehicle-entries';
import {
  addFeed,
  addTruck,
  deleteFeed,
  deleteSupplier,
  deleteTruck,
  DuplicateNameError,
  getSupplierWithFeeds,
  renameFeed,
  renameSupplier,
  type SupplierWithFeeds,
} from '../favoritesRepository';
import { normalizeName } from '../names';

type Props = {
  supplierId: number;
};

/** Runs a favorites change; returns a user message if the name is duplicated. */
function tryRename(action: () => void, duplicateMessage: string): string | undefined {
  try {
    action();
    return undefined;
  } catch (error) {
    if (error instanceof DuplicateNameError) return duplicateMessage;
    throw error;
  }
}

export default function SupplierDetailScreen({ supplierId }: Props) {
  const colors = useThemeColors();
  const [supplier, setSupplier] = useState<SupplierWithFeeds | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | undefined>();
  const [newFeed, setNewFeed] = useState('');
  const [feedError, setFeedError] = useState<string | undefined>();
  const [newTruck, setNewTruck] = useState('');
  const [truckError, setTruckError] = useState<string | undefined>();

  const reload = useCallback(() => {
    const found = getSupplierWithFeeds(db, supplierId) ?? null;
    setSupplier(found);
    if (found) setName(found.name);
  }, [supplierId]);
  useFocusEffect(reload);

  if (supplier === undefined) return null;
  if (supplier === null) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Proveedor' }} />
        <CenteredMessage title="Este proveedor ya no existe" />
      </Screen>
    );
  }

  const nameChanged = normalizeName(name) !== supplier.name;

  const onRename = () => {
    if (!normalizeName(name)) {
      setNameError('Escribe el nombre del proveedor');
      return;
    }
    const message = tryRename(
      () => renameSupplier(db, supplier.id, name),
      'Ya hay otro proveedor con ese nombre',
    );
    setNameError(message);
    if (!message) reload();
  };

  const onAddFeed = () => {
    if (!normalizeName(newFeed)) {
      setFeedError('Escribe el nombre del pienso');
      return;
    }
    const message = tryRename(
      () => addFeed(db, supplier.id, newFeed),
      'Ese pienso ya está en la lista',
    );
    setFeedError(message);
    if (!message) {
      setNewFeed('');
      reload();
    }
  };

  const onDeleteFeed = async (feedId: number, feedName: string) => {
    const confirmed = await confirmAsync({
      title: 'Borrar pienso',
      message: `¿Quitar «${feedName}» de los piensos habituales? Las entradas ya registradas no cambian.`,
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteFeed(db, feedId);
    reload();
  };

  const onAddTruck = () => {
    if (!normalizePlate(newTruck)) {
      setTruckError('Escribe la matrícula del camión');
      return;
    }
    const message = tryRename(
      () => addTruck(db, supplier.id, newTruck),
      'Ese camión ya está en la lista',
    );
    setTruckError(message);
    if (!message) {
      setNewTruck('');
      reload();
    }
  };

  const onDeleteTruck = async (truckId: number, plate: string) => {
    const confirmed = await confirmAsync({
      title: 'Borrar camión',
      message: `¿Quitar «${plate}» de los camiones habituales? Las entradas y visitas ya registradas no cambian.`,
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteTruck(db, truckId);
    reload();
  };

  const onDeleteSupplier = async () => {
    const confirmed = await confirmAsync({
      title: 'Borrar proveedor',
      message: `¿Borrar «${supplier.name}» y sus piensos y camiones habituales de favoritos? Las entradas ya registradas no cambian.`,
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteSupplier(db, supplier.id);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: supplier.name }} />

      <View style={styles.group}>
        <TextField
          label="Nombre del proveedor"
          value={name}
          onChangeText={(text) => {
            setName(text);
            setNameError(undefined);
          }}
          autoCapitalize="words"
          error={nameError}
        />
        {nameChanged ? <Button label="Guardar nombre" onPress={onRename} /> : null}
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Cambiar el nombre no modifica las entradas ya registradas.
        </Text>
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Piensos habituales</Text>
      {supplier.feeds.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Todavía no hay piensos para este proveedor.</Text>
      ) : null}
      {supplier.feeds.map((feed) => (
        <FeedRow
          key={feed.id}
          name={feed.name}
          onRename={(feedName) =>
            normalizeName(feedName)
              ? tryRename(() => {
                  renameFeed(db, feed.id, feedName);
                  reload();
                }, 'Ese pienso ya está en la lista')
              : 'Escribe el nombre del pienso'
          }
          onDelete={() => onDeleteFeed(feed.id, feed.name)}
        />
      ))}

      <View style={styles.group}>
        <TextField
          label="Nuevo pienso"
          value={newFeed}
          onChangeText={(text) => {
            setNewFeed(text);
            setFeedError(undefined);
          }}
          placeholder="Cerdos crecimiento"
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={onAddFeed}
          error={feedError}
        />
        <Button label="Añadir pienso" variant="secondary" onPress={onAddFeed} />
      </View>

      <Text style={[styles.section, { color: colors.text }]}>Camiones habituales</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Se sugieren en la matrícula del camión de cada entrada; si solo hay uno, se rellena solo.
      </Text>
      {supplier.trucks.length === 0 ? (
        <Text style={{ color: colors.textMuted }}>Todavía no hay camiones para este proveedor.</Text>
      ) : null}
      {supplier.trucks.map((truck) => (
        <View
          key={truck.id}
          style={[styles.truck, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}
        >
          <Text style={[styles.truckPlate, { color: colors.text }]}>{truck.plate}</Text>
          <Button
            label="Borrar"
            variant="danger"
            onPress={() => onDeleteTruck(truck.id, truck.plate)}
          />
        </View>
      ))}

      <View style={styles.group}>
        <TextField
          label="Nuevo camión (matrícula)"
          value={newTruck}
          onChangeText={(text) => {
            setNewTruck(text);
            setTruckError(undefined);
          }}
          placeholder="1234 BCD"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onAddTruck}
          error={truckError}
        />
        <Button label="Añadir camión" variant="secondary" onPress={onAddTruck} />
      </View>

      <View style={styles.danger}>
        <Button label="Borrar proveedor" variant="danger" onPress={onDeleteSupplier} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  hint: typography.caption,
  section: { ...typography.heading, marginTop: spacing.sm },
  danger: { marginTop: spacing.lg },
  truck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  truckPlate: { flex: 1, ...typography.bodyStrong },
});
