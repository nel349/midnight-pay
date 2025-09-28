import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  CircularProgress,
  Fade,
} from '@mui/material';
import { useTheme } from '../theme/ThemeProvider';
import { midnightFacts } from '../misc/facts';

interface TransactionLoadingModalProps {
  isOpen: boolean;
  operationType: string;
  statusMessage?: string;
}

const TransactionLoadingModal: React.FC<TransactionLoadingModalProps> = ({
  isOpen,
  operationType,
  statusMessage = 'Processing transaction...'
}) => {
  const theme = useTheme();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isFactVisible, setIsFactVisible] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Start fade out animation
      setIsFactVisible(false);
      
      // After fade out completes, change fact and fade in
      setTimeout(() => {
        setCurrentFactIndex((prev) => (prev + 1) % midnightFacts.length);
        setIsFactVisible(true);
      }, 300); // Quick fade out
    }, 10000); // Change fact every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset fact when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentFactIndex(Math.floor(Math.random() * midnightFacts.length)); // Start with random fact
      setIsFactVisible(true);
    }
  }, [isOpen]);

  const currentFact = midnightFacts[currentFactIndex];

  return (
    <Dialog 
      open={isOpen} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${theme.theme.colors.background.paper} 0%, ${theme.theme.colors.background.elevated} 50%, ${theme.theme.colors.background.surface} 100%)`,
          color: theme.theme.colors.text.primary,
          border: `1px solid ${theme.theme.colors.border.default}`,
          boxShadow: theme.theme.shadows.lg,
        }
      }}
    >
      <DialogContent sx={{ p: 6, textAlign: 'center' }}>
        {/* Header with spinner */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
            <CircularProgress 
              size={80} 
              thickness={2}
              sx={{ 
                color: theme.theme.colors.text.secondary,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                }
              }} 
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography 
                variant="h4" 
                component="div" 
                sx={{ 
                  fontSize: '2rem',
                  background: `linear-gradient(45deg, ${theme.theme.colors.text.secondary}, ${theme.theme.colors.text.inverse})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                🏦
              </Typography>
            </Box>
          </Box>
          
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 'bold', 
              mb: 1,
              background: `linear-gradient(45deg, ${theme.theme.colors.text.primary}, ${theme.theme.colors.text.secondary})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {operationType}
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.theme.colors.text.secondary,
              fontWeight: 500
            }}
          >
            {statusMessage}
          </Typography>
        </Box>

        {/* Rotating Facts */}
        <Box sx={{ 
          minHeight: 120, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 3,
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 2,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 4
        }}>
          <Fade in={isFactVisible} timeout={300}>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.theme.colors.text.primary,
                  fontWeight: 'bold',
                  mb: 2,
                  fontSize: '1.1rem'
                }}
              >
                💡 Did you know?
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.theme.colors.text.secondary,
                  lineHeight: 1.6,
                  fontStyle: 'italic'
                }}
              >
                {currentFact}
              </Typography>
            </Box>
          </Fade>
        </Box>

        {/* Progress indicator */}
        <Box sx={{ position: 'relative', mt: 2 }}>
          <Box
            sx={{
              height: 4,
              bgcolor: theme.theme.colors.background.surface,
              borderRadius: 2,
              overflow: 'hidden',
              mb: 2
            }}
          >
            <Box
              sx={{
                height: '100%',
                background: `linear-gradient(90deg, ${theme.theme.colors.text.primary}, ${theme.theme.colors.text.secondary}, ${theme.theme.colors.text.primary})`,
                borderRadius: 2,
                animation: 'progress 2s ease-in-out infinite',
                '@keyframes progress': {
                  '0%': { transform: 'translateX(-100%)' },
                  '50%': { transform: 'translateX(0%)' },
                  '100%': { transform: 'translateX(100%)' }
                },
              }}
            />
          </Box>
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.theme.colors.text.secondary,
              fontSize: '0.9rem'
            }}
          >
            Securing your transaction with zero-knowledge proofs...
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionLoadingModal;