import React from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';

interface GradientBackgroundProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'subtle';
  sx?: any;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ 
  children, 
  variant = 'primary',
  sx = {} 
}) => {
  const { theme, mode } = useTheme();
  
  // Create gradients using theme colors
  const getGradient = (variant: string) => {
    const bg = theme.colors.background;
    const primary = theme.colors.primary;
    const secondary = theme.colors.secondary;
    
    if (mode === 'dark') {
      switch (variant) {
        case 'primary':
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.surface} 25%, ${primary[500]} 50%, ${primary[700]} 75%, ${primary[900]} 100%)`;
        case 'secondary':
          return `linear-gradient(135deg, ${bg.surface} 0%, ${secondary[950]} 25%, ${secondary[800]} 50%, ${secondary[700]} 75%, ${bg.surface} 100%)`;
        case 'subtle':
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.surface} 20%, ${bg.default} 100%)`;
        default:
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.surface} 25%, ${primary[500]} 50%, ${primary[700]} 75%, ${primary[900]} 100%)`;
      }
    } else {
      // Light mode: DRAMATIC monochromatic whites, grays, and blacks
      switch (variant) {
        case 'primary':
          return `linear-gradient(135deg,rgb(40, 29, 29) 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%,rgb(54, 54, 54) 100%)`;
        case 'secondary':
          return `linear-gradient(135deg, #f8fafc 0%, #cbd5e1 25%, #94a3b8 50%, #64748b 75%, #e2e8f0 100%)`;
        case 'subtle':
          return `linear-gradient(135deg, #ffffff 0%, #e2e8f0 20%, #cbd5e1 40%, #94a3b8 100%)`;
        default:
          return `linear-gradient(135deg, #ffffff 0%, #e2e8f0 25%, #cbd5e1 50%, #94a3b8 75%, #64748b 100%)`;
      }
    }
  };

  const currentGradient = getGradient(variant);

  // Create accent gradients using theme colors
  const getAccentGradients = () => {
    const secondary = theme.colors.secondary;
    const primary = theme.colors.primary; // Add missing primary declaration
    
    if (mode === 'dark') {
      const purple1 = secondary[600]; // #7c3aed
      const purple2 = secondary[500]; // #8b5cf6
      return `radial-gradient(circle at 20% 80%, ${purple1}1A 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${purple2}1A 0%, transparent 50%)`;
    } else {
      // Light mode: Subtle accents WITHOUT glare effect
      return `radial-gradient(circle at 20% 80%, rgba(0, 0, 0, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0, 0, 0, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.04) 0%, transparent 40%)`;
    }
  };

  return (
    <Box
      sx={{
        background: currentGradient,
        minHeight: '100vh',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: getAccentGradients(),
          pointerEvents: 'none',
        },
        ...sx
      }}
    >
      {children}
    </Box>
  );
};
