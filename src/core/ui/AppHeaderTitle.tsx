import { Image, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useThemeColors } from './theme';

const logo = require('../../../assets/images/logo.png');

type Props = { title: string };

/** Header title with the app logo, for the home screen's app bar. */
export function AppHeaderTitle({ title }: Props) {
  const colors = useThemeColors();
  return (
    <View style={styles.row}>
      <View style={[styles.logoBox, { backgroundColor: colors.logoBackground }]}>
        <Image source={logo} style={styles.logo} resizeMode="contain" accessible={false} />
      </View>
      <Text style={[typography.title, { color: colors.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { width: 30, height: 30 },
});
