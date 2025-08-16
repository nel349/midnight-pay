import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { MidnightCompleteTheme } from './types';
import { midnightDarkTheme } from './themes/midnight-dark';
import { midnightLightTheme } from './themes/midnight-light';

// Theme mode type
export type ThemeMode = 'light' | 'dark';

// Theme context
interface ThemeContextType {
  theme: MidnightCompleteTheme;
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  theme?: MidnightCompleteTheme;
}

// Get theme from mode
const getThemeFromMode = (mode: ThemeMode): MidnightCompleteTheme => {
  return mode === 'dark' ? midnightDarkTheme : midnightLightTheme;
};

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  theme: customTheme
}) => {
  // Initialize theme mode from localStorage or default to dark
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('midnight-theme-mode');
      return (stored as ThemeMode) || 'dark';
    }
    return 'dark';
  });

  // Get the current theme based on mode or custom theme
  const currentTheme = customTheme || getThemeFromMode(mode);

  // Save theme mode to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('midnight-theme-mode', mode);
    }
  }, [mode]);

  const toggleTheme = () => {
    setMode(prevMode => prevMode === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    mode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get theme values directly (convenience)
export const useThemeValues = (): MidnightCompleteTheme => {
  const { theme } = useTheme();
  return theme;
};

// Utility function to create CSS custom properties from theme
export const createCSSCustomProperties = (theme: MidnightCompleteTheme): Record<string, string> => {
  const cssVars: Record<string, string> = {};

  // Add color variables
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value;
  });

  Object.entries(theme.colors.secondary).forEach(([key, value]) => {
    cssVars[`--color-secondary-${key}`] = value;
  });

  Object.entries(theme.colors.success).forEach(([key, value]) => {
    cssVars[`--color-success-${key}`] = value;
  });

  Object.entries(theme.colors.warning).forEach(([key, value]) => {
    cssVars[`--color-warning-${key}`] = value;
  });

  Object.entries(theme.colors.error).forEach(([key, value]) => {
    cssVars[`--color-error-${key}`] = value;
  });

  Object.entries(theme.colors.info).forEach(([key, value]) => {
    cssVars[`--color-info-${key}`] = value;
  });

  // Background colors
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    cssVars[`--color-background-${key}`] = value;
  });

  // Text colors
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    cssVars[`--color-text-${key}`] = value;
  });

  // Border colors
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    cssVars[`--color-border-${key}`] = value;
  });

  // Action colors
  Object.entries(theme.colors.action).forEach(([key, value]) => {
    cssVars[`--color-action-${key}`] = value;
  });

  // Typography variables
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    cssVars[`--font-size-${key}`] = value;
  });

  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    cssVars[`--font-weight-${key}`] = value.toString();
  });

  Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
    cssVars[`--line-height-${key}`] = value.toString();
  });

  // Font families
  cssVars['--font-family-primary'] = theme.typography.fontFamily.primary;
  cssVars['--font-family-mono'] = theme.typography.fontFamily.mono;

  // Spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });

  // Border radius variables
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    cssVars[`--border-radius-${key}`] = value;
  });

  // Shadow variables
  Object.entries(theme.shadows).forEach(([key, value]) => {
    cssVars[`--shadow-${key}`] = value;
  });

  // Breakpoint variables
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    cssVars[`--breakpoint-${key}`] = value;
  });

  return cssVars;
};

// Component that injects CSS custom properties into the document
export const ThemeStyleInjector: React.FC = () => {
  const { theme } = useTheme();
  const cssVars = createCSSCustomProperties(theme);

  React.useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties on the root element
    Object.entries(cssVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Set the background color on the body
    document.body.style.backgroundColor = theme.colors.background.default;
    document.body.style.color = theme.colors.text.primary;

    // Cleanup function (though not strictly necessary for this use case)
    return () => {
      Object.keys(cssVars).forEach(property => {
        root.style.removeProperty(property);
      });
    };
  }, [cssVars, theme]);

  return null; // This component doesn't render anything visible
};
