import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { spacing, SuggestionChips, TextField } from '@/core/ui';

import { plateKey } from '../../vehicle-entries';
import type { FormSuggestions } from '../formSuggestions';
import { lastRecordForPlate } from '../repository';
import type { FieldValues, FormErrors } from '../validation';

type PlateFields = Pick<FieldValues, 'plate' | 'productName' | 'vehicleType'>;

type Props = {
  values: PlateFields;
  onChange: (changes: Partial<PlateFields>) => void;
  errors: FormErrors<PlateFields>;
  suggestions: FormSuggestions;
  /** Fill product and type from the plate's last record when a known plate is typed. */
  autofill: boolean;
};

const asItems = (texts: readonly string[]) => texts.map((text) => ({ id: text, name: text }));

/** Plate (with suggestions and autofill), product and vehicle type. */
export function CleaningFields({
  values,
  onChange,
  errors,
  suggestions,
  autofill,
}: Props) {
  // Plate key last used to autofill, so typing on does not overwrite edits.
  const filledKey = useRef<string | null>(null);

  const changePlate = (plate: string) => {
    const key = plateKey(plate);
    const last = autofill && key && key !== filledKey.current ? lastRecordForPlate(db, plate) : undefined;
    if (last) {
      filledKey.current = key;
      onChange({ plate, productName: last.productName, vehicleType: last.vehicleType });
    } else {
      onChange({ plate });
    }
  };

  return (
    <>
      <View style={styles.group}>
        <TextField
          label="Matrícula o número de bastidor"
          value={values.plate}
          onChangeText={changePlate}
          placeholder="6105 HHR"
          autoCapitalize="characters"
          autoCorrect={false}
          error={errors.plate}
        />
        <SuggestionChips
          items={asItems(suggestions.plates)}
          query={values.plate}
          label="Matrículas conocidas"
          matchKey={plateKey}
          onSelect={(item) => changePlate(item.name)}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label="Producto empleado"
          value={values.productName}
          onChangeText={(productName) => onChange({ productName })}
          placeholder="Cipergen"
          autoCapitalize="sentences"
          error={errors.productName}
        />
        <SuggestionChips
          items={asItems(suggestions.products)}
          query={values.productName}
          label="Productos favoritos y usados"
          onSelect={(item) => onChange({ productName: item.name })}
        />
      </View>

      <View style={styles.group}>
        <TextField
          label="Tipo de vehículo"
          value={values.vehicleType}
          onChangeText={(vehicleType) => onChange({ vehicleType })}
          placeholder="Turismo"
          autoCapitalize="sentences"
          error={errors.vehicleType}
        />
        <SuggestionChips
          items={asItems(suggestions.vehicleTypes)}
          query={values.vehicleType}
          label="Sugerencias"
          onSelect={(item) => onChange({ vehicleType: item.name })}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
