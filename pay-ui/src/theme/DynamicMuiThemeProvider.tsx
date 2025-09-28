import React, { useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useThemeValues } from './ThemeProvider';
import { createMuiThemeFromMidnight } from './mui-theme';

interface DynamicMuiThemeProviderProps {
  children: React.ReactNode;
}

export const DynamicMuiThemeProvider: React.FC<DynamicMuiThemeProviderProps> = ({ children }) => {
  const currentTheme = useThemeValues();
  
  // Create MUI theme based on current Midnight theme
  const muiTheme = useMemo(() => {
    return createMuiThemeFromMidnight(currentTheme);
  }, [currentTheme]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      {children}
    </MuiThemeProvider>
  );
};
