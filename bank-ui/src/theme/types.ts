// Theme System Types for Midnight Bank UI
// Comprehensive type definitions for theme configuration

export interface MidnightColors {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Main primary color
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // Secondary colors  
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string; // Main secondary color
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // Semantic colors
  success: {
    50: string;
    500: string;
    700: string;
  };
  
  warning: {
    50: string;
    500: string;
    700: string;
  };
  
  error: {
    50: string;
    500: string;
    700: string;
  };
  
  info: {
    50: string;
    500: string;
    700: string;
  };
  
  // Background colors
  background: {
    default: string;
    paper: string;
    surface: string;
    elevated: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  
  // Border and divider colors
  border: {
    default: string;
    light: string;
    strong: string;
  };
  
  // Action colors (hover, focus, etc.)
  action: {
    hover: string;
    selected: string;
    disabled: string;
    disabledBackground: string;
    focus: string;
  };
}

export interface MidnightTypography {
  fontFamily: {
    primary: string;
    mono: string;
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  
  lineHeight: {
    none: number;
    tight: number;
    snug: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
}

export interface MidnightSpacing {
  px: string;
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

export interface MidnightBorderRadius {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface MidnightShadows {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
}

export interface MidnightBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface MidnightTheme {
  name: string;
  colors: MidnightColors;
  typography: MidnightTypography;
  spacing: MidnightSpacing;
  borderRadius: MidnightBorderRadius;
  shadows: MidnightShadows;
  breakpoints: MidnightBreakpoints;
}

// Component-specific theme overrides
export interface MidnightComponentTheme {
  button: {
    primary: {
      background: string;
      backgroundHover: string;
      backgroundActive: string;
      text: string;
      border: string;
    };
    secondary: {
      background: string;
      backgroundHover: string;
      backgroundActive: string;
      text: string;
      border: string;
    };
    outlined: {
      background: string;
      backgroundHover: string;
      backgroundActive: string;
      text: string;
      border: string;
    };
  };
  
  card: {
    background: string;
    border: string;
    shadow: string;
  };
  
  input: {
    background: string;
    border: string;
    borderFocus: string;
    text: string;
    placeholder: string;
  };
}

// Complete theme interface
export interface MidnightCompleteTheme extends MidnightTheme {
  components: MidnightComponentTheme;
}
