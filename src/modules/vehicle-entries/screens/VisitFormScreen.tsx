import { router, Stack, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { todayIso } from '@/core/dates';
import { db } from '@/core/db';
import { formatDate } from '@/core/export/format';
import { Button, CenteredMessage, confirmAsync, DateField, Notice, Screen } from '@/core/ui';

import { VehicleFields, type VehicleFieldValues } from '../components/VehicleFields';
import {
  deleteVisit,
  getVisit,
  isAutomatic,
  listUsedPlates,
  reasonSuggestions,
  saveVisit,
} from '../repository';
import type { VehicleVisit } from '../schema';
import { validateVisitForm, type FormErrors, type VisitFormValues } from '../validation';

export type VisitSourceLink = { label: string; href: Href };

type Props = {
  /** Visit to edit; omitted to create a new one. */
  visitId?: number;
  /**
   * Link to the records that created an automatic visit. Provided by the
   * route, so this module does not depend on the source module.
   */
  sourceLink?: (visit: VehicleVisit) => VisitSourceLink | undefined;
};

function emptyForm(): VisitFormValues {
  return { plate: '', date: todayIso(), reason: '', vehicleType: null };
}

export default function VisitFormScreen({ visitId, sourceLink }: Props) {
  const isEdit = visitId !== undefined;

  const [visit] = useState<VehicleVisit | undefined>(() =>
    visitId === undefined ? undefined : getVisit(db, visitId),
  );
  const [values, setValues] = useState<VisitFormValues | null>(() => {
    if (visitId === undefined) return emptyForm();
    if (!visit) return null;
    return { plate: visit.plate, date: visit.date, reason: visit.reason, vehicleType: visit.vehicleType };
  });
  const [errors, setErrors] = useState<FormErrors<VisitFormValues>>({});
  const [plates, setPlates] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const refreshSuggestions = useCallback(() => {
    setPlates(listUsedPlates(db));
    setReasons(reasonSuggestions(db));
  }, []);
  useFocusEffect(refreshSuggestions);

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Visita' }} />
        <CenteredMessage title="Esta visita ya no existe" />
      </Screen>
    );
  }

  const automatic = visit !== undefined && isAutomatic(visit);
  const link = automatic && sourceLink ? sourceLink(visit) : undefined;

  const change = (changes: Partial<VisitFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof VisitFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  /** Saves the form; returns a summary of the saved visit, or null if invalid/failed. */
  const submit = (): string | null => {
    const result = validateVisitForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return null;
    }
    try {
      const saved = saveVisit(db, result.value, visitId);
      return `${saved.plate} · ${formatDate(saved.date)}`;
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
    // Keep date, reason and type; clear the plate.
    setValues({ ...values, plate: '' });
    setErrors({});
    refreshSuggestions();
    setLastSaved(summary);
  };

  const onDelete = async () => {
    if (visitId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar visita',
      message: '¿Seguro que quieres borrar esta visita? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteVisit(db, visitId);
    router.back();
  };

  return (
    <Screen
      scroll
      footer={
        <>
          <Button
            label={isEdit ? 'Guardar cambios' : 'Guardar'}
            icon="content-save-outline"
            onPress={onSave}
          />
          {isEdit ? null : (
            <Button label="Guardar y añadir otro" variant="tonal" onPress={onSaveAndAddAnother} />
          )}
        </>
      }
    >
      <Stack.Screen options={{ title: isEdit ? 'Editar visita' : 'Nueva visita' }} />

      {lastSaved ? <Notice tone="success" message={`Guardada: ${lastSaved}`} /> : null}

      {automatic ? (
        <Notice
          title={`${values.plate} · ${formatDate(values.date)}`}
          message="Visita creada automáticamente. La fecha y la matrícula se cambian desde el registro que la creó, y se borra al borrarlo."
          action={link ? { label: link.label, onPress: () => router.push(link.href) } : undefined}
        />
      ) : (
        <DateField
          label="Fecha"
          value={values.date}
          onChange={(date) => change({ date: date ?? '' })}
          error={errors.date}
        />
      )}

      <VehicleFields
        values={values}
        onChange={(changes: Partial<VehicleFieldValues>) => change(changes)}
        errors={errors}
        plates={plates}
        reasons={reasons}
        autofill={!isEdit}
        hidePlate={automatic}
      />

      {isEdit && !automatic ? (
        <Button label="Borrar visita" variant="dangerText" icon="delete-outline" onPress={onDelete} />
      ) : null}
    </Screen>
  );
}
