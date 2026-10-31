import { useColorScheme } from 'react-native';

import type { Category } from './categories';

type CategoryColors = { accent: string; container: string };

const light = {
  background: '#F4F6F4',
  surface: '#FFFFFF',
  text: '#1B1F1C',
  textMuted: '#5B635D',
  border: '#D8DDD9',
  primary: '#2E6B3F',
  danger: '#B3261E',
  warning: '#8A5A00',
  success: '#2E6B3F',
  category: {
    feed: { accent: '#9A5B00', container: '#FBEBD0' },
    biosecurity: { accent: '#1F5FA8', container: '#DCE8F7' },
    hygiene: { accent: '#00796B', container: '#D3EEEA' },
    settings: { accent: '#546E7A', container: '#E3E8EB' },
  } satisfies Record<Category, CategoryColors>,
};

const dark: typeof light = {
  background: '#121513',
  surface: '#1D211E',
  text: '#E8ECE9',
  textMuted: '#A3ABA5',
  border: '#343A36',
  primary: '#7CC48F',
  danger: '#F2B8B5',
  warning: '#F5C26B',
  success: '#7CC48F',
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

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const radius = { sm: 8, md: 12, pill: 999 } as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700' },
  heading: { fontSize: 18, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 14, fontWeight: '400' },
  label: { fontSize: 12, fontWeight: '600' },
} as const;
