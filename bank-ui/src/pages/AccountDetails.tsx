import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Chip, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Alert 
} from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff, AccountBalance, Notifications } from '@mui/icons-material';
import { useBankWallet } from '../components/BankWallet';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import { touchAccount } from '../utils/AccountsLocalState';
import { AuthorizationPanel } from '../components/AuthorizationPanel';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { AuthorizationNotifications } from '../components/AuthorizationNotifications';
import { usePinSession } from '../contexts/PinSessionContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { useTransactionHandler, useModalTransactionHandler } from '../utils/errorHandler';
import { useTransactionLoading } from '../contexts/TransactionLoadingContext';
import { 
  ThemedButton, 
  ThemedCard, 
  ThemedCardContent, 
  GradientBackground, 
  AppHeader
} from '../components';
import type { BankAPI, BankDerivedState } from '@midnight-bank/bank-api';
import { utils } from '@midnight-bank/bank-api';
import { useTheme } from '../theme/ThemeProvider';

export const AccountDetails: React.FC = () => {
  const { bankAddress, userId } = useParams<{ bankAddress: string; userId: string }>();
  const navigate = useNavigate();
  const { providers, isConnected } = useBankWallet();
  const { addAccount } = useDeployedAccountContext();
  const { getPin } = usePinSession();
  const { setTransactionLoading } = useTransactionLoading();
  
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<BankDerivedState | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [, setUserPin] = useState<string>('');
  const lastAuthRef = useRef<number | null>(null);
  const { theme, mode } = useTheme();
  
  // Modal states for deposit and withdrawal
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [depositDialogError, setDepositDialogError] = useState<string | null>(null);
  const [depositDialogSuccess, setDepositDialogSuccess] = useState<string | null>(null);
  const [withdrawDialogError, setWithdrawDialogError] = useState<string | null>(null);
  const [withdrawDialogSuccess, setWithdrawDialogSuccess] = useState<string | null>(null);
  
  const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
  
  // Modular transaction handler
  const transactionHandler = useTransactionHandler(setLoading, setError, setSuccess, setTransactionLoading);
  
  // Modal transaction handlers for deposit and withdrawal
  const depositModalHandler = useModalTransactionHandler(
    setLoading,
    setDepositDialogError,
    setDepositDialogSuccess,
    {
      useGlobalError: setError,
      useGlobalSuccess: setSuccess
    },
    setTransactionLoading
  );
  
  const withdrawModalHandler = useModalTransactionHandler(
    setLoading,
    setWithdrawDialogError,
    setWithdrawDialogSuccess,
    {
      useGlobalError: setError,
      useGlobalSuccess: setSuccess
    },
    setTransactionLoading
  );

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
          setError(deployment.error);
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [bankAddress, userId, providers, addAccount]);

  // Authenticate user and subscribe to account state updates when bankAPI is available
  useEffect(() => {
    if (!bankAPI) return;
    
    // Authenticate user when bankAPI becomes available
    const authenticateUser = async () => {
      try {
        const pinInput = await getPin('Enter your PIN to access your account', bankAPI);
        lastAuthRef.current = Date.now();
        setUserPin(pinInput);
      } catch (err) {
        setError('Authentication failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
      }
    };
    
    authenticateUser();
    
    const stateSubscription = bankAPI.state$.subscribe({
      next: (state) => {
        setAccountState(state);
      },
      error: (err) => {
        console.error('State subscription error:', err);
        setError(err);
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
    
    await transactionHandler.execute(
      async () => {
        const pinInput = await getPin('Enter your PIN to reveal balance', bankAPI);
        await bankAPI.getTokenBalance(pinInput);
        
        lastAuthRef.current = Date.now();
        setUserPin(pinInput);
        return pinInput;
      },
      'balance retrieval',
      {
        onSuccess: () => {
          setShowBalance(true);
        },
        onError: () => {
          setShowBalance(false);
        }
      }
    );
  };

  const handleDeposit = () => {
    setShowDepositDialog(true);
  };

  const executeDeposit = async () => {
    if (!bankAPI || !depositAmount.trim()) return;
    
    await depositModalHandler.execute(
      async () => {
        const pinInput = await getPin('Enter your PIN to deposit funds', bankAPI);
        await bankAPI.deposit(pinInput, depositAmount);
        return depositAmount;
      },
      'deposit',
      {
        onSuccess: (amount) => {
          setDepositDialogSuccess(`Successfully deposited $${amount}`);
          setTimeout(() => {
            setDepositAmount('');
            setShowDepositDialog(false);
            setDepositDialogError(null);
            setDepositDialogSuccess(null);
          }, 1500);
        }
      }
    );
  };

  const handleWithdraw = () => {
    setShowWithdrawDialog(true);
  };

  const executeWithdraw = async () => {
    if (!bankAPI || !withdrawAmount.trim()) return;
    
    await withdrawModalHandler.execute(
      async () => {
        const pinInput = await getPin('Enter your PIN to withdraw funds', bankAPI);
        await bankAPI.withdraw(pinInput, withdrawAmount);
        return withdrawAmount;
      },
      'withdrawal',
      {
        onSuccess: (amount) => {
          setWithdrawDialogSuccess(`Successfully withdrew $${amount}`);
          setTimeout(() => {
            setWithdrawAmount('');
            setShowWithdrawDialog(false);
            setWithdrawDialogError(null);
            setWithdrawDialogSuccess(null);
          }, 1500);
        }
      }
    );
  };

  if (!bankAddress || !userId) {
    return (
      <GradientBackground variant="subtle">
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ThemedCard sx={{ maxWidth: 500 }}>
            <ThemedCardContent>
              <Typography 
                color="error" 
                variant="h6" 
                sx={{ textAlign: 'center', color: theme.colors.error[500] }}
              >
                Invalid bank address or user ID
              </Typography>
            </ThemedCardContent>
          </ThemedCard>
        </Box>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="subtle">
      
      <Box sx={{ minHeight: '100vh', p: theme.spacing[4] }}>
        {/* Compact Header */}
        <Box sx={{ maxWidth: 1200, margin: '0 auto', mb: theme.spacing[6] }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: theme.spacing[4],
          }}>
            <ThemedButton
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate(`/bank/${bankAddress}`)}
              sx={{ 
                textTransform: 'none',
                borderRadius: theme.borderRadius.lg,
              }}
            >
              Back to Bank
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
              Account Details
            </Typography>
            
            {/* Spacer to balance the layout */}
            <Box sx={{ width: '120px' }} />
          </Box>
        </Box>
        
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Global Error Banner - Always Visible */}
          <ErrorAlert 
            error={error}
            onClose={() => setError(null)}
            showDetails={true}
            sx={{ mb: error ? theme.spacing[4] : 0 }}
          />

          {/* Main Content Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: theme.spacing[6] }}>
            
            {/* Left Column - Account Info & Balance */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              
              {/* Account Information Card */}
              <ThemedCard>
                <ThemedCardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: theme.spacing[3] }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: theme.borderRadius.md,
                        background: mode === 'dark'
                          ? `linear-gradient(135deg, ${theme.colors.secondary[600]}33 0%, ${theme.colors.secondary[500]}33 100%)`
                          : `linear-gradient(135deg, ${theme.colors.secondary[500]}1A 0%, ${theme.colors.secondary[600]}1A 100%)`,
                        mr: theme.spacing[3],
                      }}
                    >
                      <AccountBalance 
                        sx={{ 
                          fontSize: '1.5rem',
                          color: theme.colors.text.primary,
                        }} 
                      />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: theme.colors.text.primary,
                        fontWeight: theme.typography.fontWeight.bold,
                      }}
                    >
                      Account Information
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                    {/* User ID Field */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.colors.text.secondary, 
                          fontWeight: theme.typography.fontWeight.medium,
                          mb: theme.spacing[1],
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        User ID
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: theme.colors.text.primary,
                          fontFamily: theme.typography.fontFamily.mono,
                          fontSize: '0.95rem',
                          fontWeight: theme.typography.fontWeight.medium,
                          letterSpacing: '0.5px',
                        }}
                      >
                        {userId}
                      </Typography>
                    </Box>
                    
                    {/* Bank Contract Field */}
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.colors.text.secondary, 
                          fontWeight: theme.typography.fontWeight.medium,
                          mb: theme.spacing[1],
                          textTransform: 'uppercase',
                          fontSize: '0.75rem',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Bank Contract
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.colors.text.primary,
                          fontFamily: theme.typography.fontFamily.mono, 
                          fontSize: '0.8rem',
                          fontWeight: theme.typography.fontWeight.normal,
                          wordBreak: 'break-all',
                          lineHeight: 1.4,
                        }}
                      >
                        {bankAddress}
                      </Typography>
                    </Box>
                    
                    {/* Account Status Field */}
                    {accountState && (
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.colors.text.secondary, 
                            fontWeight: theme.typography.fontWeight.medium,
                            mb: theme.spacing[1],
                            textTransform: 'uppercase',
                            fontSize: '0.75rem',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Account Status
                        </Typography>
                        <Typography 
                          variant="body1"
                          sx={{ 
                            color: accountState.accountExists 
                              ? theme.colors.success[500] 
                              : theme.colors.warning[500],
                            fontWeight: theme.typography.fontWeight.medium,
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: theme.spacing[1],
                          }}
                        >
                          {accountState.accountExists ? '✅' : '⚠️'}
                          {accountState.accountExists ? 'Active' : 'Inactive'}
                        </Typography>
                        
                        {loading && (
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: theme.colors.text.secondary, 
                              mt: theme.spacing[1],
                              fontSize: '0.8rem',
                              fontStyle: 'italic',
                              display: 'flex',
                              alignItems: 'center',
                              gap: theme.spacing[1],
                            }}
                          >
                            🔄 Loading...
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </ThemedCardContent>
              </ThemedCard>

              {/* Balance & Account Actions Card */}
              <ThemedCard>
                <ThemedCardContent>
                  {/* Balance Section */}
                  <Box sx={{ mb: theme.spacing[4] }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: theme.colors.text.primary,
                        fontWeight: theme.typography.fontWeight.bold,
                        mb: theme.spacing[3],
                      }}
                    >
                      Balance
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[3], mb: theme.spacing[3] }}>
                      <Typography 
                        variant="h3" 
                        sx={{ 
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          color: showBalance ? theme.colors.text.primary : theme.colors.text.secondary,
                        }}
                      >
                        {showBalance && accountState?.balance !== undefined && accountState.balance !== null
                          ? `${utils.formatBalance(accountState.balance)}`
                          : '***'
                        }
                      </Typography>
                      
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          color: theme.colors.text.secondary,
                          fontWeight: 'bold',
                        }}
                      >
                        MBT
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: theme.spacing[2] }}>
                      {!showBalance && (
                        <ThemedButton
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={handleShowBalance}
                          disabled={loading || !isConnected}
                        >
                          Show Balance
                        </ThemedButton>
                      )}
                      
                      {showBalance && (
                        <ThemedButton
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityOff />}
                          onClick={() => {
                            setShowBalance(false);
                            setUserPin('');
                            lastAuthRef.current = null;
                          }}
                        >
                          Hide Balance
                        </ThemedButton>
                      )}
                    </Box>
                  </Box>
                  
                  {/* Divider */}
                  <Box 
                    sx={{ 
                      height: '1px',
                      backgroundColor: mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.1)' 
                        : 'rgba(0, 0, 0, 0.05)',
                      mb: theme.spacing[4],
                    }} 
                  />
                  
                  {/* Account Actions Section */}
                  <Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: theme.colors.text.primary,
                        fontWeight: theme.typography.fontWeight.bold,
                        mb: theme.spacing[3],
                      }}
                    >
                      Account Actions
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: theme.spacing[2], flexWrap: 'wrap' }}>
                      <ThemedButton
                        variant="primary"
                        onClick={handleDeposit}
                        disabled={loading || !isConnected}
                        sx={{ minWidth: 100 }}
                      >
                        Deposit
                      </ThemedButton>
                      
                      <ThemedButton
                        variant="outlined"
                        onClick={handleWithdraw}
                        disabled={loading || !isConnected}
                        sx={{ minWidth: 100 }}
                      >
                        Withdraw
                      </ThemedButton>           
                    </Box>
                  </Box>
                </ThemedCardContent>
              </ThemedCard>
            </Box>

            {/* Right Column - Notifications & Authorizations */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              
              {/* Real-time Notifications */}
              {bankAPI && (
                <AuthorizationNotifications
                  bankAPI={bankAPI}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              )}

              {/* Authorization System */}
              {bankAPI && (
                <AuthorizationPanel 
                  bankAPI={bankAPI}
                  isConnected={isConnected}
                  userId={userId}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              )}

              {/* Balance Disclosure System */}
              {bankAPI && (
                <DisclosurePanel 
                  bankAPI={bankAPI}
                  isConnected={isConnected}
                  userId={userId}
                  onError={setError}
                  onSuccess={setSuccess}
                />
              )}
            </Box>
          </Box>

          {/* Status Messages */}
          {!isConnected && (
            <Box sx={{ mt: theme.spacing[4] }}>
              <ThemedCard>
                <ThemedCardContent>
                  <Typography 
                    sx={{ 
                      color: theme.colors.warning[500],
                      textAlign: 'center',
                    }}
                  >
                    Connect your wallet to perform transactions
                  </Typography>
                </ThemedCardContent>
              </ThemedCard>
            </Box>
          )}

          {success && (
            <Box sx={{ mt: theme.spacing[4] }}>
              <ThemedCard>
                <ThemedCardContent>
                  <Typography 
                    sx={{ 
                      color: theme.colors.success[500],
                      textAlign: 'center',
                    }}
                  >
                    {success}
                  </Typography>
                </ThemedCardContent>
              </ThemedCard>
            </Box>
          )}

          {/* Deposit Dialog */}
          <Dialog open={showDepositDialog} onClose={() => {
            setShowDepositDialog(false);
            setDepositDialogError(null);
            setDepositDialogSuccess(null);
            setDepositAmount('');
          }} maxWidth="sm" fullWidth>
            <DialogTitle>💰 Deposit Funds</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add funds to your bank account. Enter the amount you want to deposit.
              </Typography>
              
              {/* Inline Modal Error/Success */}
              {depositDialogError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Error:</strong> {depositDialogError}
                  </Typography>
                </Alert>
              )}
              
              {depositDialogSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Success:</strong> {depositDialogSuccess}
                  </Typography>
                </Alert>
              )}
              
              <TextField
                autoFocus
                label="Amount ($)"
                placeholder="e.g., 100.00"
                fullWidth
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Enter the amount to deposit to your account"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setShowDepositDialog(false);
                setDepositDialogError(null);
                setDepositDialogSuccess(null);
                setDepositAmount('');
              }}>Cancel</Button>
              <Button
                onClick={executeDeposit}
                variant="contained"
                disabled={loading || !depositAmount.trim()}
              >
                {loading ? 'Depositing...' : 'Deposit'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Withdraw Dialog */}
          <Dialog open={showWithdrawDialog} onClose={() => {
            setShowWithdrawDialog(false);
            setWithdrawDialogError(null);
            setWithdrawDialogSuccess(null);
            setWithdrawAmount('');
          }} maxWidth="sm" fullWidth>
            <DialogTitle>💸 Withdraw Funds</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Withdraw funds from your bank account. Enter the amount you want to withdraw.
              </Typography>
              
              {/* Inline Modal Error/Success */}
              {withdrawDialogError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Error:</strong> {withdrawDialogError}
                  </Typography>
                </Alert>
              )}
              
              {withdrawDialogSuccess && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Success:</strong> {withdrawDialogSuccess}
                  </Typography>
                </Alert>
              )}
              
              <TextField
                autoFocus
                label="Amount ($)"
                placeholder="e.g., 50.00"
                fullWidth
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                sx={{ mt: 2 }}
                helperText="Enter the amount to withdraw from your account"
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setShowWithdrawDialog(false);
                setWithdrawDialogError(null);
                setWithdrawDialogSuccess(null);
                setWithdrawAmount('');
              }}>Cancel</Button>
              <Button
                onClick={executeWithdraw}
                variant="contained"
                disabled={loading || !withdrawAmount.trim()}
              >
                {loading ? 'Withdrawing...' : 'Withdraw'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </GradientBackground>
  );
};