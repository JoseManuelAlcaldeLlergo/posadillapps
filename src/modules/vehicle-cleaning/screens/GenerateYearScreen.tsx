import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { FrequencyField, spacing, TextField, YearGenerationScreen } from '@/core/ui';

import { CleaningFields } from '../components/CleaningFields';
import { EMPTY_SUGGESTIONS, loadFormSuggestions, type FormSuggestions } from '../formSuggestions';
import { previewYear, saveGeneratedYear, type GeneratedRow } from '../repository';
import type { CleaningVehicle } from '../schema';
import { toFieldValues, validatePeriodicFields, type PeriodicFormValues } from '../validation';

const preview = (year: number) => previewYear(db, year);
const save = (year: number, rows: GeneratedRow[]) => saveGeneratedYear(db, year, rows);
const rowKey = (row: GeneratedRow) => row.vehicleId;
const vehiclePlate = (vehicle: CleaningVehicle) => vehicle.plate;
const toValues = (row: GeneratedRow): PeriodicFormValues => ({
  ...toFieldValues(row),
  frequency: row.frequency,
});
const rowTitle = (values: PeriodicFormValues) => values.plate || '(sin matrícula)';
const rowSummary = (values: PeriodicFormValues) =>
  `${values.vehicleType} · ${values.productName}\n${values.frequency} · Revisión: ${values.reviewText || '—'}`;

function validate(values: PeriodicFormValues, row: GeneratedRow) {
  const result = validatePeriodicFields(values);
  return result.ok ? { ok: true as const, value: { ...result.value, vehicleId: row.vehicleId } } : result;
}

export default function GenerateYearScreen() {
  const [suggestions, setSuggestions] = useState<FormSuggestions>(EMPTY_SUGGESTIONS);

  useFocusEffect(useCallback(() => setSuggestions(loadFormSuggestions(db)), []));

  return (
    <YearGenerationScreen
      preview={preview}
      rowKey={rowKey}
      sourceName={vehiclePlate}
      toValues={toValues}
      validate={validate}
      save={save}
      rowTitle={rowTitle}
      rowSummary={rowSummary}
      renderFields={({ values, onChange, errors }) => (
        <View style={styles.fields}>
          <CleaningFields
            values={values}
            onChange={onChange}
            errors={errors}
            suggestions={suggestions}
            autofill={false}
          />
          <FrequencyField
            value={values.frequency}
            onChange={(frequency) => onChange({ frequency })}
            suggestions={suggestions.frequencies}
            error={errors.frequency}
          />
          <TextField
            label="Fecha de revisión"
            optional
            value={values.reviewText}
            onChangeText={(reviewText) => onChange({ reviewText })}
            autoCapitalize="sentences"
            error={errors.reviewText}
          />
        </View>
      )}
      hint="Se crea una fila por cada vehículo activo, con la fecha de revisión «{frecuencia} {año}»."
      empty={{
        title: 'No hay vehículos activos',
        message: 'Añade los vehículos que se limpian periódicamente para poder generar el año.',
        actionLabel: 'Ir a vehículos',
        actionRoute: '/vehicle-cleaning/vehicles',
      }}
    />
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
});
