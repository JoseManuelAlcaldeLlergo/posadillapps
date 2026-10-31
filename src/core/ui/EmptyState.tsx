import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import type { IconName } from './categories';
import { radius, spacing, typography, useThemeColors } from './theme';

type Props = {
  icon: IconName;
  title: string;
  message?: string;
  /** Icon colors, e.g. the module's category; neutral by default. */
  tone?: { accent: string; container: string };
  action?: { label: string; icon?: IconName; onPress: () => void };
};

/** What an empty list shows: icon, explanation and, optionally, the way to start. */
export function EmptyState({ icon, title, message, tone, action }: Props) {
  const colors = useThemeColors();
  return (
    <View style={styles.root}>
      <View style={[styles.iconBox, { backgroundColor: tone?.container ?? colors.surfaceContainerHigh }]}>
        <MaterialCommunityIcons name={icon} size={36} color={tone?.accent ?? colors.textMuted} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} icon={action.icon} variant="tonal" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', padding: spacing.lg, gap: spacing.sm },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.heading, textAlign: 'center' },
  message: { ...typography.caption, textAlign: 'center' },
  action: { marginTop: spacing.sm },
});
