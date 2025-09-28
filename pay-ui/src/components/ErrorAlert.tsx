import React from 'react';
import {
  Alert,
  AlertTitle,
  Typography,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { parseError, type ParsedError } from '../utils/errorHandling';

export interface ErrorAlertProps {
  error: any;
  onClose?: () => void;
  showDetails?: boolean;
  sx?: any;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  error, 
  onClose, 
  showDetails = false,
  sx 
}) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);
  
  if (!error) return null;

  const parsedError: ParsedError = parseError(error);
  const hasDetails = showDetails && (error.stack || error.code || error.reason);

  return (
    <Box sx={{ position: 'relative', width: '100%', ...sx }}>
      <Alert 
        severity={parsedError.severity}
        sx={{ width: '100%' }}
      >
        {onClose && (
          <button
            onClick={onClose}
            aria-label="close"
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: theme.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
              border: `1px solid ${theme.theme.colors.border.default}`,
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              color: theme.theme.colors.text.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              zIndex: 9999
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(0, 0, 0, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = theme.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.1)';
            }}
          >
            ×
          </button>
        )}
      <AlertTitle sx={{ fontWeight: 'bold' }}>
        {parsedError.title}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: parsedError.action ? 1 : 0 }}>
        {parsedError.message}
      </Typography>
      
      {parsedError.action && (
        <Typography variant="body2" sx={{ fontWeight: 'medium', color: theme.theme.colors.text.secondary }}>
          {parsedError.action}
        </Typography>
      )}

      {hasDetails && (
        <Box sx={{ mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ p: 0.5, color: theme.theme.colors.text.secondary }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
            <Typography variant="caption" sx={{ ml: 0.5 }}>
              {expanded ? 'Hide Details' : 'Show Details'}
            </Typography>
          </IconButton>
          
          <Collapse in={expanded}>
            <Box 
              sx={{ 
                mt: 1, 
                p: 1, 
                backgroundColor: theme.theme.colors.background.elevated, 
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: 200
              }}
            >
              {error.code && (
                <Typography variant="caption" component="div">
                  <strong>Code:</strong> {error.code}
                </Typography>
              )}
              {error.reason && (
                <Typography variant="caption" component="div">
                  <strong>Reason:</strong> {error.reason}
                </Typography>
              )}
              {error.stack && (
                <Typography variant="caption" component="div">
                  <strong>Stack:</strong> {error.stack}
                </Typography>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;
