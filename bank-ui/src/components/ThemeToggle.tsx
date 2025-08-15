import React from 'react';
import { IconButton, Tooltip, Box, SxProps, Theme } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme, useThemeValues } from '../theme';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  sx?: SxProps<Theme>;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium',
  className,
  sx 
}) => {
  const { mode, toggleTheme } = useTheme();
  const theme = useThemeValues();

  return (
    <Box className={className} sx={sx}>
      <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
        <IconButton
          onClick={toggleTheme}
          size={size}
          sx={{
            color: theme.colors.text.primary,
            backgroundColor: 'transparent',
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: '50%',
            transition: 'all 0.2s ease-in-out',
            boxShadow: mode === 'dark' ? '0 2px 4px rgba(255, 255, 255, 0.1)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              backgroundColor: theme.colors.action.hover,
              borderColor: theme.colors.border.strong,
              transform: 'scale(1.05)',
              boxShadow: mode === 'dark' ? '0 4px 8px rgba(255, 255, 255, 0.15)' : '0 4px 8px rgba(0, 0, 0, 0.15)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}
          aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mode === 'dark' ? (
            <LightMode 
              sx={{ 
                color: theme.colors.text.primary,
                fontSize: '1.2rem',
                transition: 'transform 0.2s ease-in-out',
              }} 
            />
          ) : (
            <DarkMode 
              sx={{ 
                color: theme.colors.text.primary,
                fontSize: '1.2rem',
                transition: 'transform 0.2s ease-in-out',
              }} 
            />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
};
