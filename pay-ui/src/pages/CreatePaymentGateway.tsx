import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircularProgress,
  TextField,
  Typography,
  Box,
  Alert
} from '@mui/material';
import { ArrowBack, Payment } from '@mui/icons-material';
import { usePaymentWallet } from '../components/PaymentWallet';
import {
  ThemedButton,
  ThemedCard,
  ThemedCardContent,
  ErrorAlert,
  GradientBackground
} from '../components';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { useTheme } from '../theme';
import { useNotification } from '../contexts/NotificationContext';

export interface CreatePaymentGatewayProps {
  onComplete: (contractAddress: string) => void;
}

export const CreatePaymentGateway: React.FC<CreatePaymentGatewayProps> = ({ onComplete }) => {
  const navigate = useNavigate();
  const { isConnected, connect } = usePaymentWallet();
  const { deployNewGateway, isDeploying, error } = usePaymentContract();
  const { theme } = useTheme();
  const { showSuccess, showError } = useNotification();

  const [gatewayLabel, setGatewayLabel] = useState('');
  const [localError, setLocalError] = useState<any>(null);

  const onDeployGateway = useCallback(async () => {
    try {
      setLocalError(null);

      console.log('🚀 Starting gateway deployment...');
      const contractAddress = await deployNewGateway(gatewayLabel.trim() || 'Payment Gateway');

      console.log('✅ Gateway deployed successfully:', contractAddress);
      showSuccess(`Payment Gateway "${gatewayLabel || 'Payment Gateway'}" deployed successfully!`);

      // Small delay to allow notification to show before navigation
      setTimeout(() => {
        onComplete(contractAddress);
      }, 1500);
    } catch (e) {
      console.error('❌ Gateway deployment failed:', e);
      setLocalError(e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown deployment error';
      showError(`Failed to deploy payment gateway: ${errorMessage}`);
    }
  }, [deployNewGateway, gatewayLabel, onComplete, showSuccess, showError]);

  const displayError = error || localError;

  return (
    <GradientBackground>
      <Box sx={{ minHeight: '100vh', p: 4 }}>
        {/* Header */}
        <Box sx={{ maxWidth: 800, margin: '0 auto', mb: 6 }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 4,
          }}>
            <ThemedButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/gateways')}
              disabled={isDeploying}
              sx={{
                textTransform: 'none',
              }}
            >
              Back to Gateways
            </ThemedButton>

            {/* Centered Title */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 'bold',
                textAlign: 'center',
                flex: 1,
                mx: 4,
              }}
            >
              💳 Create Payment Gateway
            </Typography>

            {/* Spacer to balance the layout */}
            <Box sx={{ width: '120px' }} />
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Main Content */}
          <ThemedCard>
            <ThemedCardContent sx={{ p: 6 }}>

              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  mb: 4,
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                Deploy a new Midnight Payment Gateway contract. This will create a secure payment processing
                environment for merchants and customers with privacy-preserving subscription management.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!isConnected && (
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      Please connect your Lace wallet to deploy a new payment gateway contract.
                    </Typography>
                    <ThemedButton
                      variant="outlined"
                      onClick={() => void connect()}
                      disabled={isDeploying}
                      sx={{ mt: 2 }}
                    >
                      {isDeploying ? <CircularProgress size={16} /> : 'Connect Lace Wallet'}
                    </ThemedButton>
                  </Alert>
                )}

                <TextField
                  label="Gateway Name (Optional)"
                  placeholder="e.g., Store Payment Gateway, Business Gateway"
                  value={gatewayLabel}
                  onChange={(e) => setGatewayLabel(e.target.value)}
                  fullWidth
                  helperText="A friendly name to identify your payment gateway"
                  disabled={isDeploying}
                />

                <Alert severity="info" sx={{ width: '100%' }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Deploying a payment gateway contract will incur blockchain transaction costs.
                    After deployment, merchants can register to accept payments and customers can subscribe to services.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <ThemedButton
                    variant="primary"
                    startIcon={isDeploying ? <CircularProgress size={16} /> : <Payment />}
                    onClick={onDeployGateway}
                    disabled={!isConnected || isDeploying}
                    size="large"
                    sx={{
                      minWidth: 250,
                      py: 3,
                      px: 6,
                    }}
                  >
                    {isDeploying ? 'Deploying Gateway...' : 'Deploy Payment Gateway'}
                  </ThemedButton>
                </Box>

                <ErrorAlert
                  error={displayError}
                  onClose={() => {
                    setLocalError(null);
                  }}
                  showDetails={true}
                />
              </Box>
            </ThemedCardContent>
          </ThemedCard>
        </Box>
      </Box>
    </GradientBackground>
  );
};

export default CreatePaymentGateway;