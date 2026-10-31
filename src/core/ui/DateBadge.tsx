import { StyleSheet, Text, View } from 'react-native';

import { monthAbbreviation } from '../dates';
import { formatDate } from '../export/format';
import { radius, typography, useThemeColors } from './theme';

type Props = {
  /** ISO `YYYY-MM-DD`. */
  date: string;
};

/** Day and short month (`23` / `oct`) at the left of a list item. */
export function DateBadge({ date }: Props) {
  const colors = useThemeColors();
  return (
    <View
      accessible
      accessibilityLabel={formatDate(date)}
      style={[styles.box, { backgroundColor: colors.surfaceContainerHigh }]}
    >
      <Text style={[styles.day, { color: colors.text }]}>{Number(date.slice(8, 10))}</Text>
      <Text style={[typography.label, { color: colors.textMuted }]}>{monthAbbreviation(date)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { ...typography.number, fontSize: typography.heading.fontSize },
});
