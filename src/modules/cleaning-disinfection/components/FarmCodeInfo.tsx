import { StyleSheet, Text, View } from 'react-native';

import { spacing, useThemeColors } from '@/core/ui';

type Props = {
  farmCode: string;
  /** Editing keeps the code the record was created with. */
  isEdit: boolean;
};

/** Farm code snapshot of the record, read-only. */
export function FarmCodeInfo({ farmCode, isEdit }: Props) {
  const colors = useThemeColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.label, { color: colors.text }]}>Código de explotación</Text>
      <Text style={[styles.value, { color: colors.text }]}>{farmCode}</Text>
      <Text style={[styles.hint, { color: colors.textMuted }]}>
        {isEdit
          ? 'Se conserva el código con el que se creó el registro.'
          : 'Se toma de Ajustes de la explotación.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  label: { fontSize: 14, fontWeight: '600' },
  value: { fontSize: 16 },
  hint: { fontSize: 13 },
});
