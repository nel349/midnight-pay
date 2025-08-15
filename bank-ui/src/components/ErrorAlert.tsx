import React from 'react';
import {
  Alert,
  AlertTitle,
  Typography,
  Box,
  Collapse,
  IconButton,
} from '@mui/material';
import { Close, ExpandMore, ExpandLess } from '@mui/icons-material';
import { parseError, formatErrorMessage, type ParsedError } from '../utils/errorHandling';

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
  const [expanded, setExpanded] = React.useState(false);
  
  if (!error) return null;

  const parsedError: ParsedError = parseError(error);
  const hasDetails = showDetails && (error.stack || error.code || error.reason);

  return (
    <Alert 
      severity={parsedError.severity}
      sx={{ width: '100%', ...sx }}
      action={
        onClose && (
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={onClose}
          >
            <Close fontSize="inherit" />
          </IconButton>
        )
      }
    >
      <AlertTitle sx={{ fontWeight: 'bold' }}>
        {parsedError.title}
      </AlertTitle>
      
      <Typography variant="body2" sx={{ mb: parsedError.action ? 1 : 0 }}>
        {parsedError.message}
      </Typography>
      
      {parsedError.action && (
        <Typography variant="body2" sx={{ fontWeight: 'medium', color: 'text.secondary' }}>
          {parsedError.action}
        </Typography>
      )}

      {hasDetails && (
        <Box sx={{ mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ p: 0.5, color: 'text.secondary' }}
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
                backgroundColor: 'rgba(0,0,0,0.1)', 
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
  );
};

export default ErrorAlert;
