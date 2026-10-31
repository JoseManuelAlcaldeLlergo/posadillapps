import { StyleSheet, Text } from 'react-native';

import { spacing, typography, useThemeColors } from './theme';

type Props = { title: string };

/** Heading of a group: a category on the home screen, a month in a list. */
export function SectionHeader({ title }: Props) {
  const colors = useThemeColors();
  return (
    <Text accessibilityRole="header" style={[styles.title, { color: colors.textMuted }]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.label, paddingTop: spacing.md, paddingBottom: spacing.sm },
});
