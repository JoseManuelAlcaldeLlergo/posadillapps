import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { db } from '../db';
import { describeLastBackup, type LastBackupStatus } from '../settings/lastBackup';
import { getLastBackupAt } from '../settings/repository';
import { radius, spacing, typography, useThemeColors } from '../ui';

/** Home banner with the date of the last backup; highlighted when overdue. */
export function BackupReminder() {
  const colors = useThemeColors();
  const [status, setStatus] = useState<LastBackupStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStatus(describeLastBackup(getLastBackupAt(db)));
    }, []),
  );

  if (!status) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Abre la copia de seguridad"
      onPress={() => router.push('/backup')}
      style={({ pressed }) => [
        styles.banner,
        {
          borderColor: status.overdue ? colors.danger : colors.outlineVariant,
          backgroundColor: colors.surface,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text style={[styles.text, { color: status.overdue ? colors.danger : colors.textMuted }]}>
        {status.text}
        {status.overdue ? ' · Haz una ahora' : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { borderWidth: 1, borderRadius: radius.sm, padding: spacing.sm + 4 },
  text: typography.captionStrong,
});
