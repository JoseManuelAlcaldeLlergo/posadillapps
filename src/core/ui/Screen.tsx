import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing, useThemeColors } from './theme';

type Props = {
  children: ReactNode;
  /** Scrollable padded content, for forms. */
  scroll?: boolean;
  /**
   * A `Fab`, placed at the bottom right over the content. Lists add
   * `FAB_CLEARANCE` to their bottom padding so it does not cover the last item.
   */
  fab?: ReactNode;
};

export function Screen({ children, scroll, fab }: Props) {
  const colors = useThemeColors();
  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.root}>{children}</View>
      )}
      {fab ? <View style={styles.fab}>{fab}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  fab: { position: 'absolute', right: spacing.md, bottom: spacing.md },
});
