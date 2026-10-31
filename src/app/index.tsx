import { router } from 'expo-router';
import { SectionList, StyleSheet, Text, View } from 'react-native';

import { BackupReminder } from '@/core/backup/BackupReminder';
import { settingsEntries, type HomeEntry } from '@/core/settingsEntries';
import {
  CenteredMessage,
  groupByCategory,
  ModuleCard,
  Screen,
  spacing,
  typography,
  useThemeColors,
} from '@/core/ui';
import { modules } from '@/modules/registry';

const sections = groupByCategory<HomeEntry>([...modules, ...settingsEntries]);

export default function HomeScreen() {
  const colors = useThemeColors();
  return (
    <Screen>
      <SectionList
        sections={sections}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <BackupReminder />
            {modules.length === 0 ? (
              <CenteredMessage
                title="Todavía no hay módulos"
                message="Los registros de la explotación aparecerán aquí."
              />
            ) : null}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View
            style={[
              styles.sectionHeader,
              section.category === 'settings' && [
                styles.settingsHeader,
                { borderTopColor: colors.outlineVariant },
              ],
            ]}
          >
            <Text accessibilityRole="header" style={[typography.label, { color: colors.textMuted }]}>
              {section.title}
            </Text>
          </View>
        )}
        renderItem={({ item }) => (
          <ModuleCard
            title={item.title}
            subtitle={item.description}
            icon={item.icon}
            category={item.category}
            onPress={() => router.push(item.route)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md },
  sectionHeader: { paddingTop: spacing.lg, paddingBottom: spacing.sm },
  settingsHeader: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  separator: { height: spacing.md },
});
