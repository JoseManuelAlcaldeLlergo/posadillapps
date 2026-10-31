import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { todayIso } from '@/core/dates';
import { db } from '@/core/db';
import { FarmCodeRequired, getFarmCode } from '@/core/farm';
import { findByName } from '@/core/text';
import { Button, CenteredMessage, confirmAsync, DateField, Screen, spacing } from '@/core/ui';

import { CleaningFields } from '../components/CleaningFields';
import { FarmCodeInfo } from '../components/FarmCodeInfo';
import {
  defaultProductiveUnit,
  EMPTY_SUGGESTIONS,
  loadFormSuggestions,
  type FormSuggestions,
} from '../formSuggestions';
import {
  createApplication,
  deleteApplication,
  getApplication,
  updateApplication,
} from '../repository';
import {
  toFieldValues,
  validateApplicationForm,
  type ApplicationFormValues,
  type FieldValues,
  type FormErrors,
} from '../validation';

type Props = {
  /** Application to edit; omitted to create a new one. */
  applicationId?: number;
  /** Application to repeat: a new one with its values and today's date. */
  repeatId?: number;
};

type FormState = {
  values: ApplicationFormValues;
  /** Farm code snapshot: the saved one when editing, the current one when creating. */
  farmCode: string | null;
};

function loadForm(applicationId: number | undefined, repeatId: number | undefined): FormState | null {
  const sourceId = applicationId ?? repeatId;
  if (sourceId === undefined) {
    const fields: FieldValues = {
      productiveUnit: defaultProductiveUnit(db),
      productName: '',
      place: '',
      waitingDays: '',
      reviewDate: null,
    };
    return { values: { ...fields, date: todayIso() }, farmCode: getFarmCode(db) };
  }
  const application = getApplication(db, sourceId);
  if (!application) return null;
  if (applicationId !== undefined) {
    return {
      values: { ...toFieldValues(application), date: application.date },
      farmCode: application.farmCode,
    };
  }
  // A repeat is another application: today's date, no review yet, current farm code.
  return {
    values: { ...toFieldValues(application), reviewDate: null, date: todayIso() },
    farmCode: getFarmCode(db),
  };
}

export default function ApplicationFormScreen({ applicationId, repeatId }: Props) {
  const isEdit = applicationId !== undefined;
  const [form, setForm] = useState<FormState | null>(() => loadForm(applicationId, repeatId));
  const [errors, setErrors] = useState<FormErrors<ApplicationFormValues>>({});
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);
  // A new favorite is offered checked when creating, unchecked when editing.
  const [saveProduct, setSaveProduct] = useState(!isEdit);

  useFocusEffect(
    useCallback(() => {
      setSuggestions(loadFormSuggestions(db));
      // Pick up a farm code configured from this screen's notice.
      if (!isEdit) setForm((current) => current && { ...current, farmCode: getFarmCode(db) });
    }, [isEdit]),
  );

  if (!form) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Aplicación' }} />
        <CenteredMessage title="Esta aplicación ya no existe" />
      </Screen>
    );
  }

  if (!form.farmCode) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Nueva aplicación' }} />
        <FarmCodeRequired />
      </Screen>
    );
  }

  const { values, farmCode } = form;
  const offerProduct = values.productName.trim() !== '' && !findByName(suggestions.products, values.productName);

  const change = (changes: Partial<ApplicationFormValues>) => {
    setForm({ ...form, values: { ...values, ...changes } });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof ApplicationFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateApplicationForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    const options = { saveProduct: offerProduct && saveProduct };
    try {
      if (isEdit) updateApplication(db, applicationId, result.value, options);
      else createApplication(db, result.value, farmCode, options);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onRepeat = () => {
    if (applicationId === undefined) return;
    router.replace({
      pathname: '/cleaning-disinfection/applications/new',
      params: { repeat: String(applicationId) },
    });
  };

  const onDelete = async () => {
    if (applicationId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar aplicación',
      message: '¿Seguro que quieres borrar esta aplicación? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteApplication(db, applicationId);
    router.back();
  };

  const title = isEdit ? 'Editar aplicación' : repeatId !== undefined ? 'Repetir aplicación' : 'Nueva aplicación';

  return (
    <Screen scroll>
      <Stack.Screen options={{ title }} />

      <DateField
        label="Fecha"
        value={values.date}
        onChange={(date) => change({ date: date ?? '' })}
        error={errors.date}
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

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? (
          <>
            <Button label="Repetir con fecha de hoy" variant="outlined" onPress={onRepeat} />
            <Button label="Borrar aplicación" variant="danger" onPress={onDelete} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
