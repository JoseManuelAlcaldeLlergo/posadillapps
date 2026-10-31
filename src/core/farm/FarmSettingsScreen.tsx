import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { db } from '../db';
import {
  Button,
  Chip,
  ChipRow,
  confirmAsync,
  radius,
  Screen,
  spacing,
  TextField,
  typography,
  useThemeColors,
} from '../ui';
import {
  addProductiveUnit,
  deleteProductiveUnit,
  DuplicateNameError,
  getFarmCode,
  listProductiveUnits,
  moveProductiveUnit,
  setFarmCode,
} from './repository';
import type { ProductiveUnit } from './schema';

/** Farm code and productive units, shared by every module. */
export default function FarmSettingsScreen() {
  const colors = useThemeColors();
  const [savedCode, setSavedCode] = useState<string | null>(() => getFarmCode(db));
  const [code, setCode] = useState(() => savedCode ?? '');
  const [codeError, setCodeError] = useState<string | undefined>();
  const [units, setUnits] = useState<ProductiveUnit[]>([]);
  const [unitName, setUnitName] = useState('');
  const [unitError, setUnitError] = useState<string | undefined>();

  const reloadUnits = useCallback(() => setUnits(listProductiveUnits(db)), []);
  useFocusEffect(reloadUnits);

  const codeChanged = code.trim() !== (savedCode ?? '');

  const onSaveCode = () => {
    if (!code.trim()) {
      setCodeError('Escribe el código de explotación');
      return;
    }
    const saved = setFarmCode(db, code);
    setSavedCode(saved);
    setCode(saved ?? '');
  };

  const onAddUnit = () => {
    if (!unitName.trim()) {
      setUnitError('Escribe el nombre de la unidad productiva');
      return;
    }
    try {
      addProductiveUnit(db, unitName);
      setUnitName('');
      setUnitError(undefined);
      reloadUnits();
    } catch (e) {
      if (e instanceof DuplicateNameError) setUnitError('Esa unidad productiva ya está en la lista');
      else throw e;
    }
  };

  const onDeleteUnit = async (unit: ProductiveUnit) => {
    const confirmed = await confirmAsync({
      title: 'Borrar unidad productiva',
      message: `¿Borrar «${unit.name}» de la lista? Los registros ya guardados no cambian.`,
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (!confirmed) return;
    deleteProductiveUnit(db, unit.id);
    reloadUnits();
  };

  const onMoveUnit = (unit: ProductiveUnit, direction: -1 | 1) => {
    moveProductiveUnit(db, unit.id, direction);
    reloadUnits();
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Ajustes de la explotación' }} />

      <View style={styles.section}>
        <TextField
          label="Código de explotación"
          value={code}
          onChangeText={(text) => {
            setCode(text);
            setCodeError(undefined);
          }}
          placeholder="ES000000000000"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={onSaveCode}
          error={codeError}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {savedCode
            ? 'Los registros nuevos lo usan; los ya guardados conservan el código con el que se crearon.'
            : 'Sin código de explotación no se pueden crear registros que lo necesiten.'}
        </Text>
        <Button label="Guardar código" onPress={onSaveCode} disabled={!codeChanged} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.title, { color: colors.text }]}>Unidades productivas</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Se ofrecen como sugerencias al rellenar los registros.
        </Text>
        {units.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>Todavía no hay unidades productivas.</Text>
        ) : (
          units.map((unit, index) => (
            <View
              key={unit.id}
              style={[styles.unit, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}
            >
              <Text style={[styles.unitName, { color: colors.text }]}>{unit.name}</Text>
              <ChipRow>
                {index > 0 ? <Chip label="Subir" onPress={() => onMoveUnit(unit, -1)} /> : null}
                {index < units.length - 1 ? (
                  <Chip label="Bajar" onPress={() => onMoveUnit(unit, 1)} />
                ) : null}
                <Chip label="Borrar" onPress={() => onDeleteUnit(unit)} />
              </ChipRow>
            </View>
          ))
        )}
        <TextField
          label="Nueva unidad productiva"
          value={unitName}
          onChangeText={(text) => {
            setUnitName(text);
            setUnitError(undefined);
          }}
          placeholder="Ovino y porcino"
          autoCapitalize="sentences"
          returnKeyType="done"
          onSubmitEditing={onAddUnit}
          error={unitError}
        />
        <Button label="Añadir unidad productiva" variant="outlined" onPress={onAddUnit} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  title: typography.heading,
  hint: typography.caption,
  unit: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  unitName: typography.bodyStrong,
});
