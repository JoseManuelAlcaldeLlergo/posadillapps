import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import {
  Button,
  CenteredMessage,
  confirmAsync,
  Screen,
  spacing,
  SuggestionChips,
  TextField,
  typography,
  useThemeColors,
} from '@/core/ui';

import { deleteProduct, DuplicateProductError, getProduct, saveProduct } from '../productsRepository';
import { placeSuggestions } from '../repository';
import { validateProductForm, type FormErrors, type ProductFormValues } from '../validation';

type Props = {
  /** Product to edit; omitted to create a new one. */
  productId?: number;
};

function loadForm(productId: number | undefined): ProductFormValues | null {
  if (productId === undefined) return { name: '', defaultWaitingDays: '0', defaultPlace: '' };
  const product = getProduct(db, productId);
  if (!product) return null;
  return {
    name: product.name,
    defaultWaitingDays: String(product.defaultWaitingDays),
    defaultPlace: product.defaultPlace ?? '',
  };
}

export default function ProductFormScreen({ productId }: Props) {
  const colors = useThemeColors();
  const isEdit = productId !== undefined;
  const [values, setValues] = useState<ProductFormValues | null>(() => loadForm(productId));
  const [errors, setErrors] = useState<FormErrors<ProductFormValues>>({});
  const [places, setPlaces] = useState<string[]>([]);

  useFocusEffect(useCallback(() => setPlaces(placeSuggestions(db)), []));

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Producto' }} />
        <CenteredMessage title="Este producto ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<ProductFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof ProductFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateProductForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      saveProduct(db, result.value, productId);
      router.back();
    } catch (error) {
      if (error instanceof DuplicateProductError) {
        setErrors({ ...errors, name: 'Ya hay otro producto con ese nombre' });
        return;
      }
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (productId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar producto',
      message: `¿Quitar «${values.name.trim()}» de los favoritos? Las aplicaciones ya registradas no cambian.`,
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteProduct(db, productId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Editar producto' : 'Nuevo producto' }} />

      <TextField
        label="Nombre"
        value={values.name}
        onChangeText={(name) => change({ name })}
        placeholder="Cal en polvo"
        autoCapitalize="sentences"
        error={errors.name}
      />

      <TextField
        label="Periodo de espera por defecto (días)"
        value={values.defaultWaitingDays}
        onChangeText={(defaultWaitingDays) => change({ defaultWaitingDays })}
        placeholder="0"
        keyboardType="number-pad"
        maxLength={4}
        error={errors.defaultWaitingDays}
      />

      <View style={styles.group}>
        <TextField
          label="Lugar de aplicación por defecto"
          optional
          value={values.defaultPlace}
          onChangeText={(defaultPlace) => change({ defaultPlace })}
          placeholder="Naves, suelo y paredes"
          autoCapitalize="sentences"
        />
        <SuggestionChips
          items={places.map((text) => ({ id: text, name: text }))}
          query={values.defaultPlace}
          label="Sugerencias"
          onSelect={(item) => change({ defaultPlace: item.name })}
        />
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Se rellenan al elegir el producto en una aplicación. Cambiarlos no modifica las aplicaciones
        ya registradas.
      </Text>

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? <Button label="Borrar producto" variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  hint: typography.caption,
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
