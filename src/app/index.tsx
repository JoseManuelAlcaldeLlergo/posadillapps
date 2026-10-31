import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';

import { BackupReminder } from '@/core/backup/BackupReminder';
import { settingsEntries, type HomeEntry } from '@/core/settingsEntries';
import {
  CenteredMessage,
  groupByCategory,
  ModuleCard,
  Screen,
  SectionHeader,
  spacing,
  typography,
  useThemeColors,
} from '@/core/ui';
import { modules } from '@/modules/registry';

const sections = groupByCategory<HomeEntry>([...modules, ...settingsEntries]);

/** The app's own screens: a light row, so they weigh less than the record modules. */
function SettingsRow({ entry }: { entry: HomeEntry }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={entry.description ? `${entry.title}. ${entry.description}` : entry.title}
      onPress={() => router.push(entry.route)}
      android_ripple={{ color: colors.ripple }}
      style={styles.settingsRow}
    >
      <MaterialCommunityIcons name={entry.icon} size={24} color={colors.category.settings.accent} />
      <View style={styles.settingsTexts}>
        <Text style={[typography.bodyStrong, { color: colors.text }]}>{entry.title}</Text>
        {entry.description ? (
          <Text style={[typography.caption, { color: colors.textMuted }]}>{entry.description}</Text>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
    </Pressable>
  );
}

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
            <SectionHeader title={section.title} />
          </View>
        )}
        renderItem={({ item }) =>
          item.category === 'settings' ? (
            <SettingsRow entry={item} />
          ) : (
            <ModuleCard
              title={item.title}
              subtitle={item.description}
              icon={item.icon}
              category={item.category}
              onPress={() => router.push(item.route)}
            />
          )
        }
        ItemSeparatorComponent={({ section }) =>
          section.category === 'settings' ? null : <View style={styles.separator} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { gap: spacing.md },
  sectionHeader: { paddingTop: spacing.sm },
  settingsHeader: {
    marginTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  separator: { height: spacing.md },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm,
  },
  settingsTexts: { flex: 1, gap: spacing.xxs },
});
