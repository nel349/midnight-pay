// MidnightPay Dark Theme - Privacy-First Payment Gateway
// Deep dark theme with black/charcoal accents and purple highlights for payment UI

import type { MidnightCompleteTheme } from '../types';

export const midnightDarkTheme: MidnightCompleteTheme = {
  name: 'MidnightPay Dark',
  
  colors: {
    // Primary colors - Deep blacks and charcoals (as requested - black instead of blue)
    primary: {
      50: '#f8fafc',   // Very light gray (for text on dark backgrounds)
      100: '#f1f5f9',  // Light gray
      200: '#e2e8f0',  // Lighter gray
      300: '#cbd5e1',  // Medium light gray
      400: '#94a3b8',  // Medium gray
      500: '#1a1a1a',  // Main primary - Deep black/charcoal
      600: '#0f0f0f',  // Darker black
      700: '#000000',  // Pure black
      800: '#000000',  // Pure black
      900: '#000000',  // Pure black
      950: '#000000',  // Pure black
    },
    
    // Secondary colors - Deep purples (Midnight protocol inspired)
    secondary: {
      50: '#faf5ff',   // Very light purple
      100: '#f3e8ff',  // Light purple
      200: '#e9d5ff',  // Lighter purple
      300: '#d8b4fe',  // Medium light purple
      400: '#c084fc',  // Medium purple
      500: '#8b5cf6',  // Main secondary - Deep purple
      600: '#7c3aed',  // Darker purple
      700: '#6d28d9',  // Deep purple
      800: '#5b21b6',  // Very deep purple
      900: '#4c1d95',  // Darkest purple
      950: '#2e1065',  // Almost black purple
    },
    
    // Semantic colors - Dark theme variants
    success: {
      50: '#ecfdf5',   // Light green background
      500: '#10b981',  // Success green
      700: '#047857',  // Dark success green
    },
    
    warning: {
      50: '#fffbeb',   // Light yellow background
      500: '#f59e0b',  // Warning amber
      700: '#b45309',  // Dark warning amber
    },
    
    error: {
      50: '#fef2f2',   // Light red background
      500: '#ef4444',  // Error red
      700: '#b91c1c',  // Dark error red
    },
    
    info: {
      50: '#eff6ff',   // Light blue background
      500: '#3b82f6',  // Info blue
      700: '#1d4ed8',  // Dark info blue
    },
    
    // Background colors - Deep dark theme
    background: {
      default: '#0a0a0a',    // Almost black background
      paper: '#111111',      // Slightly lighter for cards/surfaces
      surface: '#1a1a1a',    // Surface elements
      elevated: '#2a2a2a',   // Elevated components (modals, etc.)
    },
    
    // Text colors - ENHANCED CONTRAST for accessibility
    text: {
      primary: '#ffffff',     // Pure white for primary text
      secondary: '#d1d5db',   // Much lighter gray for secondary text  
      disabled: '#9ca3af',    // Lighter gray for disabled text (still accessible)
      inverse: '#000000',     // Pure black text (for use on light backgrounds)
    },
    
    // Border and divider colors - ENHANCED CONTRAST
    border: {
      default: '#6b7280',     // Much lighter border - clearly visible
      light: '#4b5563',       // Medium border - still visible
      strong: '#9ca3af',      // Very strong border - high contrast
    },
    
    // Action colors (hover, focus, etc.) - ENHANCED CONTRAST
    action: {
      hover: 'rgba(255, 255, 255, 0.08)',           // More visible white hover
      selected: 'rgba(255, 255, 255, 0.15)',        // Lighter selected state
      disabled: 'rgba(255, 255, 255, 0.38)',        // Stronger disabled state
      disabledBackground: 'rgba(255, 255, 255, 0.12)', // More visible disabled background
      focus: 'rgba(255, 255, 255, 0.2)',            // Strong focus ring
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
  
  // Component-specific theme overrides
  components: {
    button: {
      primary: {
        background: '#1a1a1a',        // Dark black/charcoal (as requested)
        backgroundHover: '#2a2a2a',   // Slightly lighter on hover
        backgroundActive: '#0f0f0f',  // Darker on active
        text: '#ffffff',              // White text
        border: '#3f3f46',            // Medium gray border
      },
      secondary: {
        background: '#8b5cf6',        // Purple secondary
        backgroundHover: '#7c3aed',   // Darker purple on hover  
        backgroundActive: '#6d28d9',  // Even darker on active
        text: '#ffffff',              // White text
        border: '#8b5cf6',            // Same as background
      },
      outlined: {
        background: 'transparent',    // Transparent background
        backgroundHover: 'rgba(26, 26, 26, 0.04)', // Subtle hover
        backgroundActive: 'rgba(26, 26, 26, 0.08)', // Subtle active
        text: '#ffffff',              // White text
        border: '#3f3f46',            // Medium gray border
      },
    },
    
    card: {
      background: '#111111',          // Dark card background
      border: '#27272a',              // Dark border
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1)',
    },
    
    input: {
      background: '#1a1a1a',          // Dark input background
      border: '#3f3f46',              // Medium gray border
      borderFocus: '#8b5cf6',         // Purple focus border
      text: '#ffffff',                // White text
      placeholder: '#71717a',         // Medium gray placeholder
    },
  },
};
