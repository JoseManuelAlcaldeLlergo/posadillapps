import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IconName } from './categories';
import { radius, spacing, typography, useThemeColors, type ThemeColors } from './theme';

type Tone = 'info' | 'success' | 'warning' | 'danger';

type Props = {
  message: string;
  title?: string;
  tone?: Tone;
  /** Inline action, e.g. `Ver todas` or `Haz una ahora`. */
  action?: { label: string; onPress: () => void };
};

const ICONS: Record<Tone, IconName> = {
  info: 'information-outline',
  success: 'check-circle-outline',
  warning: 'alert-outline',
  danger: 'alert-circle-outline',
};

function toneColors(colors: ThemeColors, tone: Tone) {
  switch (tone) {
    case 'info':
      return { background: colors.surfaceContainerHigh, text: colors.text, icon: colors.primary };
    case 'success':
      return {
        background: colors.primaryContainer,
        text: colors.onPrimaryContainer,
        icon: colors.onPrimaryContainer,
      };
    case 'warning':
      return { background: colors.warningContainer, text: colors.onWarningContainer, icon: colors.warning };
    case 'danger':
      return { background: colors.dangerContainer, text: colors.onDangerContainer, icon: colors.danger };
  }
}

/** Message about the screen's state, with an icon and the color of its tone. */
export function Notice({ message, title, tone = 'info', action }: Props) {
  const colors = useThemeColors();
  const toned = toneColors(colors, tone);
  return (
    <View
      accessibilityRole={tone === 'danger' || tone === 'warning' ? 'alert' : undefined}
      style={[styles.root, { backgroundColor: toned.background }]}
    >
      <MaterialCommunityIcons name={ICONS[tone]} size={24} color={toned.icon} />
      <View style={styles.texts}>
        {title ? <Text style={[typography.bodyStrong, { color: toned.text }]}>{title}</Text> : null}
        <Text style={[typography.body, { color: toned.text }]}>{message}</Text>
        {action ? (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            android_ripple={{ color: colors.ripple }}
            style={styles.action}
          >
            <Text style={[typography.bodyStrong, styles.actionLabel, { color: toned.text }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + spacing.xs,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  texts: { flex: 1, gap: spacing.xs },
  action: {
    alignSelf: 'flex-start',
    minHeight: 48,
    justifyContent: 'center',
    marginVertical: -spacing.sm,
  },
  actionLabel: { textDecorationLine: 'underline' },
});
