import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { db } from '@/core/db';
import { SelectField, spacing, SuggestionChips, TextField } from '@/core/ui';

import { plateKey } from '../plates';
import { lastRecordForPlate } from '../repository';
import { VEHICLE_TYPE_OPTIONS, type VehicleType } from '../vehicleTypes';

export type VehicleFieldValues = {
  plate: string;
  reason: string;
  vehicleType: VehicleType | null;
};

type Props = {
  values: VehicleFieldValues;
  onChange: (changes: Partial<VehicleFieldValues>) => void;
  errors: Partial<Record<keyof VehicleFieldValues, string>>;
  plates: readonly string[];
  reasons: readonly string[];
  /** Fill type and reason from the plate's last record when a known plate is typed. */
  autofill: boolean;
  /** Hides the plate input (automatic visits show it read-only elsewhere). */
  hidePlate?: boolean;
};

const asSuggestions = (texts: readonly string[]) => texts.map((text) => ({ id: text, name: text }));

/** Plate (with suggestions and autocomplete), reason and vehicle type. */
export function VehicleFields({
  values,
  onChange,
  errors,
  plates,
  reasons,
  autofill,
  hidePlate,
}: Props) {
  // Plate key last used to autofill, so typing on does not overwrite edits.
  const filledKey = useRef<string | null>(null);

  const changePlate = (plate: string) => {
    const key = plateKey(plate);
    const last = autofill && key && key !== filledKey.current ? lastRecordForPlate(db, plate) : undefined;
    if (last) {
      filledKey.current = key;
      onChange({ plate, reason: last.reason, vehicleType: last.vehicleType });
    } else {
      onChange({ plate });
    }
  };

  return (
    <>
      {hidePlate ? null : (
        <View style={styles.group}>
          <TextField
            label="Matrícula"
            value={values.plate}
            onChangeText={changePlate}
            example="6105 HHR"
            autoCapitalize="characters"
            autoCorrect={false}
            error={errors.plate}
          />
          <SuggestionChips
            items={asSuggestions(plates)}
            query={values.plate}
            label="Usadas antes"
            matchKey={plateKey}
            onSelect={(item) => changePlate(item.name)}
          />
        </View>
      )}

      <View style={styles.group}>
        <TextField
          label="Motivo de visita"
          value={values.reason}
          onChangeText={(reason) => onChange({ reason })}
          example="Control y cuidado de animales"
          autoCapitalize="sentences"
          error={errors.reason}
        />
        <SuggestionChips
          items={asSuggestions(reasons)}
          query={values.reason}
          label="Sugerencias"
          onSelect={(item) => onChange({ reason: item.name })}
        />
      </View>

      <SelectField
        label="Tipo de vehículo"
        options={VEHICLE_TYPE_OPTIONS}
        value={values.vehicleType}
        onChange={(vehicleType) => onChange({ vehicleType })}
        error={errors.vehicleType}
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
