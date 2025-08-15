import { createTheme, Theme as MuiTheme } from '@mui/material/styles';
import type { MidnightCompleteTheme } from './types';
import { midnightDarkTheme } from './themes/midnight-dark';

/**
 * Creates a Material-UI theme from our Midnight theme
 */
export const createMuiThemeFromMidnight = (theme: MidnightCompleteTheme = midnightDarkTheme): MuiTheme => {
  // Determine theme mode based on background color
  const isDark = theme.colors.background.default === '#0a0a0a' || theme.colors.background.default.startsWith('#0') || theme.colors.background.default.startsWith('#1');
  
  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: theme.colors.primary[500],
        light: theme.colors.primary[400],
        dark: theme.colors.primary[600],
        contrastText: theme.colors.text.primary,
      },
      secondary: {
        main: theme.colors.secondary[500],
        light: theme.colors.secondary[400],
        dark: theme.colors.secondary[600],
        contrastText: theme.colors.text.primary,
      },
      error: {
        main: theme.colors.error[500],
        light: theme.colors.error[50],
        dark: theme.colors.error[700],
      },
      warning: {
        main: theme.colors.warning[500],
        light: theme.colors.warning[50],
        dark: theme.colors.warning[700],
      },
      info: {
        main: theme.colors.info[500],
        light: theme.colors.info[50],
        dark: theme.colors.info[700],
      },
      success: {
        main: theme.colors.success[500],
        light: theme.colors.success[50],
        dark: theme.colors.success[700],
      },
      background: {
        default: theme.colors.background.default,
        paper: theme.colors.background.paper,
      },
      text: {
        primary: theme.colors.text.primary,
        secondary: theme.colors.text.secondary,
        disabled: theme.colors.text.disabled,
      },
      divider: theme.colors.border.default,
      action: {
        active: theme.colors.text.primary,
        hover: theme.colors.action.hover,
        selected: theme.colors.action.selected,
        disabled: theme.colors.text.disabled,
        disabledBackground: theme.colors.action.disabledBackground,
        focus: theme.colors.action.focus,
      },
    },
    typography: {
      fontFamily: theme.typography.fontFamily.primary,
      fontSize: parseInt(theme.typography.fontSize.base),
      h1: {
        fontSize: theme.typography.fontSize['5xl'],
        fontWeight: theme.typography.fontWeight.bold,
        lineHeight: theme.typography.lineHeight.tight,
      },
      h2: {
        fontSize: theme.typography.fontSize['4xl'],
        fontWeight: theme.typography.fontWeight.bold,
        lineHeight: theme.typography.lineHeight.tight,
      },
      h3: {
        fontSize: theme.typography.fontSize['3xl'],
        fontWeight: theme.typography.fontWeight.semibold,
        lineHeight: theme.typography.lineHeight.tight,
      },
      h4: {
        fontSize: theme.typography.fontSize['2xl'],
        fontWeight: theme.typography.fontWeight.semibold,
        lineHeight: theme.typography.lineHeight.snug,
      },
      h5: {
        fontSize: theme.typography.fontSize.xl,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.snug,
      },
      h6: {
        fontSize: theme.typography.fontSize.lg,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.normal,
      },
      subtitle1: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.normal,
      },
      subtitle2: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.normal,
      },
      body1: {
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.normal,
        lineHeight: theme.typography.lineHeight.normal,
      },
      body2: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.normal,
        lineHeight: theme.typography.lineHeight.normal,
      },
      button: {
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.normal,
        textTransform: 'none',
      },
      caption: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.normal,
        lineHeight: theme.typography.lineHeight.normal,
      },
      overline: {
        fontSize: theme.typography.fontSize.xs,
        fontWeight: theme.typography.fontWeight.medium,
        lineHeight: theme.typography.lineHeight.normal,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
    },
    spacing: (factor: number) => {
      const spacingKeys = Object.keys(theme.spacing).filter(key => !isNaN(Number(key)));
      const baseSpacing = 4; // 0.25rem = 4px
      return `${factor * baseSpacing}px`;
    },
    shape: {
      borderRadius: parseInt(theme.borderRadius.default),
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: parseInt(theme.breakpoints.sm),
        md: parseInt(theme.breakpoints.md),
        lg: parseInt(theme.breakpoints.lg),
        xl: parseInt(theme.breakpoints.xl),
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: theme.borderRadius.md,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
            },
          },
          contained: {
            backgroundColor: theme.components.button.primary.background,
            color: theme.components.button.primary.text,
            '&:hover': {
              backgroundColor: theme.components.button.primary.backgroundHover,
            },
            '&:active': {
              backgroundColor: theme.components.button.primary.backgroundActive,
            },
          },
          containedPrimary: {
            backgroundColor: theme.components.button.primary.background,
            color: theme.components.button.primary.text,
            '&:hover': {
              backgroundColor: theme.components.button.primary.backgroundHover,
            },
          },
          containedSecondary: {
            backgroundColor: theme.components.button.secondary.background,
            color: theme.components.button.secondary.text,
            '&:hover': {
              backgroundColor: theme.components.button.secondary.backgroundHover,
            },
          },
          outlined: {
            backgroundColor: theme.components.button.outlined.background,
            color: theme.components.button.outlined.text,
            borderColor: theme.components.button.outlined.border,
            '&:hover': {
              backgroundColor: theme.components.button.outlined.backgroundHover,
              borderColor: theme.components.button.outlined.border,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: theme.components.card.background,
            borderRadius: theme.borderRadius.lg,
            boxShadow: theme.components.card.shadow,
            border: `1px solid ${theme.components.card.border}`,
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: theme.spacing[6],
            '&:last-child': {
              paddingBottom: theme.spacing[6],
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.components.input.background,
              '& fieldset': {
                borderColor: theme.components.input.border,
              },
              '&:hover fieldset': {
                borderColor: theme.components.input.border,
              },
              '&.Mui-focused fieldset': {
                borderColor: theme.components.input.borderFocus,
              },
            },
            '& .MuiInputLabel-root': {
              color: theme.colors.text.secondary,
              '&.Mui-focused': {
                color: theme.components.input.borderFocus,
              },
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: theme.components.input.background,
            color: theme.components.input.text,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: theme.colors.background.surface,
            color: theme.colors.text.primary,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: theme.colors.background.surface,
            borderRight: `1px solid ${theme.colors.border.default}`,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: theme.colors.secondary[500],
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: theme.colors.border.default,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            backgroundColor: theme.colors.background.surface,
            color: theme.colors.text.primary,
            borderColor: theme.colors.border.default,
          },
          filled: {
            backgroundColor: theme.colors.background.elevated,
          },
        },
      },
    },
  });
};

// Export a default Material-UI theme based on the Midnight dark theme
export const muiTheme = createMuiThemeFromMidnight(midnightDarkTheme);

// Hook to get current MUI theme based on current Midnight theme
export const useMuiTheme = () => {
  // We'll implement this if needed, for now use the export above
  return muiTheme;
};
