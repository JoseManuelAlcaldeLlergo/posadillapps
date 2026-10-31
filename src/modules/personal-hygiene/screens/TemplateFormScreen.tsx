import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import {
  Button,
  CenteredMessage,
  Checkbox,
  confirmAsync,
  Screen,
  spacing,
  typography,
  useThemeColors,
} from '@/core/ui';

import { HygieneFields } from '../components/HygieneFields';
import { loadSuggestions, type Suggestions } from '../suggestions';
import { YEAR_PLACEHOLDER } from '../templates';
import { deleteTemplate, getTemplate, saveTemplate } from '../templatesRepository';
import {
  toFieldValues,
  validateTemplateForm,
  type FieldValues,
  type FormErrors,
  type TemplateFormValues,
} from '../validation';

type Props = {
  /** Template to edit; omitted to create a new one. */
  templateId?: number;
};

function loadForm(templateId: number | undefined): TemplateFormValues | null {
  if (templateId === undefined) {
    return {
      productiveUnit: '',
      action: '',
      place: '',
      result: '',
      correctiveMeasures: '',
      dateText: '',
      active: true,
    };
  }
  const template = getTemplate(db, templateId);
  if (!template) return null;
  return { ...toFieldValues(template), active: template.active };
}

export default function TemplateFormScreen({ templateId }: Props) {
  const colors = useThemeColors();
  const isEdit = templateId !== undefined;
  const [values, setValues] = useState<TemplateFormValues | null>(() => loadForm(templateId));
  const [errors, setErrors] = useState<FormErrors<TemplateFormValues>>({});
  const [suggestions, setSuggestions] = useState<Suggestions>({
    productiveUnits: [],
    actions: [],
    places: [],
  });

  useFocusEffect(
    useCallback(() => {
      setSuggestions(loadSuggestions(db));
    }, []),
  );

  if (!values) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Plantilla' }} />
        <CenteredMessage title="Esta plantilla ya no existe" />
      </Screen>
    );
  }

  const change = (changes: Partial<TemplateFormValues>) => {
    setValues({ ...values, ...changes });
    const cleared = Object.keys(changes).filter((key) => errors[key as keyof TemplateFormValues]);
    if (cleared.length > 0) {
      setErrors({ ...errors, ...Object.fromEntries(cleared.map((key) => [key, undefined])) });
    }
  };

  const onSave = () => {
    const result = validateTemplateForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    try {
      saveTemplate(db, result.value, templateId);
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  const onDelete = async () => {
    if (templateId === undefined) return;
    const confirmed = await confirmAsync({
      title: 'Borrar plantilla',
      message:
        '¿Seguro que quieres borrarla? Las filas ya creadas no cambian. ' +
        'Si solo ha dejado de hacerse, desmarca «Activa».',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteTemplate(db, templateId);
    router.back();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: isEdit ? 'Editar plantilla' : 'Nueva plantilla' }} />

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Escribe «{YEAR_PLACEHOLDER}» en Resultado y Fecha donde deba ir el año.
      </Text>

      <HygieneFields
        values={values}
        onChange={(changes: Partial<FieldValues>) => change(changes)}
        errors={errors}
        suggestions={suggestions}
        yearExample={YEAR_PLACEHOLDER}
      />

      <Checkbox
        label="Activa (se usa al generar un año)"
        checked={values.active}
        onChange={(active) => change({ active })}
      />

      <View style={styles.buttons}>
        <Button label={isEdit ? 'Guardar cambios' : 'Guardar'} onPress={onSave} />
        {isEdit ? <Button label="Borrar plantilla" variant="danger" onPress={onDelete} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: typography.caption,
  buttons: { gap: spacing.sm, marginTop: spacing.sm },
});
