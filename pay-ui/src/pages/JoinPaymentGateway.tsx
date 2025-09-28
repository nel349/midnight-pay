import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  TextField,
  Alert
} from '@mui/material';
import { ArrowBack, Launch } from '@mui/icons-material';
import { ErrorAlert } from '../components/ErrorAlert';
import {
  ThemedButton,
  ThemedCard,
  ThemedCardContent,
  GradientBackground
} from '../components';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { useTheme } from '../theme';

export const JoinPaymentGateway: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { connectToGateway, isInitializing, error } = usePaymentContract();
  const [contractAddress, setContractAddress] = useState('');
  const [gatewayLabel, setGatewayLabel] = useState('');
  const [localError, setLocalError] = useState<any>(null);

  const handleJoinGateway = async () => {
    if (!contractAddress.trim()) {
      setLocalError(new Error('Please enter a payment gateway contract address'));
      return;
    }

    try {
      setLocalError(null);

      await connectToGateway(
        contractAddress.trim(),
        gatewayLabel.trim() || 'Payment Gateway'
      );

      // Navigate to the gateway page
      navigate(`/gateway/${contractAddress.trim()}`);

    } catch (err) {
      setLocalError(err);
    }
  };

  const displayError = error || localError;

  return (
    <GradientBackground>
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <ThemedCard sx={{ maxWidth: 600, width: '100%' }}>
          <ThemedCardContent sx={{ p: 6 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <ThemedButton
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate('/gateways')}
                sx={{ mr: 3 }}
              >
                Back to Gateways
              </ThemedButton>
              <Typography
                variant="h4"
                component="h1"
                sx={{
                  flexGrow: 1,
                  fontWeight: 'bold',
                }}
              >
                💳 Join Payment Gateway
              </Typography>
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              Enter the contract address of an existing Midnight Payment Gateway to join it.
              You'll be able to register as a merchant or subscribe as a customer within this gateway.
            </Typography>

            <Box display="flex" flexDirection="column" gap={4}>
              <TextField
                label="Gateway Contract Address"
                placeholder="0x123abc..."
                fullWidth
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                helperText="The deployed contract address of the payment gateway you want to join"
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                  }
                }}
              />

              <TextField
                label="Gateway Label (Optional)"
                placeholder="e.g., Store Gateway, Business Gateway"
                fullWidth
                value={gatewayLabel}
                onChange={(e) => setGatewayLabel(e.target.value)}
                helperText="A friendly name to identify this payment gateway"
              />

              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Note:</strong> Joining a payment gateway only adds it to your local list.
                  You'll still need to register as a merchant or customer to start using payment services.
                </Typography>
              </Alert>

              <ThemedButton
                variant="primary"
                startIcon={<Launch />}
                onClick={handleJoinGateway}
                disabled={isInitializing || !contractAddress.trim()}
                size="large"
                fullWidth
              >
                {isInitializing ? 'Joining Gateway...' : 'Join Payment Gateway'}
              </ThemedButton>

              <ErrorAlert
                error={displayError}
                onClose={() => setLocalError(null)}
              />
            </Box>
          </ThemedCardContent>
        </ThemedCard>
      </Box>
    </GradientBackground>
  );
};