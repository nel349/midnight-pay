import React, { useState } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { 
  Navigation, 
  NotificationsActive, 
  AssignmentTurnedIn, 
  History, 
  Security, 
  Close,
  AccountBalance
} from '@mui/icons-material';
import { useTheme } from '../theme/ThemeProvider';
import { ThemedCard } from './ThemedCard';

interface NavigationItem {
  icon: React.ReactElement;
  label: string;
  action: () => void;
  color: string;
}

interface SmartNavigationPanelProps {
  /** Whether the panel is visible */
  visible?: boolean;
  /** Whether the panel starts expanded */
  defaultExpanded?: boolean;
  /** Callback when panel visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Navigation items configuration */
  navigationItems: NavigationItem[];
  /** Custom positioning */
  position?: {
    right?: number | string;
    top?: number | string;
    transform?: string;
  };
}

export const SmartNavigationPanel: React.FC<SmartNavigationPanelProps> = ({
  visible = true,
  defaultExpanded = false,
  onVisibilityChange,
  navigationItems,
  position = {
    right: '24px',
    top: '50%',
    transform: 'translateY(-50%)'
  }
}) => {
  const { theme, mode } = useTheme();
  const [showPanel, setShowPanel] = useState(visible);
  const [expandedPanel, setExpandedPanel] = useState(defaultExpanded);

  const handleVisibilityChange = (newVisible: boolean) => {
    setShowPanel(newVisible);
    onVisibilityChange?.(newVisible);
  };

  if (!showPanel) {
    return (
      <Box
        sx={{
          position: 'fixed',
          right: position.right,
          top: position.top === '50%' ? theme.spacing[4] : position.top,
          zIndex: 1000,
        }}
      >
        <ThemedCard
          sx={{
            p: theme.spacing[2],
            boxShadow: theme.shadows.lg,
            border: `1px solid ${theme.colors.border.light}`,
          }}
        >
          <Box
            onClick={() => handleVisibilityChange(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing[1],
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          >
            <Navigation 
              sx={{ 
                fontSize: '1.2rem',
                color: theme.colors.primary[500]
              }} 
            />
            <Typography
              variant="body2"
              sx={{
                color: theme.colors.text.primary,
                fontWeight: theme.typography.fontWeight.medium,
                fontSize: '0.875rem',
              }}
            >
              Quick Nav
            </Typography>
          </Box>
        </ThemedCard>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: position.right,
        top: position.top,
        transform: position.transform,
        zIndex: 1000,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Navigation Panel */}
      <ThemedCard
        sx={{
          p: theme.spacing[2],
          minWidth: expandedPanel ? 200 : 60,
          transition: 'all 0.3s ease',
          boxShadow: theme.shadows.lg,
          border: `1px solid ${theme.colors.border.light}`,
        }}
      >
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: expandedPanel ? theme.spacing[2] : 0
        }}>
          {expandedPanel && (
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
                fontSize: '0.875rem'
              }}
            >
              Quick Navigation
            </Typography>
          )}
          <IconButton
            size="small"
            onClick={() => setExpandedPanel(!expandedPanel)}
            sx={{ 
              color: theme.colors.text.secondary,
              ml: expandedPanel ? theme.spacing[1] : 0
            }}
          >
            <Navigation sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>

        {/* Navigation Items */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: theme.spacing[1] 
        }}>
          {navigationItems.map((item, index) => (
            <Box
              key={index}
              onClick={item.action}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                p: theme.spacing[1],
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.05)',
                  transform: 'translateX(-2px)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: `${item.color}20`,
                  color: item.color,
                }}
              >
                {React.cloneElement(item.icon as React.ReactElement<any>, { sx: { fontSize: '1.1rem' } })}
              </Box>
              
              {expandedPanel && (
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.colors.text.primary,
                    fontWeight: theme.typography.fontWeight.medium,
                    fontSize: '0.8rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label}
                </Typography>
              )}
            </Box>
          ))}
        </Box>

        {/* Divider and Close Button */}
        {expandedPanel && (
          <>
            <Box 
              sx={{ 
                height: '1px',
                backgroundColor: theme.colors.border.light,
                my: theme.spacing[2],
              }} 
            />
            <Box
              onClick={() => handleVisibilityChange(false)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing[2],
                p: theme.spacing[1],
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.05)' 
                    : 'rgba(0, 0, 0, 0.05)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: `${theme.colors.error[500]}20`,
                  color: theme.colors.error[500],
                }}
              >
                <Close sx={{ fontSize: '1.1rem' }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  color: theme.colors.text.secondary,
                  fontWeight: theme.typography.fontWeight.medium,
                  fontSize: '0.8rem',
                }}
              >
                Hide Panel
              </Typography>
            </Box>
          </>
        )}
      </ThemedCard>
    </Box>
  );
};
