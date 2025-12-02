import React, { createContext, useContext, useMemo, useState } from 'react';
import { CssBaseline, ThemeProvider, PaletteMode, createTheme, ThemeOptions } from '@mui/material';

export type Density = 'comfortable' | 'compact';

interface DensityContextValue {
  density: Density;
  toggleDensity: () => void;
}

interface ColorModeContextValue {
  mode: PaletteMode;
  toggleColorMode: () => void;
}

const DensityContext = createContext<DensityContextValue | undefined>(undefined);
const ColorModeContext = createContext<ColorModeContextValue | undefined>(undefined);

const baseTokens: ThemeOptions = {
  typography: {
    fontFamily: 'Inter, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: 0.2 },
  },
  shape: { borderRadius: 12 },
  spacing: 8,
  shadows: [
    'none',
    '0px 1px 3px rgba(15, 23, 42, 0.08), 0px 1px 2px rgba(15, 23, 42, 0.12)',
    '0px 3px 6px rgba(15, 23, 42, 0.08), 0px 2px 4px rgba(15, 23, 42, 0.08)',
    '0px 6px 10px rgba(15, 23, 42, 0.1), 0px 3px 6px rgba(15, 23, 42, 0.12)',
    '0px 10px 15px rgba(15, 23, 42, 0.12), 0px 4px 6px rgba(15, 23, 42, 0.12)',
    ...Array(20).fill('0px 12px 17px rgba(15, 23, 42, 0.18), 0px 5px 8px rgba(15, 23, 42, 0.1)'),
  ],
};

const getDesignTokens = (mode: PaletteMode, density: Density): ThemeOptions => ({
  ...baseTokens,
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#9BB4FF' : '#1D4ED8',
    },
    secondary: {
      main: mode === 'dark' ? '#A3E635' : '#4D7C0F',
    },
    background: {
      default: mode === 'dark' ? '#0B1224' : '#F7F7F8',
      paper: mode === 'dark' ? '#0F172A' : '#FFFFFF',
    },
    text: {
      primary: mode === 'dark' ? '#E2E8F0' : '#0F172A',
      secondary: mode === 'dark' ? '#A3AEC2' : '#475569',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: density === 'compact' ? '6px 12px' : '10px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          border: mode === 'dark' ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid #e2e8f0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 14,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          padding: density === 'compact' ? '8px 12px' : '12px 16px',
        },
        head: {
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          fontSize: 12,
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
  },
});

export const useDensity = () => {
  const ctx = useContext(DensityContext);
  if (!ctx) throw new Error('useDensity must be used within DesignSystemProvider');
  return ctx;
};

export const useColorModeToggle = () => {
  const ctx = useContext(ColorModeContext);
  if (!ctx) throw new Error('useColorModeToggle must be used within DesignSystemProvider');
  return ctx;
};

export const DesignSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('dark');
  const [density, setDensity] = useState<Density>('comfortable');

  const theme = useMemo(() => createTheme(getDesignTokens(mode, density)), [mode, density]);

  const toggleColorMode = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));
  const toggleDensity = () => setDensity(prev => (prev === 'compact' ? 'comfortable' : 'compact'));

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <DensityContext.Provider value={{ density, toggleDensity }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </DensityContext.Provider>
    </ColorModeContext.Provider>
  );
};
