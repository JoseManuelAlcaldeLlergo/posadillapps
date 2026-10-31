import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text } from 'react-native';

import { db } from '@/core/db';
import {
  ActionChip,
  EmptyState,
  Fab,
  FAB_CLEARANCE,
  ListItem,
  Screen,
  spacing,
  typography,
  useThemeColors,
} from '@/core/ui';

import { personalHygieneModule } from '../module';
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
  const newTemplate = () => router.push('/personal-hygiene/templates/new');

  return (
    <Screen fab={<Fab label="Nueva plantilla" onPress={newTemplate} />}>
      <Stack.Screen options={{ title: 'Plantillas de actuación' }} />
      <FlatList
        data={templates}
        keyExtractor={(template) => String(template.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          templates.length > 0 ? (
            <Text style={[typography.caption, { color: colors.textMuted }]}>
              Al generar un año se crea una fila por cada plantilla activa, en este orden, con «
              {YEAR_PLACEHOLDER}» sustituido por el año. Editar una plantilla no cambia las filas ya creadas.
            </Text>
          ) : undefined
        }
        renderItem={({ item, index }) => (
          <ListItem
            title={item.action}
            badge={item.active ? undefined : 'Inactiva'}
            lines={[
              `${item.productiveUnit} · ${item.place}`,
              `${item.result} · ${item.dateText}`,
              item.correctiveMeasures ? `Medidas correctoras: ${item.correctiveMeasures}` : null,
            ]}
            actions={
              templates.length > 1 ? (
                <>
                  {index > 0 ? (
                    <ActionChip label="Subir" icon="arrow-up" onPress={() => onMove(item, -1)} />
                  ) : null}
                  {index < templates.length - 1 ? (
                    <ActionChip label="Bajar" icon="arrow-down" onPress={() => onMove(item, 1)} />
                  ) : null}
                </>
              ) : undefined
            }
            onPress={() =>
              router.push({
                pathname: '/personal-hygiene/templates/[id]',
                params: { id: String(item.id) },
              })
            }
          />
        )}
        ListEmptyComponent={
          <EmptyState
            icon="file-document-multiple-outline"
            tone={colors.category[personalHygieneModule.category]}
            title="Todavía no hay plantillas"
            message="Crea una por cada actuación que se repite cada año."
            action={{ label: 'Nueva plantilla', icon: 'plus', onPress: newTemplate }}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: FAB_CLEARANCE, gap: spacing.sm },
});
