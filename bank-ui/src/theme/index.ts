// Theme types
export type {
  MidnightColors,
  MidnightTypography,
  MidnightSpacing,
  MidnightBorderRadius,
  MidnightShadows,
  MidnightBreakpoints,
  MidnightTheme,
  MidnightComponentTheme,
  MidnightCompleteTheme,
} from './types';

// Theme provider and hooks
export {
  ThemeProvider,
  useTheme,
  useThemeValues,
  createCSSCustomProperties,
  ThemeStyleInjector,
} from './ThemeProvider';
export type { ThemeMode } from './ThemeProvider';

// Available themes
export { midnightDarkTheme } from './themes/midnight-dark';
export { midnightLightTheme } from './themes/midnight-light';

// Theme utilities
export {
  createMuiSxFromTheme,
  createButtonStyles,
  createCardStyles,
  createInputStyles,
  spacing,
  createTypographyStyles,
  createBreakpointStyles,
  createElevationStyles,
  colors,
  createFocusRingStyles,
  createHoverStyles,
} from './utils';

// Material-UI theme integration
export {
  createMuiThemeFromMidnight,
  muiTheme,
} from './mui-theme';
export { DynamicMuiThemeProvider } from './DynamicMuiThemeProvider';
