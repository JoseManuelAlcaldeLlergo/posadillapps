import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { db } from '@/core/db';
import { FarmCodeRequired, getFarmCode } from '@/core/farm';
import { Screen, YearGenerationScreen } from '@/core/ui';

import { HygieneFields } from '../components/HygieneFields';
import { previewYear, saveGeneratedYear, type GeneratedRow } from '../repository';
import type { HygieneTemplate } from '../schema';
import { loadSuggestions, type Suggestions } from '../suggestions';
import { toFieldValues, validateFields, type FieldValues } from '../validation';

const preview = (year: number) => previewYear(db, year);
const rowKey = (row: GeneratedRow) => row.templateId;
const templateName = (template: HygieneTemplate) => template.action;
const toValues = ({ templateId: _templateId, position: _position, ...fields }: GeneratedRow) =>
  toFieldValues(fields);
const rowTitle = (values: FieldValues) => values.action || '(sin actuación)';

function validate(values: FieldValues, row: GeneratedRow) {
  const result = validateFields(values);
  return result.ok
    ? { ok: true as const, value: { ...result.value, templateId: row.templateId, position: row.position } }
    : result;
}

function rowSummary(values: FieldValues): string {
  return [
    `${values.productiveUnit} · ${values.place}`,
    `${values.result} · ${values.dateText}`,
    values.correctiveMeasures ? `Medidas correctoras: ${values.correctiveMeasures}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

export default function GenerateYearScreen() {
  const [farmCode, setFarmCode] = useState<string | null>(() => getFarmCode(db));
  const [suggestions, setSuggestions] = useState<Suggestions>({
    productiveUnits: [],
    actions: [],
    places: [],
  });

  useFocusEffect(
    useCallback(() => {
      setFarmCode(getFarmCode(db));
      setSuggestions(loadSuggestions(db));
    }, []),
  );

  if (!farmCode) {
    return (
      <Screen>
        <Stack.Screen options={{ title: 'Generar año' }} />
        <FarmCodeRequired />
      </Screen>
    );
  }

  return (
    <YearGenerationScreen
      preview={preview}
      rowKey={rowKey}
      sourceName={templateName}
      toValues={toValues}
      validate={validate}
      save={(year, rows) => saveGeneratedYear(db, year, farmCode, rows)}
      rowTitle={rowTitle}
      rowSummary={rowSummary}
      renderFields={({ values, onChange, errors, year }) => (
        <HygieneFields
          values={values}
          onChange={onChange}
          errors={errors}
          suggestions={suggestions}
          yearExample={String(year)}
        />
      )}
      hint={
        `Se crea una fila por cada plantilla activa, con «{año}» sustituido por el año. ` +
        `Código de explotación: ${farmCode}.`
      }
      empty={{
        title: 'No hay plantillas activas',
        message: 'Crea las plantillas de actuación para poder generar el año.',
        actionLabel: 'Ir a plantillas',
        actionRoute: '/personal-hygiene/templates',
      }}
    />
  );
}
