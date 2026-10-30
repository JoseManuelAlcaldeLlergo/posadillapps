import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Alert, StyleSheet, Text, View, type TextInput } from 'react-native';

import { todayIso } from '@/core/dates';
import { db } from '@/core/db';
import { formatQuantity } from '@/core/export/format';
import { formatDecimalInput } from '@/core/numbers';
import {
  Button,
  CenteredMessage,
  Checkbox,
  Chip,
  ChipRow,
  confirmAsync,
  DateField,
  Screen,
  spacing,
  TextField,
  useThemeColors,
} from '@/core/ui';

import { SuggestionChips } from '../components/SuggestionChips';
import { listSuppliersWithFeeds, type SupplierWithFeeds } from '../favoritesRepository';
import { findByName } from '../names';
import { deleteEntry, getEntry, saveEntry } from '../repository';
import { DEFAULT_FEED_UNIT, FEED_UNITS, isFeedUnit } from '../units';
import { validateEntryForm, type EntryFormErrors, type EntryFormValues } from '../validation';

type Props = {
  /** Entry to edit; omitted to create a new one. */
  entryId?: number;
};

function emptyForm(): EntryFormValues {
  return {
    date: todayIso(),
    quantity: '',
    unit: DEFAULT_FEED_UNIT,
    supplierName: '',
    feedName: '',
    invoice: '',
  };
}

function loadForm(entryId: number | undefined): EntryFormValues | null {
  if (entryId === undefined) return emptyForm();
  const entry = getEntry(db, entryId);
  if (!entry) return null;
  return {
    date: entry.date,
    quantity: formatDecimalInput(entry.quantity),
    unit: isFeedUnit(entry.unit) ? entry.unit : DEFAULT_FEED_UNIT,
    supplierName: entry.supplierName,
    feedName: entry.feedName,
    invoice: entry.invoice ?? '',
  };
}

export default function EntryFormScreen({ entryId }: Props) {
  const colors = useThemeColors();
  const isEdit = entryId !== undefined;
  const quantityRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [values, setValues] = useState<EntryFormValues | null>(() => loadForm(entryId));
  const [errors, setErrors] = useState<EntryFormErrors>({});
  const [suppliers, setSuppliers] = useState<SupplierWithFeeds[]>([]);
  // New favorites are offered checked when creating, unchecked when editing old entries.
  const [saveSupplier, setSaveSupplier] = useState(!isEdit);
  const [saveFeed, setSaveFeed] = useState(!isEdit);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setSuppliers(listSuppliersWithFeeds(db));
    }, []),
  );

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Entrada' }} />
        <CenteredMessage title="Esta entrada ya no existe" />
      </Screen>
    );
  }

  const set = <K extends keyof EntryFormValues>(key: K, value: EntryFormValues[K]) => {
    setValues({ ...values, [key]: value });
    if (errors[key]) setErrors({ ...errors, [key]: undefined });
  };

  const supplier = findByName(suppliers, values.supplierName);
  const feed = supplier ? findByName(supplier.feeds, values.feedName) : undefined;
  const offerSupplier = values.supplierName.trim() !== '' && !supplier;
  const feedCanBeFavorite = Boolean(supplier) || (offerSupplier && saveSupplier);
  const offerFeed = values.feedName.trim() !== '' && !feed && feedCanBeFavorite;

  /** Saves the form; returns the saved entry's summary or null if invalid/failed. */
  const submit = (): string | null => {
    const result = validateEntryForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return null;
    }
    try {
      const saved = saveEntry(
        db,
        result.value,
        { saveSupplier: offerSupplier && saveSupplier, saveFeed: offerFeed && saveFeed },
        entryId,
      );
      return `${saved.feedName} · ${formatQuantity(saved.quantity, saved.unit)}`;
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const onSave = () => {
    if (submit() !== null) router.back();
  };

  const onSaveAndAddAnother = () => {
    const summary = submit();
    if (summary === null) return;
    // Keep date, supplier, invoice and unit; clear the product.
    setValues({ ...values, quantity: '', feedName: '' });
    setErrors({});
    setSaveFeed(true);
    setSuppliers(listSuppliersWithFeeds(db));
    setLastSaved(summary);
    quantityRef.current?.focus();
  };

  const onDelete = async () => {
    if (entryId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar entrada',
      message: '¿Seguro que quieres borrar esta entrada? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteEntry(db, entryId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Editar entrada' : 'Nueva entrada' }} />

      {lastSaved ? (
        <View style={[styles.notice, { borderColor: colors.primary }]}>
          <Text style={{ color: colors.text }}>Guardada: {lastSaved}</Text>
        </View>
      ) : null}

      <DateField
        label="Fecha"
        value={values.date}
        onChange={(date) => set('date', date ?? '')}
        error={errors.date}
      />

      <View style={styles.group}>
        <TextField
          ref={quantityRef}
          label="Cantidad"
          value={values.quantity}
          onChangeText={(text) => set('quantity', text)}
          keyboardType="decimal-pad"
          placeholder="9.340"
          error={errors.quantity}
        />
        <ChipRow>
          {FEED_UNITS.map((unit) => (
            <Chip
              key={unit}
              label={unit}
              selected={values.unit === unit}
              onPress={() => set('unit', unit)}
            />
          ))}
        </ChipRow>
      </View>

      <View style={styles.group}>
        <TextField
          label="Proveedor"
          value={values.supplierName}
          onChangeText={(text) => set('supplierName', text)}
          placeholder="Mezclas del Valle"
          autoCapitalize="words"
          error={errors.supplierName}
        />
        <SuggestionChips
          items={suppliers}
          query={values.supplierName}
          label="Favoritos"
          onSelect={(item) => set('supplierName', item.name)}
        />
        {offerSupplier ? (
          <Checkbox
            label={`Guardar «${values.supplierName.trim()}» como proveedor favorito`}
            checked={saveSupplier}
            onChange={setSaveSupplier}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <TextField
          label="Denominación comercial del pienso"
          value={values.feedName}
          onChangeText={(text) => set('feedName', text)}
          placeholder="Cerdos crecimiento"
          autoCapitalize="sentences"
          error={errors.feedName}
        />
        {supplier ? (
          <SuggestionChips
            items={supplier.feeds}
            query={values.feedName}
            label={`Piensos de ${supplier.name}`}
            onSelect={(item) => set('feedName', item.name)}
          />
        ) : null}
        {offerFeed ? (
          <Checkbox
            label={`Guardar «${values.feedName.trim()}» en los piensos de «${(supplier?.name ?? values.supplierName).trim()}»`}
            checked={saveFeed}
            onChange={setSaveFeed}
          />
        ) : null}
      </View>

      <TextField
        label="Factura/Albarán"
        optional
        value={values.invoice}
        onChangeText={(text) => set('invoice', text)}
        placeholder="F2000 525"
        autoCapitalize="characters"
      />

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? (
          <Button label="Borrar entrada" variant="danger" onPress={onDelete} />
        ) : (
          <Button
            label="Guardar y añadir otro de la misma factura"
            variant="secondary"
            onPress={onSaveAndAddAnother}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
  notice: { borderWidth: 1, borderRadius: 8, padding: spacing.sm + 4 },
});
