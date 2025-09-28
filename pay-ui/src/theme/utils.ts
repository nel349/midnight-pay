import type { SxProps, Theme as MuiTheme } from '@mui/material/styles';
import type { MidnightCompleteTheme } from './types';

/**
 * Helper function to convert Midnight theme values to Material-UI sx props
 */
export const createMuiSxFromTheme = (
  theme: MidnightCompleteTheme,
  overrides: Partial<SxProps<MuiTheme>> = {}
): SxProps<MuiTheme> => {
  return {
    fontFamily: theme.typography.fontFamily.primary as any,
    color: theme.colors.text.primary as any,
    backgroundColor: theme.colors.background.default as any,
    ...overrides,
  } as SxProps<MuiTheme>;
};

/**
 * Helper to create button styles from theme
 */
export const createButtonStyles = (
  theme: MidnightCompleteTheme,
  variant: 'primary' | 'secondary' | 'outlined' = 'primary'
): SxProps<MuiTheme> => {
  const buttonTheme = theme.components.button[variant];
  
  return {
    backgroundColor: buttonTheme.background,
    color: buttonTheme.text,
    border: `1px solid ${buttonTheme.border}`,
    borderRadius: theme.borderRadius.md,
    fontFamily: theme.typography.fontFamily.primary,
    fontWeight: theme.typography.fontWeight.medium,
    fontSize: theme.typography.fontSize.sm,
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
      backgroundColor: buttonTheme.backgroundHover,
      boxShadow: 'none',
    },
    '&:active': {
      backgroundColor: buttonTheme.backgroundActive,
      boxShadow: 'none',
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.colors.action.focus}`,
    },
    '&.Mui-disabled': {
      backgroundColor: theme.colors.action.disabledBackground,
      color: theme.colors.action.disabled,
      border: `1px solid ${theme.colors.border.light}`,
    },
  };
};

/**
 * Helper to create card styles from theme
 */
export const createCardStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  backgroundColor: theme.components.card.background,
  border: `1px solid ${theme.components.card.border}`,
  borderRadius: theme.borderRadius.lg,
  boxShadow: theme.components.card.shadow,
  color: theme.colors.text.primary,
  padding: theme.spacing[6],
});

/**
 * Helper to create input styles from theme
 */
export const createInputStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  backgroundColor: theme.components.input.background,
  border: `1px solid ${theme.components.input.border}`,
  borderRadius: theme.borderRadius.md,
  color: theme.components.input.text,
  fontFamily: theme.typography.fontFamily.primary,
  fontSize: theme.typography.fontSize.sm,
  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  '&:focus': {
    borderColor: theme.components.input.borderFocus,
    outline: 'none',
    boxShadow: `0 0 0 1px ${theme.components.input.borderFocus}`,
  },
  '&::placeholder': {
    color: theme.components.input.placeholder,
  },
  '& .MuiInputBase-root': {
    backgroundColor: theme.components.input.background,
    color: theme.components.input.text,
    '&:before, &:after': {
      display: 'none',
    },
    '&.Mui-focused': {
      backgroundColor: theme.components.input.background,
    },
  },
  '& .MuiInputLabel-root': {
    color: theme.colors.text.secondary,
    '&.Mui-focused': {
      color: theme.components.input.borderFocus,
    },
  },
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
});

/**
 * Helper to create consistent spacing using theme values
 */
export const spacing = (theme: MidnightCompleteTheme) => ({
  xs: theme.spacing[1],
  sm: theme.spacing[2],
  md: theme.spacing[4],
  lg: theme.spacing[6],
  xl: theme.spacing[8],
  xxl: theme.spacing[12],
});

/**
 * Helper to create consistent typography styles
 */
export const createTypographyStyles = (
  theme: MidnightCompleteTheme,
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'subtitle1' | 'subtitle2' = 'body1'
): SxProps<MuiTheme> => {
  const fontSizeMap = {
    h1: theme.typography.fontSize['5xl'],
    h2: theme.typography.fontSize['4xl'],
    h3: theme.typography.fontSize['3xl'],
    h4: theme.typography.fontSize['2xl'],
    h5: theme.typography.fontSize.xl,
    h6: theme.typography.fontSize.lg,
    subtitle1: theme.typography.fontSize.base,
    subtitle2: theme.typography.fontSize.sm,
    body1: theme.typography.fontSize.base,
    body2: theme.typography.fontSize.sm,
    caption: theme.typography.fontSize.xs,
  };

  const fontWeightMap = {
    h1: theme.typography.fontWeight.bold,
    h2: theme.typography.fontWeight.bold,
    h3: theme.typography.fontWeight.semibold,
    h4: theme.typography.fontWeight.semibold,
    h5: theme.typography.fontWeight.medium,
    h6: theme.typography.fontWeight.medium,
    subtitle1: theme.typography.fontWeight.medium,
    subtitle2: theme.typography.fontWeight.normal,
    body1: theme.typography.fontWeight.normal,
    body2: theme.typography.fontWeight.normal,
    caption: theme.typography.fontWeight.normal,
  };

  return {
    fontSize: fontSizeMap[variant],
    fontWeight: fontWeightMap[variant],
    fontFamily: theme.typography.fontFamily.primary,
    lineHeight: theme.typography.lineHeight.normal,
    color: theme.colors.text.primary,
  };
};

/**
 * Helper to create responsive breakpoint styles
 */
export const createBreakpointStyles = (theme: MidnightCompleteTheme) => ({
  up: {
    sm: `@media (min-width: ${theme.breakpoints.sm})`,
    md: `@media (min-width: ${theme.breakpoints.md})`,
    lg: `@media (min-width: ${theme.breakpoints.lg})`,
    xl: `@media (min-width: ${theme.breakpoints.xl})`,
    '2xl': `@media (min-width: ${theme.breakpoints['2xl']})`,
  },
  down: {
    sm: `@media (max-width: calc(${theme.breakpoints.sm} - 1px))`,
    md: `@media (max-width: calc(${theme.breakpoints.md} - 1px))`,
    lg: `@media (max-width: calc(${theme.breakpoints.lg} - 1px))`,
    xl: `@media (max-width: calc(${theme.breakpoints.xl} - 1px))`,
    '2xl': `@media (max-width: calc(${theme.breakpoints['2xl']} - 1px))`,
  },
});

/**
 * Helper to create consistent elevation/shadow styles
 */
export const createElevationStyles = (
  theme: MidnightCompleteTheme,
  elevation: keyof typeof theme.shadows = 'default'
): SxProps<MuiTheme> => ({
  boxShadow: theme.shadows[elevation],
});

/**
 * Quick color accessors for common theme colors
 */
export const colors = (theme: MidnightCompleteTheme) => ({
  primary: theme.colors.primary[500],
  primaryHover: theme.colors.primary[600],
  secondary: theme.colors.secondary[500],
  secondaryHover: theme.colors.secondary[600],
  success: theme.colors.success[500],
  warning: theme.colors.warning[500],
  error: theme.colors.error[500],
  info: theme.colors.info[500],
  background: theme.colors.background.default,
  surface: theme.colors.background.paper,
  elevated: theme.colors.background.elevated,
  textPrimary: theme.colors.text.primary,
  textSecondary: theme.colors.text.secondary,
  textDisabled: theme.colors.text.disabled,
  border: theme.colors.border.default,
  borderLight: theme.colors.border.light,
  borderStrong: theme.colors.border.strong,
});

/**
 * Helper to apply focus ring styles consistently
 */
export const createFocusRingStyles = (theme: MidnightCompleteTheme): SxProps<MuiTheme> => ({
  '&:focus': {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.colors.action.focus}`,
  },
});

/**
 * Helper to apply hover states consistently
 */
export const createHoverStyles = (
  theme: MidnightCompleteTheme,
  backgroundColor?: string
): SxProps<MuiTheme> => ({
  '&:hover': {
    backgroundColor: backgroundColor || theme.colors.action.hover,
    cursor: 'pointer',
  },
});
