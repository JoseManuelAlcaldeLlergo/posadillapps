import { useColorScheme } from 'react-native';

const light = {
  background: '#F4F6F4',
  surface: '#FFFFFF',
  text: '#1B1F1C',
  textMuted: '#5B635D',
  border: '#D8DDD9',
  primary: '#2E6B3F',
  danger: '#B3261E',
};

const dark: typeof light = {
  background: '#121513',
  surface: '#1D211E',
  text: '#E8ECE9',
  textMuted: '#A3ABA5',
  border: '#343A36',
  primary: '#7CC48F',
  danger: '#F2B8B5',
};

export type ThemeColors = typeof light;

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 } as const;
