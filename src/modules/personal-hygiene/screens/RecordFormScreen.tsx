import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseYear } from '@/core/dates';
import { db } from '@/core/db';
import { FarmCodeRequired, getFarmCode } from '@/core/farm';
import { nameKey } from '@/core/text';
import {
  Button,
  CenteredMessage,
  Checkbox,
  Chip,
  ChipRow,
  confirmAsync,
  Screen,
  spacing,
  TextField,
  typography,
  useThemeColors,
} from '@/core/ui';

import { HygieneFields } from '../components/HygieneFields';
import { createRecord, deleteRecord, getRecord, updateRecord } from '../repository';
import type { HygieneTemplate } from '../schema';
import { loadSuggestions, type Suggestions } from '../suggestions';
import { fillYear } from '../templates';
import { listTemplates } from '../templatesRepository';
import {
  toFieldValues,
  validateRecordForm,
  type FieldValues,
  type FormErrors,
  type RecordFormValues,
} from '../validation';

type Props = {
  /** Row to edit; omitted to create a new one. */
  recordId?: number;
};

type FormState = {
  values: RecordFormValues;
  /** Farm code snapshot: the saved one when editing, the current one when creating. */
  farmCode: string | null;
  /** Template the new row was filled from. */
  templateId: number | null;
};

const EMPTY_FIELDS: FieldValues = {
  productiveUnit: '',
  action: '',
  place: '',
  result: '',
  correctiveMeasures: '',
  dateText: '',
};

function loadForm(recordId: number | undefined): FormState | null {
  if (recordId === undefined) {
    return {
      values: { ...EMPTY_FIELDS, year: String(new Date().getFullYear()) },
      farmCode: getFarmCode(db),
      templateId: null,
    };
  }
  const record = getRecord(db, recordId);
  if (!record) return null;
  return {
    values: { ...toFieldValues(record), year: String(record.year) },
    farmCode: record.farmCode,
    templateId: record.templateId,
  };
}

/** Template texts for a year; with an invalid year the `{año}` marker is kept. */
function templateFields(template: HygieneTemplate, year: number | null): FieldValues {
  const fill = (text: string) => (year === null ? text : fillYear(text, year));
  return toFieldValues({
    productiveUnit: template.productiveUnit,
    action: template.action,
    place: template.place,
    result: fill(template.result),
    correctiveMeasures: template.correctiveMeasures,
    dateText: fill(template.dateText),
  });
}

export default function RecordFormScreen({ recordId }: Props) {
  const colors = useThemeColors();
  const isEdit = recordId !== undefined;
  const [form, setForm] = useState<FormState | null>(() => loadForm(recordId));
  const [errors, setErrors] = useState<FormErrors<RecordFormValues>>({});
  const [templates, setTemplates] = useState<HygieneTemplate[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestions>({
    productiveUnits: [],
    actions: [],
    places: [],
  });
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setTemplates(listTemplates(db));
      setSuggestions(loadSuggestions(db));
      // Pick up a farm code configured from this screen's notice.
      if (!isEdit) setForm((current) => current && { ...current, farmCode: getFarmCode(db) });
    }, [isEdit]),
  );

  if (!form) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Fila' }} />
        <CenteredMessage title="Esta fila ya no existe" />
      </Screen>
    );
  }

  if (!form.farmCode) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Nueva fila' }} />
        <FarmCodeRequired />
      </Screen>
    );
  }

  const { values, farmCode, templateId } = form;
  const template = templates.find((t) => t.id === templateId);
  const year = parseYear(values.year);
  const actionKey = nameKey(values.action);
  const offerTemplate =
    !isEdit &&
    templateId === null &&
    actionKey !== '' &&
    !templates.some((t) => nameKey(t.action) === actionKey);

  const change = (changes: Partial<RecordFormValues>) => {
    setForm({ ...form, values: { ...values, ...changes } });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof RecordFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  /** Keeps result and date in step with the year while they are still the template's text. */
  const changeYear = (text: string) => {
    const next = parseYear(text);
    if (template && next !== null) {
      const before = templateFields(template, year);
      const after = templateFields(template, next);
      change({
        year: text,
        result: values.result === before.result ? after.result : values.result,
        dateText: values.dateText === before.dateText ? after.dateText : values.dateText,
      });
    } else {
      change({ year: text });
    }
  };

  const pickTemplate = (picked: HygieneTemplate | null) => {
    setForm({
      ...form,
      templateId: picked?.id ?? null,
      values: { year: values.year, ...(picked ? templateFields(picked, year) : EMPTY_FIELDS) },
    });
    setErrors({});
  };

  const onSave = () => {
    const result = validateRecordForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      if (isEdit) {
        updateRecord(db, recordId, result.value);
      } else {
        createRecord(db, { ...result.value, templateId }, farmCode, {
          saveAsTemplate: offerTemplate && saveAsTemplate,
        });
      }
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (recordId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar fila',
      message: '¿Seguro que quieres borrar esta fila? No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteRecord(db, recordId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Editar fila' : 'Nueva fila' }} />

      {!isEdit && templates.length > 0 ? (
        <View style={styles.group}>
          <Text style={[styles.label, { color: colors.text }]}>Rellenar desde</Text>
          <ChipRow>
            <Chip label="Desde cero" selected={templateId === null} onPress={() => pickTemplate(null)} />
            {templates.map((t) => (
              <Chip
                key={t.id}
                label={t.action}
                selected={templateId === t.id}
                onPress={() => pickTemplate(t)}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      <TextField
        label="Año"
        value={values.year}
        onChangeText={changeYear}
        keyboardType="number-pad"
        maxLength={4}
        error={errors.year}
      />

      <View style={styles.group}>
        <Text style={[styles.label, { color: colors.text }]}>Código de explotación</Text>
        <Text style={[styles.value, { color: colors.text }]}>{farmCode}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {isEdit
            ? 'Se conserva el código con el que se creó la fila.'
            : 'Se toma de Ajustes de la explotación.'}
        </Text>
      </View>

      <HygieneFields
        values={values}
        onChange={change}
        errors={errors}
        suggestions={suggestions}
        yearExample={year === null ? String(new Date().getFullYear()) : String(year)}
      />

      {offerTemplate ? (
        <Checkbox
          label={`Guardar «${values.action.trim()}» como plantilla de actuación`}
          checked={saveAsTemplate}
          onChange={setSaveAsTemplate}
        />
      ) : null}

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? <Button label="Borrar fila" variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: typography.captionStrong,
  value: typography.body,
  hint: typography.caption,
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
