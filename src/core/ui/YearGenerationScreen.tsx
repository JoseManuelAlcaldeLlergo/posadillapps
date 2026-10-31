import { router, Stack, type Href } from 'expo-router';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { parseYear } from '../dates';
import type { YearPreview } from '../yearGeneration';
import { Button } from './Button';
import { CenteredMessage } from './CenteredMessage';
import { Checkbox } from './Checkbox';
import { Chip, ChipRow } from './Chip';
import { Screen } from './Screen';
import { TextField } from './TextField';
import { radius, spacing, typography, useThemeColors } from './theme';

type Errors<Values> = Partial<Record<keyof Values, string>>;

type Props<Source, Row, Values> = {
  /** Rows proposed for `year`, and the sources already done that year. */
  preview: (year: number) => YearPreview<Source, Row>;
  /** Unique key of a proposed row, e.g. its template id. */
  rowKey: (row: Row) => string | number;
  /** Name of a skipped source in the "already exist" notice. */
  sourceName: (source: Source) => string;
  toValues: (row: Row) => Values;
  /** Validates the edited texts of `row`, returning the row to save. */
  validate: (values: Values, row: Row) => { ok: true; value: Row } | { ok: false; errors: Errors<Values> };
  /** Saves the included rows; rows done meanwhile are skipped, never duplicated. */
  save: (year: number, rows: Row[]) => { inserted: number; skipped: number };
  /** Checkbox label of a row. */
  rowTitle: (values: Values) => string;
  /** Collapsed summary of a row. */
  rowSummary: (values: Values) => string;
  /** Editable fields of an expanded row. */
  renderFields: (props: {
    values: Values;
    onChange: (changes: Partial<Values>) => void;
    errors: Errors<Values>;
    year: number;
  }) => ReactNode;
  /** Explains what is generated, below the year. */
  hint: string;
  /** Shown when there are no active sources at all. */
  empty: { title: string; message: string; actionLabel: string; actionRoute: Href };
};

/** A proposed row while it is reviewed. */
type DraftRow<Row, Values> = {
  row: Row;
  values: Values;
  include: boolean;
  expanded: boolean;
  errors: Errors<Values>;
};

function rowCount(count: number): string {
  return count === 1 ? '1 fila' : `${count} filas`;
}

/**
 * "Generar año": the user picks a year, reviews one proposed row per active
 * source (include, edit) and saves them. Sources that already have a row in
 * the year are listed and omitted.
 */
export function YearGenerationScreen<Source, Row, Values>({
  preview: previewFor,
  rowKey,
  sourceName,
  toValues,
  validate,
  save,
  rowTitle,
  rowSummary,
  renderFields,
  hint,
  empty,
}: Props<Source, Row, Values>) {
  const colors = useThemeColors();
  const toDrafts = useCallback(
    (rows: Row[]): DraftRow<Row, Values>[] =>
      rows.map((row) => ({ row, values: toValues(row), include: true, expanded: false, errors: {} })),
    [toValues],
  );
  const [yearText, setYearText] = useState(() => String(new Date().getFullYear()));
  const [preview, setPreview] = useState<YearPreview<Source, Row> | null>(() =>
    previewFor(new Date().getFullYear()),
  );
  const [drafts, setDrafts] = useState<DraftRow<Row, Values>[]>(() => toDrafts(preview?.rows ?? []));

  const year = parseYear(yearText);

  /** Proposes the rows again for the typed year, discarding edits. */
  const onChangeYear = (text: string) => {
    setYearText(text);
    const nextYear = parseYear(text);
    const next = nextYear === null ? null : previewFor(nextYear);
    setPreview(next);
    setDrafts(next ? toDrafts(next.rows) : []);
  };

  const updateDraft = (index: number, changes: Partial<DraftRow<Row, Values>>) => {
    setDrafts(drafts.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)));
  };

  const included = drafts.filter((draft) => draft.include);

  const onSave = () => {
    if (year === null) return;
    const rows: Row[] = [];
    let invalid = false;
    const checked = drafts.map((draft) => {
      if (!draft.include) return draft;
      const result = validate(draft.values, draft.row);
      if (!result.ok) {
        invalid = true;
        return { ...draft, errors: result.errors, expanded: true };
      }
      rows.push(result.value);
      return { ...draft, errors: {} };
    });
    if (invalid) {
      setDrafts(checked);
      Alert.alert('Revisa las filas', 'Hay filas con datos obligatorios vacíos.');
      return;
    }
    try {
      const { inserted, skipped } = save(year, rows);
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
        <CenteredMessage title={empty.title} message={empty.message} />
        <Button
          label={empty.actionLabel}
          variant="secondary"
          onPress={() => router.push(empty.actionRoute)}
        />
      </View>
    );
  } else {
    content = (
      <>
        {preview && preview.skipped.length > 0 ? (
          <View style={[styles.notice, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.text }}>
              Ya existen filas de {year} para: {preview.skipped.map(sourceName).join(', ')}. Se
              omiten.
            </Text>
          </View>
        ) : null}

        {drafts.map((draft, index) => (
          <View
            key={rowKey(draft.row)}
            style={[styles.card, { borderColor: colors.outlineVariant, backgroundColor: colors.surface }]}
          >
            <Checkbox
              label={rowTitle(draft.values)}
              checked={draft.include}
              onChange={(include) => updateDraft(index, { include })}
            />
            {draft.include ? (
              <>
                {draft.expanded ? (
                  renderFields({
                    values: draft.values,
                    onChange: (changes) =>
                      updateDraft(index, { values: { ...draft.values, ...changes }, errors: {} }),
                    errors: draft.errors,
                    year,
                  })
                ) : (
                  <Text style={[styles.summary, { color: colors.textMuted }]}>
                    {rowSummary(draft.values)}
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
      <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: typography.caption,
  notice: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm + 4 },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  summary: typography.caption,
  empty: { gap: spacing.md },
});
