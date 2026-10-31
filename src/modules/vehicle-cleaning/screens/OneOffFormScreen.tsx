import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { todayIso } from '@/core/dates';
import { db } from '@/core/db';
import { Button, CenteredMessage, confirmAsync, DateField, Screen, spacing, TextField } from '@/core/ui';

import { CleaningFields } from '../components/CleaningFields';
import { EMPTY_SUGGESTIONS, loadFormSuggestions, type FormSuggestions } from '../formSuggestions';
import { createOneOff, deleteOneOff, getOneOff, updateOneOff } from '../repository';
import {
  toFieldValues,
  validateOneOffForm,
  type FormErrors,
  type OneOffFormValues,
} from '../validation';

type Props = {
  /** Cleaning to edit; omitted to create a new one. */
  oneOffId?: number;
  /** Cleaning to repeat: a new one with its values and today's date. */
  repeatId?: number;
};

function loadValues(oneOffId: number | undefined, repeatId: number | undefined): OneOffFormValues | null {
  const sourceId = oneOffId ?? repeatId;
  if (sourceId === undefined) {
    return { plate: '', productName: '', vehicleType: '', reviewText: '', date: todayIso() };
  }
  const cleaning = getOneOff(db, sourceId);
  if (!cleaning) return null;
  if (oneOffId !== undefined) return { ...toFieldValues(cleaning), date: cleaning.date };
  // A repeat is another cleaning: today's date, no review yet.
  return { ...toFieldValues(cleaning), reviewText: '', date: todayIso() };
}

export default function OneOffFormScreen({ oneOffId, repeatId }: Props) {
  const isEdit = oneOffId !== undefined;
  const [values, setValues] = useState<OneOffFormValues | null>(() => loadValues(oneOffId, repeatId));
  const [errors, setErrors] = useState<FormErrors<OneOffFormValues>>({});
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);

  useFocusEffect(useCallback(() => setSuggestions(loadFormSuggestions(db)), []));

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Limpieza puntual' }} />
        <CenteredMessage title="Esta limpieza ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<OneOffFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof OneOffFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateOneOffForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      if (isEdit) updateOneOff(db, oneOffId, result.value);
      else createOneOff(db, result.value);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onRepeat = () => {
    if (oneOffId === undefined) return;
    router.replace({ pathname: '/vehicle-cleaning/one-offs/new', params: { repeat: String(oneOffId) } });
  };

  const onDelete = async () => {
    if (oneOffId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar limpieza',
      message: '¿Seguro que quieres borrar esta limpieza puntual? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteOneOff(db, oneOffId);
    router.back();
  };

  const title = isEdit
    ? 'Editar limpieza puntual'
    : repeatId !== undefined
      ? 'Repetir limpieza'
      : 'Nueva limpieza puntual';

  return (
    <Screen scroll>
      <Stack.Screen options={{ title }} />

      <DateField
        label="Fecha"
        value={values.date}
        onChange={(date) => change({ date: date ?? '' })}
        error={errors.date}
      />

      <CleaningFields
        values={values}
        onChange={change}
        errors={errors}
        suggestions={suggestions}
        autofill={!isEdit}
      />

      <TextField
        label="Fecha de revisión"
        optional
        value={values.reviewText}
        onChangeText={(reviewText) => change({ reviewText })}
        placeholder="Sin revisar"
        autoCapitalize="sentences"
        error={errors.reviewText}
      />

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? (
          <>
            <Button label="Repetir con fecha de hoy" variant="secondary" onPress={onRepeat} />
            <Button label="Borrar limpieza" variant="danger" onPress={onDelete} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
