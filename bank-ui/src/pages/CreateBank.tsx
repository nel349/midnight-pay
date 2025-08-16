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
import { saveBank } from '../utils/AccountsLocalState';
import { getErrorSummary } from '../utils/errorHandling';
import { useThemeValues } from '../theme';

export interface CreateBankProps { 
  logger: Logger; 
  onComplete: (contractAddress: string) => void;
}

export const CreateBank: React.FC<CreateBankProps> = ({ logger, onComplete }) => {
  const navigate = useNavigate();
  const { providers, isConnected, connect } = useBankWallet();
  const [bankLabel, setBankLabel] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<any>(null);

  const onDeployBank = useCallback(async () => {
    logger.info('onDeployBank: Starting bank deployment...');
    try {
      setWorking(true);
      setError(null);
      
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
    }
  }, [providers, logger, bankLabel, onComplete]);

  const theme = useThemeValues();

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      
      <ThemedCard sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
        <ThemedCardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <ThemedButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/accounts')}
              sx={{ mr: 2 }}
              disabled={working}
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
              Create New Bank
            </Typography>
          </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Deploy a new Midnight Bank contract. This will create a shared banking environment 
          where multiple users can have accounts and perform privacy-preserving transactions.
        </Typography>

        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          {!isConnected && (
            <Alert severity="warning" sx={{ width: '100%' }}>
              <Typography variant="body2">
                Please connect your Lace wallet to deploy a new bank contract.
              </Typography>
              <ThemedButton 
                variant="outlined" 
                onClick={() => void connect()} 
                disabled={working}
                sx={{ mt: 1 }}
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
              padding: `${theme.spacing[3]} ${theme.spacing[6]}`,
            }}
          >
            {working ? 'Deploying Bank...' : 'Deploy Bank Contract'}
          </ThemedButton>

          <ErrorAlert 
            error={error}
            onClose={() => setError(null)}
            showDetails={true}
          />
        </Box>
        </ThemedCardContent>
      </ThemedCard>
    </Box>
  );
};

export default CreateBank;