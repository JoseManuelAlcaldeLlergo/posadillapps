import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
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
import { EMPTY_SUGGESTIONS, loadFormSuggestions, type FormSuggestions } from '../formSuggestions';
import { deleteVehicle, DuplicateVehicleError, getVehicle, saveVehicle } from '../repository';
import { validateVehicleForm, type FormErrors, type VehicleFormValues } from '../validation';

type Props = {
  /** Vehicle to edit; omitted to create a new one. */
  vehicleId?: number;
};

function loadValues(vehicleId: number | undefined): VehicleFormValues | null {
  if (vehicleId === undefined) {
    return { plate: '', frequency: '', productName: '', vehicleType: '', active: true };
  }
  const vehicle = getVehicle(db, vehicleId);
  if (!vehicle) return null;
  return {
    plate: vehicle.plate,
    frequency: vehicle.frequency,
    productName: vehicle.productName,
    vehicleType: vehicle.vehicleType,
    active: vehicle.active,
  };
}

/** A vehicle of periodic cleaning, with the values used when generating a year. */
export default function VehicleFormScreen({ vehicleId }: Props) {
  const isEdit = vehicleId !== undefined;
  const [values, setValues] = useState<VehicleFormValues | null>(() => loadValues(vehicleId));
  const [errors, setErrors] = useState<FormErrors<VehicleFormValues>>({});
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);

  useFocusEffect(useCallback(() => setSuggestions(loadFormSuggestions(db)), []));

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Vehículo' }} />
        <CenteredMessage title="Este vehículo ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<VehicleFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof VehicleFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateVehicleForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      saveVehicle(db, result.value, vehicleId);
      router.back();
    } catch (error) {
      if (error instanceof DuplicateVehicleError) {
        setErrors({ plate: 'Ya hay un vehículo con esta matrícula' });
        return;
      }
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (vehicleId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar vehículo',
      message:
        'Las limpiezas periódicas ya generadas se conservan. ¿Seguro que quieres borrar este vehículo?',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteVehicle(db, vehicleId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Editar vehículo' : 'Nuevo vehículo' }} />

      <CleaningFields
        values={values}
        onChange={change}
        errors={errors}
        suggestions={suggestions}
        autofill={!isEdit}
      />

      <FrequencyField
        value={values.frequency}
        onChange={(frequency) => change({ frequency })}
        suggestions={suggestions.frequencies}
        error={errors.frequency}
      />

      <Checkbox
        label="Activo (se incluye al generar un año)"
        checked={values.active}
        onChange={(active) => change({ active })}
      />

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? <Button label="Borrar vehículo" variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
