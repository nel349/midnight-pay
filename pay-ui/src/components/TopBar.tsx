import React from 'react';
import { Box, AppBar, Toolbar } from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';
import { ThemeToggle } from './ThemeToggle';

interface TopBarProps {
  children?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ children }) => {
  const { mode } = useTheme();
  
  // Use white logo for dark mode, black logo for light mode
  const logoSrc = mode === 'dark' 
    ? '/assets/midnight-logo-white.svg' 
    : '/assets/midnight-logo-black.svg';
  
  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'transparent',
        boxShadow: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
        {/* Left side - Midnight logo */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={logoSrc} 
            alt="Midnight Network" 
            style={{ 
              height: '32px',
              width: 'auto'
            }}
          />
        </Box>
        
        {/* Center - can be used for navigation or title */}
        <Box sx={{ flex: 1, px: 3 }}>
          {children}
        </Box>
        
        {/* Right side - Theme toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ThemeToggle size="small" />
        </Box>
      </Toolbar>
    </AppBar>
  );
};