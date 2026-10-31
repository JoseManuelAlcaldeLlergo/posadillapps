import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { db } from '../db';
import { describeLastBackup, type LastBackupStatus } from '../settings/lastBackup';
import { getLastBackupAt } from '../settings/repository';
import { Notice, spacing, typography, useThemeColors } from '../ui';

/**
 * Home reminder with the date of the last backup: a quiet line while it is
 * recent, a warning when it is old and an alert when there has never been one.
 */
export function BackupReminder() {
  const colors = useThemeColors();
  const [status, setStatus] = useState<LastBackupStatus | null>(null);

  useFocusEffect(
    useCallback(() => {
      setStatus(describeLastBackup(getLastBackupAt(db)));
    }, []),
  );

  if (!status) return null;

  const openBackup = () => router.push('/backup');

  if (status.level !== 'ok') {
    return (
      <Notice
        tone={status.level === 'never' ? 'danger' : 'warning'}
        message={status.text}
        action={{ label: 'Haz una ahora', onPress: openBackup }}
      />
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Abre la copia de seguridad"
      onPress={openBackup}
      android_ripple={{ color: colors.ripple }}
      style={styles.row}
    >
      <MaterialCommunityIcons name="check-circle-outline" size={20} color={colors.primary} />
      <Text style={[typography.caption, { color: colors.textMuted }]}>{status.text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 },
});
