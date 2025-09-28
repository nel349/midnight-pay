import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Button,
  Divider
} from '@mui/material';
import {
  Add,
  Launch,
  Payment,
  AccessTime,
  ContentCopy
} from '@mui/icons-material';
import {
  ThemedButton,
  ThemedCard,
  ThemedCardContent,
  GradientBackground,
  AppHeader
} from '../components';
import { useTheme } from '../theme';
import { listPaymentGateways, type SavedPaymentGateway, touchPaymentGateway } from '../utils/PaymentLocalState';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { useNotification } from '../contexts/NotificationContext';

export const PaymentGateways: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { connectToGateway, clearContract } = usePaymentContract();
  const { showSuccess, showError } = useNotification();
  const [gateways, setGateways] = useState<SavedPaymentGateway[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    // Load gateways from storage
    setGateways(listPaymentGateways());
  }, []);

  const handleConnectGateway = async (gateway: SavedPaymentGateway) => {
    try {
      setConnecting(gateway.contractAddress);

      console.log('🔗 Connecting to gateway:', gateway.contractAddress);

      // Clear any existing contract state
      clearContract();

      // Connect to the gateway
      await connectToGateway(gateway.contractAddress, gateway.label);

      // Touch the gateway to update lastUsedAt
      touchPaymentGateway(gateway.contractAddress);

      console.log('✅ Successfully connected to gateway');
      showSuccess(`Connected to "${gateway.label || 'Payment Gateway'}" successfully!`);

      // Navigate to merchant dashboard after a short delay
      setTimeout(() => {
        navigate('/merchant');
      }, 1000);

    } catch (error) {
      console.error('❌ Failed to connect to gateway:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      showError(`Failed to connect to gateway: ${errorMessage}`);
    } finally {
      setConnecting(null);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      showSuccess('Contract address copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy address:', error);
      showError('Failed to copy address to clipboard');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <GradientBackground>
      <AppHeader />
      <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 4 }}>

        {/* Header */}
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              textAlign: 'center'
            }}
          >
            💳 Payment Gateways
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              maxWidth: 600,
              margin: '0 auto'
            }}
          >
            Manage your Midnight Payment Gateways. Deploy new gateways or connect to existing ones
            to start processing secure, privacy-preserving payments.
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 6 }}>
          <ThemedButton
            variant="primary"
            size="large"
            startIcon={<Add />}
            onClick={() => navigate('/create-gateway')}
            sx={{ px: 4, py: 2 }}
          >
            Create New Gateway
          </ThemedButton>
          <ThemedButton
            variant="outlined"
            size="large"
            startIcon={<Launch />}
            onClick={() => navigate('/join-gateway')}
            sx={{ px: 4, py: 2 }}
          >
            Join Existing Gateway
          </ThemedButton>
        </Box>

        {/* Gateways List */}
        {gateways.length === 0 ? (
          <ThemedCard sx={{ maxWidth: 600, margin: '0 auto' }}>
            <ThemedCardContent sx={{ textAlign: 'center', py: 8 }}>
              <Payment sx={{ fontSize: 80, color: 'text.secondary', mb: 3 }} />
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'medium' }}>
                No Payment Gateways Found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                You haven't connected to any payment gateways yet. Create a new gateway
                or join an existing one to get started.
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center">
                <ThemedButton
                  variant="primary"
                  startIcon={<Add />}
                  onClick={() => navigate('/create-gateway')}
                >
                  Create Gateway
                </ThemedButton>
                <ThemedButton
                  variant="outlined"
                  startIcon={<Launch />}
                  onClick={() => navigate('/join-gateway')}
                >
                  Join Gateway
                </ThemedButton>
              </Stack>
            </ThemedCardContent>
          </ThemedCard>
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {gateways.map((gateway) => (
              <Box
                key={gateway.contractAddress}
                sx={{
                  flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)', lg: '1 1 calc(33.333% - 16px)' },
                  minWidth: 300
                }}
              >
                <ThemedCard
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <ThemedCardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 'bold',
                            mb: 1,
                            wordBreak: 'break-word'
                          }}
                        >
                          {gateway.label || 'Payment Gateway'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              color: 'text.secondary',
                              mr: 1
                            }}
                          >
                            {formatAddress(gateway.contractAddress)}
                          </Typography>
                          <Button
                            size="small"
                            onClick={() => handleCopyAddress(gateway.contractAddress)}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            <ContentCopy sx={{ fontSize: 16 }} />
                          </Button>
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Created: {formatDate(gateway.createdAt)}
                        </Typography>
                      </Box>
                      {gateway.lastUsedAt && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Last used: {formatDate(gateway.lastUsedAt)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <ThemedButton
                      variant="primary"
                      fullWidth
                      startIcon={<Launch />}
                      onClick={() => handleConnectGateway(gateway)}
                      disabled={connecting === gateway.contractAddress}
                    >
                      {connecting === gateway.contractAddress ? 'Connecting...' : 'Connect'}
                    </ThemedButton>
                  </ThemedCardContent>
                </ThemedCard>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </GradientBackground>
  );
};