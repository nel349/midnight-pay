import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Box, Alert } from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import { useBankWallet } from '../components/BankWallet';
import { listAccountsForBank, saveAccount, touchBank } from '../utils/AccountsLocalState';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import type { BankAPI } from '@midnight-bank/bank-api';

export const BankDetails: React.FC = () => {
  const { bankAddress } = useParams<{ bankAddress: string }>();
  const navigate = useNavigate();
  const { providers, isConnected } = useBankWallet();
  const { addAccount } = useDeployedAccountContext();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);

  // Subscribe to bank contract when component mounts
  React.useEffect(() => {
    if (!bankAddress) return;
    
    const accountItem = addAccount(providers, bankAddress);
    const subscription = accountItem.observable.subscribe({
      next: (deployment) => {
        if (deployment.status === 'deployed') {
          setBankAPI(deployment.api);
        } else if (deployment.status === 'failed') {
          setError(deployment.error.message);
        }
      },
      error: (err) => {
        setError(err.message);
      }
    });

    return () => subscription.unsubscribe();
  }, [bankAddress, providers, addAccount]);

  const handleCreateAccount = async () => {
    if (!bankAPI || !isConnected) return;
    
    try {
      const userIdInput = prompt('Enter a unique user ID for this account (e.g., alice-123):') ?? '';
      if (!userIdInput.trim()) return;
      
      const pinInput = prompt('Enter a PIN for this account:') ?? '';
      if (!pinInput.trim()) return;
      
      const initialDeposit = prompt('Enter initial deposit amount:') ?? '';
      if (!initialDeposit.trim()) return;
      
      setLoading(true);
      setError(null);
      
      // Create a user-bound API so privateStateId matches the new userId
      const userItem = addAccount(providers, bankAddress!, userIdInput.trim());
      const userApi: BankAPI = await new Promise((resolve, reject) => {
        const sub = userItem.observable.subscribe({
          next: (deployment) => {
            if (deployment.status === 'deployed') { sub.unsubscribe(); resolve(deployment.api); }
            else if (deployment.status === 'failed') { sub.unsubscribe(); reject(deployment.error); }
          },
          error: (err) => { sub.unsubscribe(); reject(err); }
        });
      });

      // Create account in the bank (initial deposit applied to the correct private state)
      await userApi.createAccount(userIdInput.trim(), pinInput, initialDeposit);
      
      // Save account to local storage
      saveAccount({
        bankContractAddress: bankAddress!,
        userId: userIdInput.trim(),
        createdAt: new Date().toISOString()
      });
      
      // Touch the bank to update last used
      touchBank(bankAddress!);
      
      // Navigate to the new account
      navigate(`/bank/${bankAddress}/account/${userIdInput.trim()}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
    }
  };

  if (!bankAddress) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Invalid bank address</Typography>
        </CardContent>
      </Card>
    );
  }

  const accounts = listAccountsForBank(bankAddress);

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{ mr: 2 }}
          >
            Back to Banks
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Bank Details
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Bank Contract Address
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f5f5f5', 
                p: 1, 
                borderRadius: 1,
                wordBreak: 'break-all'
              }}
            >
              {bankAddress}
            </Typography>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Accounts in this Bank
            </Typography>
            
            {accounts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No accounts in this bank yet. Create your first account to start banking!
              </Alert>
            ) : (
              <Box display="flex" flexDirection="column" gap={1} mb={2}>
                {accounts.map((account) => (
                  <Button
                    key={account.userId}
                    variant="outlined"
                    onClick={() => navigate(`/bank/${bankAddress}/account/${account.userId}`)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    <Typography variant="body1">
                      {account.label || account.userId}
                    </Typography>
                  </Button>
                ))}
              </Box>
            )}

            <Button
              startIcon={<Add />}
              variant="contained"
              onClick={handleCreateAccount}
              disabled={loading || !isConnected}
            >
              {loading ? 'Creating Account...' : 'Create New Account'}
            </Button>
          </Box>

          {!isConnected && (
            <Alert severity="warning">
              Connect your wallet to create accounts in this bank
            </Alert>
          )}

          {error && (
            <Alert severity="error">
              Error: {error}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};