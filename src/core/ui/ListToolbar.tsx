import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Chip, ChipRow } from './Chip';
import { radius, spacing, typography, useThemeColors } from './theme';

type Props = {
  /** Secondary actions of the list, as `ActionChip`s. The main one goes in the `Fab`. */
  actions?: ReactNode;
  /** Number of filters in use; shown on the Filtros chip. */
  activeFilters: number;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  /** Filter fields, shown in a panel while open (usually `FilterGroup`s). */
  filters: ReactNode;
};

/** Row of actions and filter chips above a list, with the filter panel under it. */
export function ListToolbar({
  actions,
  activeFilters,
  filtersOpen,
  onToggleFilters,
  onClearFilters,
  filters,
}: Props) {
  const colors = useThemeColors();
  return (
    <View style={styles.root}>
      <ChipRow>
        {actions}
        <Chip
          label={activeFilters ? `Filtros (${activeFilters})` : 'Filtros'}
          selected={filtersOpen}
          onPress={onToggleFilters}
        />
        {activeFilters ? <Chip label="Quitar filtros" onPress={onClearFilters} /> : null}
      </ChipRow>
      {filtersOpen ? (
        <View style={[styles.panel, { backgroundColor: colors.surfaceContainer }]}>{filters}</View>
      ) : null}
    </View>
  );
}

type GroupProps = { label: string; children: ReactNode };

/** One filter inside the panel: a label and its chips. */
export function FilterGroup({ label, children }: GroupProps) {
  const colors = useThemeColors();
  return (
    <View style={styles.group}>
      <Text style={[typography.captionStrong, { color: colors.text }]}>{label}</Text>
      <ChipRow>{children}</ChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  panel: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.md },
  group: { gap: spacing.xs },
});
