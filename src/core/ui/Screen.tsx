import { useEffect, useRef, useState, type ComponentRef, type ReactNode, type RefObject } from 'react';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

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
  /** Actions always visible at the bottom, e.g. Guardar. */
  footer?: ReactNode;
};

export function Screen({ children, scroll, fab, footer }: Props) {
  const colors = useThemeColors();
  const rootRef = useRef<ComponentRef<typeof View>>(null);
  const insets = useSafeAreaInsets();
  const keyboardPadding = useKeyboardOverlap(rootRef);
  return (
    <SafeAreaView
      // With a footer, the footer takes the bottom inset so its background reaches the edge.
      edges={footer ? ['left', 'right'] : ['bottom', 'left', 'right']}
      style={[styles.root, { backgroundColor: colors.background }]}
    >
      <View ref={rootRef} style={[styles.root, { paddingBottom: keyboardPadding }]}>
        {scroll ? (
          <ScrollView
            style={styles.root}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={styles.root}>{children}</View>
        )}
        {footer ? (
          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.surface,
                borderTopColor: colors.outlineVariant,
                // The keyboard already covers the system navigation bar.
                paddingBottom: (keyboardPadding ? 0 : insets.bottom) + spacing.sm,
              },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </View>
      {fab ? <View style={[styles.fab, { bottom: insets.bottom + spacing.md }]}>{fab}</View> : null}
    </SafeAreaView>
  );
}

/**
 * How much of the view the keyboard covers. Edge-to-edge Android does not
 * shrink the window for the keyboard, so the screen pads its content by this
 * much to keep the focused field and the footer above it.
 */
function useKeyboardOverlap(ref: RefObject<ComponentRef<typeof View> | null>): number {
  const [overlap, setOverlap] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      ref.current?.measureInWindow((_x, y, _width, height) => {
        setOverlap(Math.max(0, y + height - event.endCoordinates.screenY));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [ref]);
  return overlap;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { padding: spacing.md, gap: spacing.md },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  fab: { position: 'absolute', right: spacing.md },
});
