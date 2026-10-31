import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseYear } from '@/core/dates';
import { db } from '@/core/db';
import { FarmCodeRequired, getFarmCode } from '@/core/farm';
import {
  Button,
  CenteredMessage,
  Checkbox,
  Chip,
  ChipRow,
  Screen,
  spacing,
  TextField,
  useThemeColors,
} from '@/core/ui';

import { HygieneFields } from '../components/HygieneFields';
import { previewYear, saveGeneratedYear, type GeneratedRow, type YearPreview } from '../repository';
import { loadSuggestions, type Suggestions } from '../suggestions';
import { toFieldValues, validateFields, type FieldValues, type FormErrors } from '../validation';

/** A proposed row while it is reviewed. */
type DraftRow = {
  templateId: number;
  position: number;
  values: FieldValues;
  include: boolean;
  expanded: boolean;
  errors: FormErrors<FieldValues>;
};

function toDrafts(rows: GeneratedRow[]): DraftRow[] {
  return rows.map(({ templateId, position, ...fields }) => ({
    templateId,
    position,
    values: toFieldValues(fields),
    include: true,
    expanded: false,
    errors: {},
  }));
}

function rowCount(count: number): string {
  return count === 1 ? '1 fila' : `${count} filas`;
}

export default function GenerateYearScreen() {
  const colors = useThemeColors();
  const [yearText, setYearText] = useState(() => String(new Date().getFullYear()));
  const [farmCode, setFarmCode] = useState<string | null>(() => getFarmCode(db));
  const [preview, setPreview] = useState<YearPreview | null>(() =>
    previewYear(db, new Date().getFullYear()),
  );
  const [drafts, setDrafts] = useState<DraftRow[]>(() => toDrafts(preview?.rows ?? []));
  const [suggestions, setSuggestions] = useState<Suggestions>({
    productiveUnits: [],
    actions: [],
    places: [],
  });

  const year = parseYear(yearText);

  /** Proposes the rows again for `nextYear`, discarding edits. */
  const loadPreview = useCallback((nextYear: number | null) => {
    const next = nextYear === null ? null : previewYear(db, nextYear);
    setPreview(next);
    setDrafts(next ? toDrafts(next.rows) : []);
  }, []);

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

  const onChangeYear = (text: string) => {
    setYearText(text);
    loadPreview(parseYear(text));
  };

  const updateDraft = (index: number, changes: Partial<DraftRow>) => {
    setDrafts(drafts.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)));
  };

  const included = drafts.filter((draft) => draft.include);

  const onSave = () => {
    if (year === null) return;
    const rows: GeneratedRow[] = [];
    let invalid = false;
    const checked = drafts.map((draft) => {
      if (!draft.include) return draft;
      const result = validateFields(draft.values);
      if (!result.ok) {
        invalid = true;
        return { ...draft, errors: result.errors, expanded: true };
      }
      rows.push({ ...result.value, templateId: draft.templateId, position: draft.position });
      return { ...draft, errors: {} };
    });
    if (invalid) {
      setDrafts(checked);
      Alert.alert('Revisa las filas', 'Hay filas con datos obligatorios vacíos.');
      return;
    }
    try {
      const { inserted, skipped } = saveGeneratedYear(db, year, farmCode, rows);
      if (skipped > 0) {
        Alert.alert(
          'Filas guardadas',
          `Se han guardado ${rowCount(inserted)}. ` +
            `Se han omitido ${rowCount(skipped)} que ya existían en ${year}.`,
        );
      }
      router.back();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : String(error));
    }
  };

  let content;
  if (year === null) {
    content = (
      <Text style={{ color: colors.textMuted }}>
        {yearText.trim() ? 'Año no válido (ejemplo: 2025).' : 'Escribe el año que quieres generar.'}
      </Text>
    );
  } else if (preview && preview.rows.length === 0 && preview.skipped.length === 0) {
    content = (
      <View style={styles.empty}>
        <CenteredMessage
          title="No hay plantillas activas"
          message="Crea las plantillas de actuación para poder generar el año."
        />
        <Button
          label="Ir a plantillas"
          variant="secondary"
          onPress={() => router.push('/personal-hygiene/templates')}
        />
      </View>
    );
  } else {
    content = (
      <>
        {preview && preview.skipped.length > 0 ? (
          <View style={[styles.notice, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.text }}>
              Ya existen filas de {year} para: {preview.skipped.map((t) => t.action).join(', ')}. Se
              omiten.
            </Text>
          </View>
        ) : null}

        {drafts.map((draft, index) => (
          <View
            key={draft.templateId}
            style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Checkbox
              label={draft.values.action || '(sin actuación)'}
              checked={draft.include}
              onChange={(include) => updateDraft(index, { include })}
            />
            {draft.include ? (
              <>
                {draft.expanded ? (
                  <HygieneFields
                    values={draft.values}
                    onChange={(changes) =>
                      updateDraft(index, { values: { ...draft.values, ...changes }, errors: {} })
                    }
                    errors={draft.errors}
                    suggestions={suggestions}
                    yearExample={String(year)}
                  />
                ) : (
                  <Text style={[styles.summary, { color: colors.textMuted }]}>
                    {[
                      `${draft.values.productiveUnit} · ${draft.values.place}`,
                      `${draft.values.result} · ${draft.values.dateText}`,
                      draft.values.correctiveMeasures
                        ? `Medidas correctoras: ${draft.values.correctiveMeasures}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join('\n')}
                  </Text>
                )}
                <ChipRow>
                  <Chip
                    label={draft.expanded ? 'Cerrar' : 'Editar'}
                    selected={draft.expanded}
                    onPress={() => updateDraft(index, { expanded: !draft.expanded })}
                  />
                </ChipRow>
              </>
            ) : null}
          </View>
        ))}

        {drafts.length > 0 ? (
          <Button
            label={`Guardar ${rowCount(included.length)} de ${year}`}
            onPress={onSave}
            disabled={included.length === 0}
          />
        ) : null}
      </>
    );
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Generar año' }} />
      <TextField
        label="Año"
        value={yearText}
        onChangeText={onChangeYear}
        keyboardType="number-pad"
        maxLength={4}
      />
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Se crea una fila por cada plantilla activa, con «{'{año}'}» sustituido por el año. Código de
        explotación: {farmCode}.
      </Text>
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13 },
  notice: { borderWidth: 1, borderRadius: 8, padding: spacing.sm + 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summary: { fontSize: 14 },
  empty: { gap: spacing.md },
});
