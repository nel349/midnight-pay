import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { useBankWallet } from '../components/BankWallet';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import { firstValueFrom } from 'rxjs';
import { touchAccount } from '../utils/AccountsLocalState';
import type { BankAPI } from '@midnight-bank/bank-api';

export const AccountDetails: React.FC = () => {
  const { addr } = useParams<{ addr: string }>();
  const navigate = useNavigate();
  const { providers, isConnected } = useBankWallet();
  const { addAccount } = useDeployedAccountContext();
  
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('***');
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    if (!addr) return;
    
    // Touch account to update last used timestamp
    touchAccount(addr);
    
    // Subscribe to the account
    const accountItem = addAccount(providers, addr);
    
    const subscription = accountItem.observable.subscribe({
      next: (deployment) => {
        if (deployment.status === 'deployed') {
          setBankAPI(deployment.api);
          setLoading(false);
        } else if (deployment.status === 'failed') {
          setError(deployment.error.message);
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [addr, providers, addAccount]);

  const handleShowBalance = async () => {
    if (!bankAPI || !isConnected) return;
    
    try {
      setLoading(true);
      // Ask for PIN and authenticate balance access
      const pinInput = prompt('Enter your PIN to reveal balance:') ?? '';
      if (!pinInput) { setLoading(false); return; }
      await bankAPI.authenticateBalanceAccess(pinInput);
      
      // Get the balance from state
      const state = await firstValueFrom(bankAPI.state$);
      setBalance(state?.balance?.toString() || '0');
      setShowBalance(true);
      setLoading(false);
      
      // Auto-hide after 10 minutes
      setTimeout(() => {
        setBalance('***');
        setShowBalance(false);
      }, 10 * 60 * 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate balance');
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!bankAPI) return;
    try {
      const pinInput = prompt('Enter your PIN:') ?? '';
      if (!pinInput) return;
      const amountInput = prompt('Enter deposit amount:') ?? '';
      if (!amountInput) return;
      
      setLoading(true);
      await bankAPI.deposit(pinInput, amountInput);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit failed');
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!bankAPI) return;
    try {
      const pinInput = prompt('Enter your PIN:') ?? '';
      if (!pinInput) return;
      const amountInput = prompt('Enter withdrawal amount:') ?? '';
      if (!amountInput) return;
      
      setLoading(true);
      await bankAPI.withdraw(pinInput, amountInput);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed');
      setLoading(false);
    }
  };

  if (!addr) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Invalid account address</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{ mr: 2 }}
          >
            Back to Accounts
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Account Details
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Contract Address
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
              {addr}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Balance</Typography>
              {loading && <Chip label="Loading..." size="small" />}
              {error && <Chip label="Error" color="error" size="small" />}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: 'monospace',
                  color: showBalance ? 'text.primary' : 'text.secondary'
                }}
              >
                {balance}
              </Typography>
              
              {!showBalance && (
                <Button
                  startIcon={<Visibility />}
                  onClick={handleShowBalance}
                  disabled={loading || !isConnected}
                  size="small"
                >
                  Show Balance
                </Button>
              )}
              
              {showBalance && (
                <Button
                  startIcon={<VisibilityOff />}
                  onClick={() => {
                    setBalance('***');
                    setShowBalance(false);
                  }}
                  size="small"
                >
                  Hide
                </Button>
              )}
            </Box>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Actions
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                onClick={handleDeposit}
                disabled={loading || !isConnected}
              >
                Deposit
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleWithdraw}
                disabled={loading || !isConnected}
              >
                Withdraw
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => alert('Verify functionality not implemented yet')}
                disabled={loading}
              >
                Verify Account
              </Button>
            </Box>
          </Box>

          {!isConnected && (
            <Box>
              <Card sx={{ backgroundColor: '#fff3cd' }}>
                <CardContent>
                  <Typography color="warning.dark">
                    Connect your wallet to perform transactions
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {error && (
            <Box>
              <Card sx={{ backgroundColor: '#f8d7da' }}>
                <CardContent>
                  <Typography color="error">
                    Error: {error}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};