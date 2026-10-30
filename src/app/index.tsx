import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { BackupReminder } from '@/core/backup/BackupReminder';
import { CenteredMessage, ListItem, Screen, spacing } from '@/core/ui';
import { modules } from '@/modules/registry';

export default function HomeScreen() {
  return (
    <Screen>
      <FlatList
        data={modules}
        keyExtractor={(module) => module.id}
        contentContainerStyle={modules.length === 0 ? styles.empty : styles.list}
        ListHeaderComponent={<BackupReminder />}
        renderItem={({ item }) => (
          <ListItem
            title={item.title}
            subtitle={item.description}
            onPress={() => router.push(item.route)}
          />
        )}
        ListEmptyComponent={
          <CenteredMessage
            title="Todavía no hay módulos"
            message="Los registros de la explotación aparecerán aquí."
          />
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <ListItem
              title="Copia de seguridad"
              subtitle="Guardar o restaurar todos los datos"
              onPress={() => router.push('/backup')}
            />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.md, gap: spacing.md },
  empty: { flexGrow: 1, padding: spacing.md, gap: spacing.md },
  footer: { marginTop: spacing.md },
});
