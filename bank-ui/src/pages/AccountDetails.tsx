import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff } from '@mui/icons-material';
import { useBankWallet } from '../components/BankWallet';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import { touchAccount } from '../utils/AccountsLocalState';
import { AuthorizationPanel } from '../components/AuthorizationPanel';
import { AuthorizationNotifications } from '../components/AuthorizationNotifications';
import type { BankAPI, BankDerivedState } from '@midnight-bank/bank-api';
import { utils } from '@midnight-bank/bank-api';

export const AccountDetails: React.FC = () => {
  const { bankAddress, userId } = useParams<{ bankAddress: string; userId: string }>();
  const navigate = useNavigate();
  const { providers, isConnected } = useBankWallet();
  const { addAccount } = useDeployedAccountContext();
  
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<BankDerivedState | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [userPin, setUserPin] = useState<string>('');
  const lastAuthRef = useRef<number | null>(null);
  
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

  useEffect(() => {
    if (!bankAddress || !userId) return;
    
    // Touch account to update last used
    touchAccount(bankAddress, userId);
    
    // Subscribe to the bank contract
    const accountItem = addAccount(providers, bankAddress, userId);
    
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
  }, [bankAddress, userId, providers, addAccount]);

  // Subscribe to account state updates when bankAPI is available
  useEffect(() => {
    if (!bankAPI) return;
    
    const stateSubscription = bankAPI.state$.subscribe({
      next: (state) => {
        setAccountState(state);
      },
      error: (err) => {
        console.error('State subscription error:', err);
        setError(err.message);
      }
    });

    // Check for session timeout
    const timeoutCheck = setInterval(() => {
      if (lastAuthRef.current && Date.now() - lastAuthRef.current > SESSION_TIMEOUT_MS) {
        setShowBalance(false);
        setUserPin('');
        lastAuthRef.current = null;
      }
    }, 5000);

    return () => {
      stateSubscription.unsubscribe();
      clearInterval(timeoutCheck);
    };
  }, [bankAPI, SESSION_TIMEOUT_MS]);

  // Clear success messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleShowBalance = async () => {
    if (!bankAPI || !isConnected) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const pinInput = prompt('Enter your PIN to reveal balance:') ?? '';
      if (!pinInput) { 
        setLoading(false); 
        return; 
      }
      
      await bankAPI.authenticateBalanceAccess(pinInput);
      
      lastAuthRef.current = Date.now();
      setUserPin(pinInput);
      setShowBalance(true);
      setLoading(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to authenticate balance');
      setLoading(false);
      setShowBalance(false);
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

  if (!bankAddress || !userId) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Invalid bank address or user ID</Typography>
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
            onClick={() => navigate(`/bank/${bankAddress}`)}
            sx={{ mr: 2 }}
          >
            Back to Bank
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Account Details
          </Typography>
        </Box>

        <Box display="flex" flexDirection="column" gap={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              User ID: {userId}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontFamily: 'monospace', 
                fontSize: '0.75rem'
              }}
            >
              Bank: {bankAddress}
            </Typography>
          </Box>

          {bankAPI && (
            <AuthorizationNotifications
              bankAPI={bankAPI}
              onError={setError}
              onSuccess={setSuccess}
            />
          )}

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Typography variant="h6">Balance</Typography>
              {loading && <Chip label="Loading..." size="small" />}
              {error && <Chip label="Error" color="error" size="small" />}
              {accountState && <Chip label={`Account Exists: ${accountState.accountExists}`} size="small" variant="outlined" />}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: 'monospace',
                  color: showBalance ? 'text.primary' : 'text.secondary'
                }}
              >
                {showBalance && accountState?.balance !== undefined 
                  ? utils.formatBalance(accountState.balance)
                  : '***'
                }
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
                    setShowBalance(false);
                    setUserPin('');
                    lastAuthRef.current = null;
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
              Account Actions
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

          {bankAPI && (
            <AuthorizationPanel 
              bankAPI={bankAPI}
              isConnected={isConnected}
              onError={setError}
              onSuccess={setSuccess}
            />
          )}

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

          {success && (
            <Box>
              <Card sx={{ backgroundColor: '#d4edda' }}>
                <CardContent>
                  <Typography color="success.dark">
                    {success}
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