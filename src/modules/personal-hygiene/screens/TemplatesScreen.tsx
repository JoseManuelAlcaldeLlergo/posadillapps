import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { db } from '@/core/db';
import {
  Button,
  CenteredMessage,
  Chip,
  ChipRow,
  ListItem,
  Screen,
  spacing,
  useThemeColors,
} from '@/core/ui';

import type { HygieneTemplate } from '../schema';
import { YEAR_PLACEHOLDER } from '../templates';
import { listTemplates, moveTemplate } from '../templatesRepository';

export default function TemplatesScreen() {
  const colors = useThemeColors();
  const [templates, setTemplates] = useState<HygieneTemplate[]>([]);

  const reload = useCallback(() => setTemplates(listTemplates(db)), []);
  useFocusEffect(reload);

  const onMove = (template: HygieneTemplate, direction: -1 | 1) => {
    moveTemplate(db, template.id, direction);
    reload();
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Plantillas de actuación' }} />
      <FlatList
        data={templates}
        keyExtractor={(template) => String(template.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Button
              label="Nueva plantilla"
              onPress={() => router.push('/personal-hygiene/templates/new')}
            />
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Al generar un año se crea una fila por cada plantilla activa, en este orden, con «
              {YEAR_PLACEHOLDER}» sustituido por el año. Editar una plantilla no cambia las filas ya
              creadas.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.item}>
            <ListItem
              title={item.action}
              badge={item.active ? undefined : 'Inactiva'}
              subtitle={[
                `${item.productiveUnit} · ${item.place}`,
                `${item.result} · ${item.dateText}`,
                item.correctiveMeasures ? `Medidas correctoras: ${item.correctiveMeasures}` : null,
              ]
                .filter(Boolean)
                .join('\n')}
              onPress={() =>
                router.push({
                  pathname: '/personal-hygiene/templates/[id]',
                  params: { id: String(item.id) },
                })
              }
            />
            {templates.length > 1 ? (
              <ChipRow>
                {index > 0 ? <Chip label="Subir" onPress={() => onMove(item, -1)} /> : null}
                {index < templates.length - 1 ? (
                  <Chip label="Bajar" onPress={() => onMove(item, 1)} />
                ) : null}
              </ChipRow>
            ) : null}
          </View>
        )}
        ListEmptyComponent={
          <CenteredMessage
            title="Todavía no hay plantillas"
            message="Crea una por cada actuación que se repite cada año."
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  header: { gap: spacing.sm },
  hint: { fontSize: 13 },
  item: { gap: spacing.xs },
});
