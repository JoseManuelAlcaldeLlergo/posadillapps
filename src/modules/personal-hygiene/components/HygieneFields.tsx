import { StyleSheet, View } from 'react-native';

import { spacing, SuggestionChips, TextField } from '@/core/ui';

import type { Suggestions } from '../suggestions';
import type { FieldValues, FormErrors } from '../validation';

type Props = {
  values: FieldValues;
  onChange: (changes: Partial<FieldValues>) => void;
  errors: FormErrors<FieldValues>;
  suggestions: Suggestions;
  /** Shown in the result and date examples: a year, or `{año}` in templates. */
  yearExample: string;
};

function asItems(names: string[]) {
  return names.map((name) => ({ id: name, name }));
}

/** Texts of a row or template, in the paper form order. */
export function HygieneFields({ values, onChange, errors, suggestions, yearExample }: Props) {
  return (
    <>
      <View style={styles.group}>
        <TextField
          label="Unidad productiva"
          value={values.productiveUnit}
          onChangeText={(productiveUnit) => onChange({ productiveUnit })}
          placeholder="Ovino y porcino"
          autoCapitalize="sentences"
          error={errors.productiveUnit}
        />
        <SuggestionChips
          items={asItems(suggestions.productiveUnits)}
          query={values.productiveUnit}
          label="De Ajustes de la explotación"
          onSelect={(item) => onChange({ productiveUnit: item.name })}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label="Actuación"
          value={values.action}
          onChangeText={(action) => onChange({ action })}
          placeholder="Limpieza de manos, botas"
          autoCapitalize="sentences"
          error={errors.action}
        />
        <SuggestionChips
          items={asItems(suggestions.actions)}
          query={values.action}
          label="Sugerencias"
          onSelect={(item) => onChange({ action: item.name })}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label="Lugar"
          value={values.place}
          onChangeText={(place) => onChange({ place })}
          placeholder="Nave"
          autoCapitalize="sentences"
          error={errors.place}
        />
        <SuggestionChips
          items={asItems(suggestions.places)}
          query={values.place}
          label="Sugerencias"
          onSelect={(item) => onChange({ place: item.name })}
        />
      </View>

      <TextField
        label="Resultado"
        value={values.result}
        onChangeText={(result) => onChange({ result })}
        placeholder={`Mensualmente año ${yearExample}`}
        autoCapitalize="sentences"
        error={errors.result}
      />

      <TextField
        label="Medidas correctoras"
        optional
        value={values.correctiveMeasures}
        onChangeText={(correctiveMeasures) => onChange({ correctiveMeasures })}
        autoCapitalize="sentences"
      />

      <TextField
        label="Fecha"
        value={values.dateText}
        onChangeText={(dateText) => onChange({ dateText })}
        placeholder={`1 de cada mes ${yearExample}`}
        autoCapitalize="sentences"
        error={errors.dateText}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
