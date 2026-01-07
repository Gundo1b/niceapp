import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  colors: typeof lightColors;
}

const lightColors = {
  background: '#FFFFFF',
  surface: '#F5F5F5',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  primary: '#007AFF',
  primaryLight: '#E5F2FF',
  success: '#34C759',
  successLight: '#E8F8EC',
  warning: '#FF9500',
  warningLight: '#FFF4E5',
  error: '#FF3B30',
  errorLight: '#FFE8E6',
  accent: '#5856D6',
  accentLight: '#EDEDFF',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

const darkColors = {
  background: '#000000',
  surface: '#1C1C1E',
  card: '#2C2C2E',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  border: '#38383A',
  primary: '#0A84FF',
  primaryLight: '#1A2533',
  success: '#30D158',
  successLight: '#1A2E1F',
  warning: '#FF9F0A',
  warningLight: '#332A1A',
  error: '#FF453A',
  errorLight: '#331A1A',
  accent: '#5E5CE6',
  accentLight: '#252533',
  shadow: 'rgba(0, 0, 0, 0.5)',
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'auto',
  effectiveTheme: 'light',
  setTheme: () => {},
  colors: lightColors,
});

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');

  const effectiveTheme =
    theme === 'auto' ? (systemColorScheme || 'light') : theme;

  const colors = effectiveTheme === 'dark' ? darkColors : lightColors;

  const value = {
    theme,
    effectiveTheme,
    setTheme,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};
