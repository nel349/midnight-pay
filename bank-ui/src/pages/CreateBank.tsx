import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CircularProgress, 
  TextField, 
  Typography, 
  Box,
  Alert 
} from '@mui/material';
import { ArrowBack, AccountBalance } from '@mui/icons-material';
import type { Logger } from 'pino';
import { BankAPI } from '@midnight-bank/bank-api';
import { useBankWallet } from '../components/BankWallet';
import { 
  ThemedButton, 
  ThemedCard, 
  ThemedCardContent, 
  ErrorAlert,
  GradientBackground
} from '../components';
import { saveBank } from '../utils/AccountsLocalState';
import { getErrorSummary } from '../utils/errorHandling';
import { useTheme } from '../theme/ThemeProvider';
import { useTransactionLoading } from '../contexts/TransactionLoadingContext';

export interface CreateBankProps { 
  logger: Logger; 
  onComplete: (contractAddress: string) => void;
}

export const CreateBank: React.FC<CreateBankProps> = ({ logger, onComplete }) => {
  const navigate = useNavigate();
  const { providers, isConnected, connect } = useBankWallet();
  const { theme, mode } = useTheme();
  const { setTransactionLoading } = useTransactionLoading();
  
  const [bankLabel, setBankLabel] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<any>(null);

  const onDeployBank = useCallback(async () => {
    logger.info('onDeployBank: Starting bank deployment...');
    try {
      setWorking(true);
      setError(null);
      setTransactionLoading(true, 'Bank Deployment');
      
      // Generate a unique ID for the bank contract
      const contractAddress = await BankAPI.deploy(providers, logger);
      
      logger.info({ 
        event: 'bank_deployed', 
        address: contractAddress,
        label: bankLabel 
      });
      
      // Save bank to local storage
      saveBank({
        contractAddress,
        label: bankLabel.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      
      // Store deployment info for debugging if needed
      sessionStorage.setItem('lastBankDeployment', JSON.stringify({ contractAddress, label: bankLabel, timestamp: new Date().toISOString() }));
      
      onComplete(contractAddress);
    } catch (e) {
      // Log with user-friendly summary for readability
      logger.error({ 
        error: e,
        summary: getErrorSummary(e),
        context: 'bank_deployment_failed'
      }, 'Failed to deploy bank contract');
      
      // Store the full error object for ErrorAlert to parse
      setError(e);
    } finally {
      setWorking(false);
      setTransactionLoading(false);
    }
  }, [providers, logger, bankLabel, onComplete, setTransactionLoading]);

  return (
    <GradientBackground variant="subtle">
      <Box sx={{ minHeight: '100vh', p: theme.spacing[4] }}>
        {/* Header */}
        <Box sx={{ maxWidth: 800, margin: '0 auto', mb: theme.spacing[6] }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: theme.spacing[4],
          }}>
            <ThemedButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/accounts')}
              disabled={working}
              sx={{ 
                textTransform: 'none',
                borderRadius: theme.borderRadius.lg,
              }}
            >
              Back to Banks
            </ThemedButton>
            
            {/* Centered Title */}
            <Typography
              variant="h4"
              sx={{
                color: theme.colors.text.primary,
                fontWeight: theme.typography.fontWeight.bold,
                textAlign: 'center',
                flex: 1,
                mx: theme.spacing[4],
              }}
            >
              🏦 Create New Bank
            </Typography>
            
            {/* Spacer to balance the layout */}
            <Box sx={{ width: '120px' }} />
          </Box>
        </Box>
        
        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Main Content */}
          <ThemedCard>
            <ThemedCardContent sx={{ p: theme.spacing[6] }}>

              <Typography 
                variant="body1" 
                sx={{ 
                  color: theme.colors.text.secondary, 
                  mb: theme.spacing[4],
                  lineHeight: 1.6,
                  textAlign: 'center',
                }}
              >
                Deploy a new Midnight Bank contract. This will create a shared banking environment 
                where multiple users can have accounts and perform privacy-preserving transactions.
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
                {!isConnected && (
                  <Alert severity="warning" sx={{ width: '100%' }}>
                    <Typography variant="body2">
                      Please connect your Lace wallet to deploy a new bank contract.
                    </Typography>
                    <ThemedButton 
                      variant="outlined" 
                      onClick={() => void connect()} 
                      disabled={working}
                      sx={{ mt: theme.spacing[2] }}
                    >
                      {working ? <CircularProgress size={16} /> : 'Connect Lace Wallet'}
                    </ThemedButton>
                  </Alert>
                )}

                <TextField 
                  label="Bank Name (Optional)" 
                  placeholder="e.g., Family Bank, Company Bank, Personal Bank"
                  value={bankLabel} 
                  onChange={(e) => setBankLabel(e.target.value)}
                  fullWidth
                  helperText="A friendly name to identify your bank"
                  disabled={working}
                />

                <Alert severity="info" sx={{ width: '100%' }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> Deploying a bank contract will incur blockchain transaction costs. 
                    After deployment, you'll be able to create accounts and invite other users to join your bank.
                  </Typography>
                </Alert>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: theme.spacing[2] }}>
                  <ThemedButton 
                    variant="primary" 
                    startIcon={working ? <CircularProgress size={16} /> : <AccountBalance />}
                    onClick={onDeployBank} 
                    disabled={!isConnected || working}
                    size="large"
                    sx={{ 
                      minWidth: 250,
                      fontSize: theme.typography.fontSize.base,
                      fontWeight: theme.typography.fontWeight.medium,
                      py: theme.spacing[3],
                      px: theme.spacing[6],
                    }}
                  >
                    {working ? 'Deploying Bank...' : 'Deploy Bank Contract'}
                  </ThemedButton>
                </Box>

                <ErrorAlert 
                  error={error}
                  onClose={() => setError(null)}
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

export default CreateBank;