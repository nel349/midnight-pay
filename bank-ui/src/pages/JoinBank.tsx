import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Alert
} from '@mui/material';
import { ArrowBack, Launch } from '@mui/icons-material';
import { saveBank } from '../utils/AccountsLocalState';
import { ErrorAlert } from '../components/ErrorAlert';
import { 
  ThemedButton,
  ThemedCard,
  ThemedCardContent,
  GradientBackground,
  ThemeToggle
} from '../components';
import { useTheme } from '../theme/ThemeProvider';

export const JoinBank: React.FC = () => {
  const navigate = useNavigate();
  const { theme, mode } = useTheme();
  const [contractAddress, setContractAddress] = useState('');
  const [bankLabel, setBankLabel] = useState('');
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinBank = async () => {
    if (!contractAddress.trim()) {
      setError('Please enter a bank contract address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Basic validation - check if it looks like a valid address
      if (contractAddress.length < 10) {
        throw new Error('Invalid contract address format');
      }

      // Save bank to local storage
      saveBank({
        contractAddress: contractAddress.trim(),
        label: bankLabel.trim() || undefined,
        createdAt: new Date().toISOString()
      });

      // Navigate to the bank page
      navigate(`/bank/${contractAddress.trim()}`);

    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  return (
    <GradientBackground variant="subtle">
      {/* Theme Toggle in top-right corner */}
      <ThemeToggle 
        sx={{ 
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 1000,
        }} 
      />
      
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: theme.spacing[4] }}>
        <ThemedCard sx={{ maxWidth: 600, width: '100%' }}>
          <ThemedCardContent sx={{ p: theme.spacing[6] }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: theme.spacing[4] }}>
              <ThemedButton
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/accounts')}
                sx={{ mr: theme.spacing[3] }}
              >
                Back to Accounts
              </ThemedButton>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  flexGrow: 1,
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                }}
              >
                🏦 Join Existing Bank
              </Typography>
            </Box>

            <Typography 
              variant="body1" 
              sx={{ 
                color: theme.colors.text.secondary, 
                mb: theme.spacing[4],
                lineHeight: 1.6,
              }}
            >
              Enter the contract address of an existing Midnight Bank to join it. 
              You'll be able to create accounts and manage banking operations within this bank.
            </Typography>

            <Box display="flex" flexDirection="column" gap={theme.spacing[4]}>
              <TextField
                label="Bank Contract Address"
                placeholder="0x123abc..."
                fullWidth
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                helperText="The deployed contract address of the bank you want to join"
                sx={{ 
                  '& .MuiInputBase-input': {
                    fontFamily: theme.typography.fontFamily.mono,
                  }
                }}
              />

              <TextField
                label="Bank Label (Optional)"
                placeholder="e.g., Family Bank, Company Bank"
                fullWidth
                value={bankLabel}
                onChange={(e) => setBankLabel(e.target.value)}
                helperText="A friendly name to identify this bank"
              />

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> Joining a bank only adds it to your local list. 
                  You'll still need to create accounts within the bank to start banking operations.
                </Typography>
              </Alert>

              <ThemedButton
                variant="primary"
                startIcon={<Launch />}
                onClick={handleJoinBank}
                disabled={loading || !contractAddress.trim()}
                size="large"
                fullWidth
              >
                {loading ? 'Joining Bank...' : 'Join Bank'}
              </ThemedButton>

              <ErrorAlert 
                error={error}
                onClose={() => setError(null)}
              />
            </Box>
          </ThemedCardContent>
        </ThemedCard>
      </Box>
    </GradientBackground>
  );
};