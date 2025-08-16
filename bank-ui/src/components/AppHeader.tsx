import React from 'react';
import { Box, Typography } from '@mui/material';
import { MidnightLogo } from './MidnightLogo';
import { useTheme } from '../theme/ThemeProvider';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  logoSize?: number;
  sx?: any;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  title = "Midnight Bank",
  subtitle,
  logoSize = 80,
  sx = {} 
}) => {
  const { theme, mode } = useTheme();
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing[6],
        mb: theme.spacing[8],
        position: 'relative',
        zIndex: 1,
        ...sx
      }}
    >
      {/* Logo with subtle glow effect */}
      <Box
        sx={{
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: logoSize + 40,
            height: logoSize + 40,
            borderRadius: '50%',
            background: mode === 'dark' 
              ? 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(0, 0, 0, 0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }
        }}
      >
        <MidnightLogo 
          width={logoSize} 
          height={logoSize}
          sx={{
            filter: mode === 'dark' 
              ? 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.2))'
              : 'drop-shadow(0 0 20px rgba(0, 0, 0, 0.1))',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              filter: mode === 'dark' 
                ? 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.3))'
                : 'drop-shadow(0 0 30px rgba(0, 0, 0, 0.15))',
            }
          }}
        />
      </Box>

      {/* Title with gradient text */}
      <Box textAlign="center">
        <Typography
          variant="h1"
          sx={{
            fontSize: {
              xs: theme.typography.fontSize['3xl'],
              sm: theme.typography.fontSize['4xl'],
              md: theme.typography.fontSize['5xl'],
            },
            fontWeight: theme.typography.fontWeight.bold,
            background: mode === 'dark'
              ? `linear-gradient(135deg, ${theme.colors.text.primary} 0%, ${theme.colors.primary[300]} 50%, ${theme.colors.primary[400]} 100%)`
              : `linear-gradient(135deg, ${theme.colors.primary[500]} 0%, ${theme.colors.primary[700]} 50%, ${theme.colors.primary[900]} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            letterSpacing: '-0.025em',
            mb: subtitle ? theme.spacing[2] : 0,
          }}
        >
          {title}
        </Typography>
        
        {subtitle && (
          <Typography
            variant="h6"
            sx={{
              color: theme.colors.text.secondary,
              fontWeight: theme.typography.fontWeight.medium,
              opacity: 0.8,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
};
