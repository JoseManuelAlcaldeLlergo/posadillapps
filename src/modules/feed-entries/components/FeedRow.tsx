import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, radius, spacing, TextField, typography, useThemeColors } from '@/core/ui';

type Props = {
  name: string;
  /** Returns an error message to show, or undefined if the rename worked. */
  onRename: (name: string) => string | undefined;
  onDelete: () => void;
};

/** A usual feed with inline rename and delete. */
export function FeedRow({ name, onRename, onDelete }: Props) {
  const colors = useThemeColors();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | undefined>();

  if (editing) {
    const save = () => {
      const message = onRename(draft);
      if (message) setError(message);
      else setEditing(false);
    };
    return (
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <TextField
          label="Nombre del pienso"
          value={draft}
          onChangeText={(text) => {
            setDraft(text);
            setError(undefined);
          }}
          autoFocus
          onSubmitEditing={save}
          error={error}
        />
        <View style={styles.buttons}>
          <View style={styles.button}>
            <Button
              label="Cancelar"
              variant="secondary"
              onPress={() => {
                setDraft(name);
                setError(undefined);
                setEditing(false);
              }}
            />
          </View>
          <View style={styles.button}>
            <Button label="Guardar" onPress={save} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
      <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
      <View style={styles.buttons}>
        <View style={styles.button}>
          <Button
            label="Renombrar"
            variant="secondary"
            onPress={() => {
              setDraft(name);
              setEditing(true);
            }}
          />
        </View>
        <View style={styles.button}>
          <Button label="Borrar" variant="danger" onPress={onDelete} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  name: typography.bodyStrong,
  buttons: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1 },
});
