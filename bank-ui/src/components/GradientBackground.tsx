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
      switch (variant) {
        case 'primary':
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.paper} 25%, ${bg.surface} 50%, ${bg.elevated} 75%, ${theme.colors.border.strong} 100%)`;
        case 'secondary':
          return `linear-gradient(135deg, ${bg.paper} 0%, ${bg.surface} 25%, ${bg.elevated} 50%, ${theme.colors.border.strong} 75%, ${bg.paper} 100%)`;
        case 'subtle':
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.paper} 20%, ${bg.default} 100%)`;
        default:
          return `linear-gradient(135deg, ${bg.default} 0%, ${bg.paper} 25%, ${bg.surface} 50%, ${bg.elevated} 75%, ${theme.colors.border.strong} 100%)`;
      }
    }
  };

  const currentGradient = getGradient(variant);

  // Create accent gradients using theme colors
  const getAccentGradients = () => {
    const secondary = theme.colors.secondary;
    
    if (mode === 'dark') {
      const purple1 = secondary[600]; // #7c3aed
      const purple2 = secondary[500]; // #8b5cf6
      return `radial-gradient(circle at 20% 80%, ${purple1}1A 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${purple2}1A 0%, transparent 50%)`;
    } else {
      const purple1 = secondary[500]; // #8b5cf6
      const purple2 = secondary[600]; // #7c3aed
      return `radial-gradient(circle at 20% 80%, ${purple1}0D 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${purple2}0D 0%, transparent 50%)`;
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
