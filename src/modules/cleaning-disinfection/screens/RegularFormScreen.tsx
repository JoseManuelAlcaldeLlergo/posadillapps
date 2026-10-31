import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { FarmCodeRequired, getFarmCode } from '@/core/farm';
import { findByName } from '@/core/text';
import {
  Button,
  CenteredMessage,
  Checkbox,
  confirmAsync,
  FrequencyField,
  Screen,
  spacing,
} from '@/core/ui';

import { CleaningFields } from '../components/CleaningFields';
import { FarmCodeInfo } from '../components/FarmCodeInfo';
import {
  defaultProductiveUnit,
  EMPTY_SUGGESTIONS,
  loadFormSuggestions,
  type FormSuggestions,
} from '../formSuggestions';
import { createRegular, deleteRegular, getRegular, updateRegular } from '../repository';
import {
  toFieldValues,
  validateRegularForm,
  type FormErrors,
  type RegularFormValues,
} from '../validation';

type Props = {
  /** Regular application to edit; omitted to create a new one. */
  regularId?: number;
};

type FormState = {
  values: RegularFormValues;
  /** Farm code snapshot: the saved one when editing, the current one when creating. */
  farmCode: string | null;
};

function loadForm(regularId: number | undefined): FormState | null {
  if (regularId === undefined) {
    return {
      values: {
        productiveUnit: defaultProductiveUnit(db),
        productName: '',
        place: '',
        waitingDays: '',
        reviewDate: null,
        frequency: '',
        active: true,
      },
      farmCode: getFarmCode(db),
    };
  }
  const regular = getRegular(db, regularId);
  if (!regular) return null;
  return {
    values: { ...toFieldValues(regular), frequency: regular.frequency, active: regular.active },
    farmCode: regular.farmCode,
  };
}

export default function RegularFormScreen({ regularId }: Props) {
  const isEdit = regularId !== undefined;
  const [form, setForm] = useState<FormState | null>(() => loadForm(regularId));
  const [errors, setErrors] = useState<FormErrors<RegularFormValues>>({});
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);
  const [saveProduct, setSaveProduct] = useState(!isEdit);

  useFocusEffect(
    useCallback(() => {
      setSuggestions(loadFormSuggestions(db));
      if (!isEdit) setForm((current) => current && { ...current, farmCode: getFarmCode(db) });
    }, [isEdit]),
  );

  if (!form) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Aplicación habitual' }} />
        <CenteredMessage title="Esta aplicación habitual ya no existe" />
      </Screen>
    );
  }

  if (!form.farmCode) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Nueva aplicación habitual' }} />
        <FarmCodeRequired />
      </Screen>
    );
  }

  const { values, farmCode } = form;
  const offerProduct = values.productName.trim() !== '' && !findByName(suggestions.products, values.productName);

  const change = (changes: Partial<RegularFormValues>) => {
    setForm({ ...form, values: { ...values, ...changes } });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof RegularFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateRegularForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const options = { saveProduct: offerProduct && saveProduct };
    try {
      if (isEdit) updateRegular(db, regularId, result.value, options);
      else createRegular(db, result.value, farmCode, options);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (regularId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar aplicación habitual',
      message:
        '¿Seguro que quieres borrarla? Dejará de salir en todas las exportaciones. ' +
        'Si ya no se hace, desmarca «Activa».',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteRegular(db, regularId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen
        options={{ title: isEdit ? 'Editar aplicación habitual' : 'Nueva aplicación habitual' }}
      />

      <FrequencyField
        label="Frecuencia (columna FECHA)"
        value={values.frequency}
        onChange={(frequency) => change({ frequency })}
        suggestions={suggestions.frequencies}
        error={errors.frequency}
      />

      <FarmCodeInfo farmCode={farmCode} isEdit={isEdit} />

      <CleaningFields
        values={values}
        onChange={change}
        errors={errors}
        suggestions={suggestions}
        saveProduct={saveProduct}
        onSaveProductChange={setSaveProduct}
      />

      <Checkbox
        label="Activa (sale al principio de las exportaciones)"
        checked={values.active}
        onChange={(active) => change({ active })}
      />

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? <Button label="Borrar aplicación habitual" variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
