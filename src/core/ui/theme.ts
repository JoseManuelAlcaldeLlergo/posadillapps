import { useColorScheme } from 'react-native';

import type { Category } from './categories';

type CategoryColors = { accent: string; container: string };

const light = {
  background: '#F7F9F7',
  /** Form fields and sheets. */
  surface: '#FFFFFF',
  /** Cards and list items: set apart from the background by tone, not by a border. */
  surfaceContainer: '#EBF0EC',
  /** Unselected chips and segmented controls. */
  surfaceContainerHigh: '#DFE6E0',
  text: '#1B1F1C',
  textMuted: '#525A54',
  /** Borders of form fields (≥ 3:1). */
  outline: '#737B75',
  /** Dividers and decorative borders. */
  outlineVariant: '#C9D0CB',
  primary: '#2E6B3F',
  /** Text and icons on `primary`. */
  onPrimary: '#FFFFFF',
  /** Tonal buttons, FAB, selected chips. */
  primaryContainer: '#C8EBD0',
  onPrimaryContainer: '#0F3D1D',
  danger: '#B3261E',
  warning: '#8A5A00',
  success: '#2E6B3F',
  // The logo is dark blue on white in both modes, like the launcher icon
  logoBackground: '#FFFFFF',
  // Backdrop behind modals
  scrim: 'rgba(0, 0, 0, 0.4)',
  /** `android_ripple` color. */
  ripple: 'rgba(27, 31, 28, 0.12)',
  category: {
    feed: { accent: '#875000', container: '#FBEBD0' },
    biosecurity: { accent: '#1F5FA8', container: '#DCE8F7' },
    hygiene: { accent: '#00695D', container: '#D3EEEA' },
    settings: { accent: '#4A616C', container: '#E3E8EB' },
  } satisfies Record<Category, CategoryColors>,
};

const dark: typeof light = {
  background: '#121513',
  surface: '#1D211E',
  surfaceContainer: '#1E2420',
  surfaceContainerHigh: '#29302B',
  text: '#E8ECE9',
  textMuted: '#A9B1AB',
  outline: '#8C948E',
  outlineVariant: '#3A413C',
  primary: '#7CC48F',
  onPrimary: '#0D2915',
  primaryContainer: '#1F4D2C',
  onPrimaryContainer: '#C4EBCC',
  danger: '#F2B8B5',
  warning: '#F5C26B',
  success: '#7CC48F',
  logoBackground: '#FFFFFF',
  scrim: 'rgba(0, 0, 0, 0.6)',
  ripple: 'rgba(232, 236, 233, 0.12)',
  category: {
    feed: { accent: '#F2B866', container: '#3A2A12' },
    biosecurity: { accent: '#9CC3F0', container: '#172A40' },
    hygiene: { accent: '#7FD3C6', container: '#12302C' },
    settings: { accent: '#B0BEC5', container: '#263035' },
  },
};

export type ThemeColors = typeof light;

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 28, pill: 999 } as const;

/** Android elevation. Only the FAB casts a shadow. */
export const elevation = { none: 0, fab: 3 } as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700', lineHeight: 28 },
  heading: { fontSize: 18, fontWeight: '600', lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 16, fontWeight: '600', lineHeight: 22 },
  /** Dates and quantities, so digits line up in lists. */
  number: { fontSize: 16, fontWeight: '600', lineHeight: 22, fontVariant: ['tabular-nums'] },
  caption: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  captionStrong: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  label: { fontSize: 12, fontWeight: '600', lineHeight: 16 },
} as const;
