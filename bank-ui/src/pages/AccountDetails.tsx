import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Chip } from '@mui/material';
import { ArrowBack, Visibility, VisibilityOff, AccountBalance, Notifications } from '@mui/icons-material';
import { useBankWallet } from '../components/BankWallet';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import { touchAccount } from '../utils/AccountsLocalState';
import { AuthorizationPanel } from '../components/AuthorizationPanel';
import { DisclosurePanel } from '../components/DisclosurePanel';
import { AuthorizationNotifications } from '../components/AuthorizationNotifications';
import { usePinSession } from '../contexts/PinSessionContext';
import { ErrorAlert } from '../components/ErrorAlert';
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
  
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accountState, setAccountState] = useState<BankDerivedState | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [, setUserPin] = useState<string>('');
  const lastAuthRef = useRef<number | null>(null);
  const { theme, mode } = useTheme();
  
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

  // Subscribe to account state updates when bankAPI is available
  useEffect(() => {
    if (!bankAPI) return;
    
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
    
    try {
      setLoading(true);
      setError(null);
      
      const pinInput = await getPin('Enter your PIN to reveal balance');
      
      await bankAPI.getTokenBalance(pinInput);
      
      lastAuthRef.current = Date.now();
      setUserPin(pinInput);
      setShowBalance(true);
      setLoading(false);
      
    } catch (err) {
      setError(err);
      setLoading(false);
      setShowBalance(false);
    }
  };

  const handleDeposit = async () => {
    if (!bankAPI) return;
    try {
      const pinInput = await getPin('Enter your PIN to deposit funds');
      const amountInput = prompt('Enter deposit amount:') ?? '';
      if (!amountInput) return;
      
      setLoading(true);
      await bankAPI.deposit(pinInput, amountInput);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!bankAPI) return;
    try {
      const pinInput = await getPin('Enter your PIN to withdraw funds');
      const amountInput = prompt('Enter withdrawal amount:') ?? '';
      if (!amountInput) return;
      
      setLoading(true);
      await bankAPI.withdraw(pinInput, amountInput);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
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
                      
                      <ThemedButton
                        variant="outlined"
                        onClick={() => alert('Verify functionality not implemented yet')}
                        disabled={loading}
                        sx={{ minWidth: 120 }}
                      >
                        Verify Account
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
        </Box>
      </Box>
    </GradientBackground>
  );
};