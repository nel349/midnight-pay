import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Card, 
  CardContent, 
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

export interface CreateBankProps { 
  logger: Logger; 
  onComplete: (contractAddress: string) => void;
}

export const CreateBank: React.FC<CreateBankProps> = ({ logger, onComplete }) => {
  const navigate = useNavigate();
  const { providers, isConnected, connect } = useBankWallet();
  const [bankLabel, setBankLabel] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDeployBank = useCallback(async () => {
    logger.info('onDeployBank: Starting bank deployment...');
    try {
      setWorking(true);
      setError(null);
      
      // Generate a unique ID for the bank contract
      const bankId = crypto.randomUUID();
      
      // Deploy the bank contract (but don't create any accounts yet)
      const api = await BankAPI.deploy(bankId, providers, logger);
      const contractAddress = api.deployedContractAddress;
      
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
      sessionStorage.setItem('lastBankDeployment', JSON.stringify({
        contractAddress,
        label: bankLabel,
        timestamp: new Date().toISOString()
      }));
      
      onComplete(contractAddress);
    } catch (e) {
      logger.error(e, 'Failed to deploy bank contract');
      setError(e instanceof Error ? e.message : 'Failed to deploy bank contract');
    } finally {
      setWorking(false);
    }
  }, [providers, logger, bankLabel, onComplete]);

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{ mr: 2 }}
            disabled={working}
          >
            Back to Accounts
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
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
              <Button 
                variant="outlined" 
                onClick={() => void connect()} 
                disabled={working}
                sx={{ mt: 1 }}
              >
                {working ? <CircularProgress size={16} /> : 'Connect Lace Wallet'}
              </Button>
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

          <Button 
            variant="contained" 
            startIcon={working ? <CircularProgress size={16} /> : <AccountBalance />}
            onClick={onDeployBank} 
            disabled={!isConnected || working}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {working ? 'Deploying Bank...' : 'Deploy Bank Contract'}
          </Button>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreateBank;