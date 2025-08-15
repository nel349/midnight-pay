// Midnight Light Theme - Inverted theme with white basis and dark elements
// Light background with dark components featuring white text

import type { MidnightCompleteTheme } from '../types';

export const midnightLightTheme: MidnightCompleteTheme = {
  name: 'Midnight Light',
  
  colors: {
    // Primary colors - Keep dark for buttons and key elements (as requested - black instead of blue)
    primary: {
      50: '#000000',   // Pure black for primary elements
      100: '#0f0f0f',  // Very dark
      200: '#1a1a1a',  // Dark charcoal
      300: '#2a2a2a',  // Medium dark
      400: '#3f3f46',  // Medium gray
      500: '#1a1a1a',  // Main primary - Deep black/charcoal (for buttons)
      600: '#0f0f0f',  // Darker black
      700: '#000000',  // Pure black
      800: '#000000',  // Pure black
      900: '#000000',  // Pure black
      950: '#000000',  // Pure black
    },
    
    // Secondary colors - Dark purples (Midnight protocol inspired)
    secondary: {
      50: '#2e1065',   // Very dark purple
      100: '#4c1d95',  // Dark purple
      200: '#5b21b6',  // Deep purple
      300: '#6d28d9',  // Purple
      400: '#7c3aed',  // Medium purple
      500: '#8b5cf6',  // Main secondary - Deep purple
      600: '#7c3aed',  // Darker purple
      700: '#6d28d9',  // Deep purple
      800: '#5b21b6',  // Very deep purple
      900: '#4c1d95',  // Darkest purple
      950: '#2e1065',  // Almost black purple
    },
    
    // Semantic colors - Dark variants for light theme
    success: {
      50: '#ecfdf5',   // Light green background
      500: '#047857',  // Dark success green
      700: '#065f46',  // Very dark success green
    },
    
    warning: {
      50: '#fffbeb',   // Light yellow background
      500: '#b45309',  // Dark warning amber
      700: '#92400e',  // Very dark warning amber
    },
    
    error: {
      50: '#fef2f2',   // Light red background
      500: '#b91c1c',  // Dark error red
      700: '#991b1b',  // Very dark error red
    },
    
    info: {
      50: '#eff6ff',   // Light blue background
      500: '#1d4ed8',  // Dark info blue
      700: '#1e40af',  // Very dark info blue
    },
    
    // Background colors - Light theme base (inverted)
    background: {
      default: '#ffffff',    // Pure white background
      paper: '#f8fafc',      // Very light gray for cards/surfaces
      surface: '#f1f5f9',    // Light gray surface elements
      elevated: '#e2e8f0',   // Elevated components (modals, etc.)
    },
    
    // Text colors - Dark for readability on light backgrounds
    text: {
      primary: '#0f172a',     // Very dark for primary text
      secondary: '#475569',   // Medium gray for secondary text  
      disabled: '#94a3b8',    // Light gray for disabled text
      inverse: '#ffffff',     // White text (for use on dark elements)
    },
    
    // Border and divider colors - Light theme borders
    border: {
      default: '#e2e8f0',     // Default border - light gray
      light: '#f1f5f9',       // Lighter border - very light gray
      strong: '#cbd5e1',      // Strong border - medium gray
    },
    
    // Action colors (hover, focus, etc.) - Light theme actions
    action: {
      hover: 'rgba(15, 23, 42, 0.04)',          // Subtle dark hover
      selected: 'rgba(139, 92, 246, 0.12)',     // Purple selected state
      disabled: 'rgba(15, 23, 42, 0.26)',       // Disabled state
      disabledBackground: 'rgba(15, 23, 42, 0.12)', // Disabled background
      focus: 'rgba(139, 92, 246, 0.12)',        // Purple focus ring
    },
  },
  
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
    
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    
    lineHeight: {
      none: 1,
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
    32: '8rem',     // 128px
    40: '10rem',    // 160px
    48: '12rem',    // 192px
    56: '14rem',    // 224px
    64: '16rem',    // 256px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.125rem',     // 2px
    default: '0.25rem', // 4px
    md: '0.375rem',     // 6px
    lg: '0.5rem',       // 8px
    xl: '0.75rem',      // 12px
    '2xl': '1rem',      // 16px
    full: '9999px',     // Fully rounded
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Component-specific theme overrides - Dark elements with white text
  components: {
    button: {
      primary: {
        background: '#1a1a1a',        // Dark black/charcoal (as requested)
        backgroundHover: '#2a2a2a',   // Slightly lighter on hover
        backgroundActive: '#0f0f0f',  // Darker on active
        text: '#ffffff',              // White text on dark background
        border: '#1a1a1a',            // Same as background
      },
      secondary: {
        background: '#8b5cf6',        // Purple secondary
        backgroundHover: '#7c3aed',   // Darker purple on hover  
        backgroundActive: '#6d28d9',  // Even darker on active
        text: '#ffffff',              // White text on dark background
        border: '#8b5cf6',            // Same as background
      },
      outlined: {
        background: 'transparent',    // Transparent background
        backgroundHover: 'rgba(26, 26, 26, 0.04)', // Subtle hover
        backgroundActive: 'rgba(26, 26, 26, 0.08)', // Subtle active
        text: '#1a1a1a',              // Dark text
        border: '#1a1a1a',            // Dark border
      },
    },
    
    card: {
      background: '#f8fafc',          // Light card background
      border: '#e2e8f0',              // Light border
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    
    input: {
      background: '#ffffff',          // White input background
      border: '#cbd5e1',              // Medium gray border
      borderFocus: '#8b5cf6',         // Purple focus border
      text: '#0f172a',                // Dark text
      placeholder: '#71717a',         // Medium gray placeholder
    },
  },
};
