import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import {
  Button,
  CenteredMessage,
  confirmAsync,
  FrequencyField,
  Screen,
  spacing,
  TextField,
} from '@/core/ui';

import { CleaningFields } from '../components/CleaningFields';
import { EMPTY_SUGGESTIONS, loadFormSuggestions, type FormSuggestions } from '../formSuggestions';
import { deletePeriodic, getPeriodic, updatePeriodic } from '../repository';
import {
  toFieldValues,
  validatePeriodicForm,
  type FormErrors,
  type PeriodicRecordFormValues,
} from '../validation';

type Props = { periodicId: number };

function loadValues(id: number): PeriodicRecordFormValues | null {
  const cleaning = getPeriodic(db, id);
  if (!cleaning) return null;
  return { ...toFieldValues(cleaning), frequency: cleaning.frequency, year: String(cleaning.year) };
}

/** Edits a periodic cleaning; they are created with "Generar año". */
export default function PeriodicFormScreen({ periodicId }: Props) {
  const [values, setValues] = useState<PeriodicRecordFormValues | null>(() => loadValues(periodicId));
  const [errors, setErrors] = useState<FormErrors<PeriodicRecordFormValues>>({});
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);

  useFocusEffect(useCallback(() => setSuggestions(loadFormSuggestions(db)), []));

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Limpieza periódica' }} />
        <CenteredMessage title="Esta limpieza ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<PeriodicRecordFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof PeriodicRecordFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validatePeriodicForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      updatePeriodic(db, periodicId, result.value);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    const confirmed = await confirmAsync({
      title: 'Borrar limpieza',
      message: '¿Seguro que quieres borrar esta limpieza periódica? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deletePeriodic(db, periodicId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Editar limpieza periódica' }} />

      <TextField
        label="Año"
        value={values.year}
        onChangeText={(year) => change({ year })}
        keyboardType="number-pad"
        maxLength={4}
        error={errors.year}
      />

      <CleaningFields
        values={values}
        onChange={change}
        errors={errors}
        suggestions={suggestions}
        autofill={false}
      />

      <FrequencyField
        value={values.frequency}
        onChange={(frequency) => change({ frequency })}
        suggestions={suggestions.frequencies}
        error={errors.frequency}
      />

      <TextField
        label="Fecha de revisión"
        optional
        value={values.reviewText}
        onChangeText={(reviewText) => change({ reviewText })}
        example="Semanalmente 2023"
        autoCapitalize="sentences"
        error={errors.reviewText}
      />

      <View style={styles.buttons}>
        <Button label="Guardar cambios" onPress={onSave} />
        <Button label="Borrar limpieza" variant="danger" onPress={onDelete} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
