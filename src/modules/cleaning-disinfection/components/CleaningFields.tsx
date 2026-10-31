import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { findByName, nameKey } from '@/core/text';
import { Checkbox, DateField, spacing, SuggestionChips, TextField } from '@/core/ui';

import type { FormSuggestions } from '../formSuggestions';
import type { FieldValues, FormErrors } from '../validation';

type Props = {
  values: FieldValues;
  onChange: (changes: Partial<FieldValues>) => void;
  errors: FormErrors<FieldValues>;
  suggestions: FormSuggestions;
  /** Offered when the product is not a favorite yet. */
  saveProduct: boolean;
  onSaveProductChange: (saveProduct: boolean) => void;
};

const asItems = (texts: readonly string[]) => texts.map((text) => ({ id: text, name: text }));

/** Productive unit, product (fills its defaults), place, waiting period and review date. */
export function CleaningFields({
  values,
  onChange,
  errors,
  suggestions,
  saveProduct,
  onSaveProductChange,
}: Props) {
  // Product last used to fill the defaults, so typing on does not overwrite edits.
  const filledKey = useRef(nameKey(values.productName));
  const favorite = findByName(suggestions.products, values.productName);
  const offerProduct = values.productName.trim() !== '' && !favorite;

  const changeProduct = (productName: string) => {
    const key = nameKey(productName);
    const product =
      key && key !== filledKey.current ? findByName(suggestions.products, productName) : undefined;
    if (product) {
      filledKey.current = key;
      onChange({
        productName,
        waitingDays: String(product.defaultWaitingDays),
        ...(product.defaultPlace ? { place: product.defaultPlace } : {}),
      });
    } else {
      onChange({ productName });
    }
  };

  return (
    <>
      <View style={styles.group}>
        <TextField
          label="Unidad productiva"
          value={values.productiveUnit}
          onChangeText={(productiveUnit) => onChange({ productiveUnit })}
          example="Ovino"
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
          label="Producto empleado"
          value={values.productName}
          onChangeText={changeProduct}
          example="Cal en polvo"
          autoCapitalize="sentences"
          error={errors.productName}
        />
        <SuggestionChips
          items={suggestions.products}
          query={values.productName}
          label="Favoritos"
          onSelect={(item) => changeProduct(item.name)}
        />
        {offerProduct ? (
          <Checkbox
            label={`Guardar «${values.productName.trim()}» como producto favorito con este periodo de espera y lugar`}
            checked={saveProduct}
            onChange={onSaveProductChange}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <TextField
          label="Lugar de aplicación"
          value={values.place}
          onChangeText={(place) => onChange({ place })}
          example="Naves, suelo y paredes"
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
        label="Periodo de espera (días)"
        value={values.waitingDays}
        onChangeText={(waitingDays) => onChange({ waitingDays })}
        example="0"
        keyboardType="number-pad"
        maxLength={4}
        error={errors.waitingDays}
      />

      <DateField
        label="Fecha de revisión (opcional)"
        value={values.reviewDate}
        onChange={(reviewDate) => onChange({ reviewDate })}
        placeholder="Sin revisar"
        error={errors.reviewDate}
        clearable
      />
    </>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
});
