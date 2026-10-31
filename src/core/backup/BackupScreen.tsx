import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { toIsoDate } from '../dates';
import { db } from '../db';
import { formatDate } from '../export/format';
import { describeLastBackup } from '../settings/lastBackup';
import { getLastBackupAt, setLastBackupAt } from '../settings/repository';
import { Button, confirmAsync, Notice, Screen, spacing, typography, useThemeColors } from '../ui';
import { createBackup, describeBackup, parseBackupFile, restoreBackup, serializeBackup } from './backup';
import {
  deleteSafetyCopy,
  hasSafetyCopy,
  pickBackupFile,
  readSafetyCopy,
  saveSafetyCopy,
  shareBackup,
} from './files';
import { BackupFormatError, type BackupContents, type BackupParticipant } from './types';

type Props = {
  modules: readonly BackupParticipant[];
};

type Busy = 'create' | 'restore' | 'undo' | null;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return `${formatDate(toIsoDate(date))} ${time}`;
}

function summaryLines(items: readonly { title: string; summary: string }[]): string {
  return items.map((item) => `${item.title}: ${item.summary}`).join('\n');
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function BackupScreen({ modules }: Props) {
  const colors = useThemeColors();
  const [summary, setSummary] = useState('');
  const [lastBackup, setLastBackup] = useState('');
  const [safetyCopy, setSafetyCopy] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);

  const refresh = useCallback(() => {
    setSummary(summaryLines(describeBackup(createBackup(db, modules), modules)));
    setLastBackup(describeLastBackup(getLastBackupAt(db)).text);
    setSafetyCopy(hasSafetyCopy());
  }, [modules]);
  useFocusEffect(refresh);

  const onCreate = async () => {
    setBusy('create');
    try {
      const file = createBackup(db, modules);
      await shareBackup(serializeBackup(file), file.createdAt);
      setLastBackupAt(db, file.createdAt);
      refresh();
    } catch (error) {
      Alert.alert('No se pudo crear la copia', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  /** Restores `contents`; when `keepSafetyCopy`, first saves the current data. */
  const restore = async (contents: BackupContents, keepSafetyCopy: boolean) => {
    if (keepSafetyCopy) {
      await saveSafetyCopy(serializeBackup(createBackup(db, modules)));
    }
    restoreBackup(db, contents, modules);
    if (keepSafetyCopy) setLastBackupAt(db, contents.createdAt);
    else deleteSafetyCopy();
    refresh();
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      const contents = parseBackupFile(text, modules);
      const confirmed = await confirmAsync({
        title: 'Restaurar copia',
        message:
          `Copia del ${formatDateTime(contents.createdAt)}:\n${summaryLines(contents.modules)}\n\n` +
          'Se reemplazarán todos los datos actuales de la app. Antes se guardará una copia ' +
          'de los datos actuales para poder deshacerlo.',
        confirmLabel: 'Restaurar',
        destructive: true,
      });
      if (!confirmed) return;
      await restore(contents, true);
      Alert.alert('Copia restaurada', summaryLines(contents.modules));
    } catch (error) {
      Alert.alert(
        'No se pudo restaurar',
        error instanceof BackupFormatError ? error.message : errorMessage(error),
      );
    } finally {
      setBusy(null);
    }
  };

  const onUndo = async () => {
    setBusy('undo');
    try {
      const text = await readSafetyCopy();
      if (text === null) return;
      const contents = parseBackupFile(text, modules);
      const confirmed = await confirmAsync({
        title: 'Deshacer la restauración',
        message:
          `Se volverá a los datos que había antes de la última restauración:\n` +
          `${summaryLines(contents.modules)}\n\nLos datos actuales se reemplazarán.`,
        confirmLabel: 'Deshacer',
        destructive: true,
      });
      if (!confirmed) return;
      await restore(contents, false);
      Alert.alert('Restauración deshecha', summaryLines(contents.modules));
    } catch (error) {
      Alert.alert('No se pudo deshacer', errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const muted = { color: colors.textMuted };
  const heading = [styles.heading, { color: colors.text }];

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: 'Copia de seguridad' }} />

      <View style={styles.section}>
        <Text style={heading}>Hacer copia</Text>
        <Text style={{ color: colors.text }}>{summary}</Text>
        <Text style={muted}>{lastBackup}</Text>
        <Button
          label="Crear y compartir copia"
          icon="share-variant-outline"
          onPress={onCreate}
          loading={busy === 'create'}
          disabled={busy !== null}
        />
        <Text style={muted}>
          Guárdala en Google Drive o envíatela por correo. La app anota la fecha al cerrar el menú de
          compartir, pero no puede saber si el archivo llegó a guardarse.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={heading}>Restaurar</Text>
        <Text style={muted}>
          Elige un archivo de copia. Antes de reemplazar nada verás de cuándo es y qué contiene.
        </Text>
        <Button
          label="Elegir archivo de copia"
          icon="file-upload-outline"
          variant="tonal"
          onPress={onRestore}
          loading={busy === 'restore'}
          disabled={busy !== null}
        />
        {safetyCopy ? (
          <Button
            label="Deshacer la última restauración"
            icon="undo-variant"
            variant="danger"
            onPress={onUndo}
            loading={busy === 'undo'}
            disabled={busy !== null}
          />
        ) : null}
      </View>

      <Notice message="Android también guarda una copia automática en tu cuenta de Google si está activada en Ajustes → Google → Copia de seguridad. Se recupera sola al reinstalar la app." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  heading: typography.heading,
});
