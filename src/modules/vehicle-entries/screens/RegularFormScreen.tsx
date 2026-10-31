import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { db } from '@/core/db';
import { Button, CenteredMessage, Checkbox, confirmAsync, FrequencyField, Screen } from '@/core/ui';

import { VehicleFields, type VehicleFieldValues } from '../components/VehicleFields';
import {
  deleteRegular,
  frequencySuggestions,
  getRegular,
  listUsedPlates,
  reasonSuggestions,
  saveRegular,
} from '../repository';
import { validateRegularForm, type FormErrors, type RegularFormValues } from '../validation';

type Props = {
  /** Regular vehicle to edit; omitted to create a new one. */
  regularId?: number;
};

function loadForm(regularId: number | undefined): RegularFormValues | null {
  if (regularId === undefined) {
    return { plate: '', frequency: '', reason: '', vehicleType: null, active: true };
  }
  const regular = getRegular(db, regularId);
  if (!regular) return null;
  return {
    plate: regular.plate,
    frequency: regular.frequency,
    reason: regular.reason,
    vehicleType: regular.vehicleType,
    active: regular.active,
  };
}

export default function RegularFormScreen({ regularId }: Props) {
  const isEdit = regularId !== undefined;
  const [values, setValues] = useState<RegularFormValues | null>(() => loadForm(regularId));
  const [errors, setErrors] = useState<FormErrors<RegularFormValues>>({});
  const [plates, setPlates] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [frequencies, setFrequencies] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      setPlates(listUsedPlates(db));
      setReasons(reasonSuggestions(db));
      setFrequencies(frequencySuggestions(db));
    }, []),
  );

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Vehículo habitual' }} />
        <CenteredMessage title="Este vehículo ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<RegularFormValues>) => {
    setValues({ ...values, ...changes });
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
    try {
      saveRegular(db, result.value, regularId);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (regularId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar vehículo habitual',
      message:
        '¿Seguro que quieres borrarlo? Dejará de salir en todas las exportaciones. ' +
        'Si solo ha dejado de venir, desmarca «Activo».',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteRegular(db, regularId);
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} icon="content-save-outline" onPress={onSave} />
      }
    >
      <Stack.Screen options={{ title: isEdit ? 'Editar vehículo habitual' : 'Nuevo vehículo habitual' }} />

      <VehicleFields
        values={values}
        onChange={(changes: Partial<VehicleFieldValues>) => change(changes)}
        errors={errors}
        plates={plates}
        reasons={reasons}
        autofill={!isEdit}
      />

      <FrequencyField
        value={values.frequency}
        onChange={(frequency) => change({ frequency })}
        suggestions={frequencies}
        error={errors.frequency}
      />

      <Checkbox
        label="Activo (sale en las exportaciones)"
        checked={values.active}
        onChange={(active) => change({ active })}
      />

      {isEdit ? (
        <Button label="Borrar vehículo" variant="dangerText" icon="delete-outline" onPress={onDelete} />
      ) : null}
    </Screen>
  );
}
