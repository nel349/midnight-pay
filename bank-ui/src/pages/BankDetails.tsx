import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, 
  Box, 
  Alert, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import { 
  ArrowBack, 
  Add, 
  AccountBalance, 
  Person,
  ContentCopy,
  Business
} from '@mui/icons-material';
import { 
  ThemedButton, 
  ThemedCard, 
  ThemedCardContent, 
  GradientBackground,
  ThemeToggle
} from '../components';
import { useTheme } from '../theme/ThemeProvider';
import { useBankWallet } from '../components/BankWallet';
import { listAccountsForBank, saveAccount, touchBank } from '../utils/AccountsLocalState';
import { useDeployedAccountContext } from '../contexts/DeployedAccountProviderContext';
import { BankAPI } from '@midnight-bank/bank-api';
import type { Logger } from 'pino';
import { useTransactionLoading } from '../contexts/TransactionLoadingContext';

export const BankDetails: React.FC = () => {
  const { bankAddress } = useParams<{ bankAddress: string }>();
  const navigate = useNavigate();
  const { providers, isConnected } = useBankWallet();
  const { addAccount } = useDeployedAccountContext();
  const { theme, mode } = useTheme();
  const { setTransactionLoading } = useTransactionLoading();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [bankAPI, setBankAPI] = useState<BankAPI | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newPin, setNewPin] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');

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


  // Clear success messages after 5 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleCreateAccountDialog = () => {
    if (!bankAPI || !isConnected || !newUserId.trim() || !newPin.trim() || !initialDeposit.trim()) return;
    
    setLoading(true);
    setError(null);
    setTransactionLoading(true, 'Account Creation');
    
    BankAPI.createAccount(
      providers,
      bankAddress!,
      newUserId.trim(),
      newPin,
      initialDeposit,
      (console as unknown as Logger),
    )
    .then(() => {
      // Save account to local storage
      saveAccount({
        bankContractAddress: bankAddress!,
        userId: newUserId.trim(),
        createdAt: new Date().toISOString()
      });
      
      // Touch the bank to update last used
      touchBank(bankAddress!);
      
      setSuccess(`Account "${newUserId}" created successfully!`);
      setShowCreateDialog(false);
      setNewUserId('');
      setNewPin('');
      setInitialDeposit('');
      setLoading(false);
      setTransactionLoading(false);
      
      // Navigate to the new account after a brief delay
      setTimeout(() => {
        navigate(`/bank/${bankAddress}/account/${newUserId.trim()}`);
      }, 1500);
    })
    .catch((err) => {
      setError(err instanceof Error ? err.message : 'Failed to create account');
      setLoading(false);
      setTransactionLoading(false);
    });
  };

  const copyBankAddress = () => {
    navigator.clipboard?.writeText(bankAddress!);
    setSuccess('Bank address copied to clipboard!');
  };

  if (!bankAddress) {
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
                Invalid bank address
              </Typography>
            </ThemedCardContent>
          </ThemedCard>
        </Box>
      </GradientBackground>
    );
  }

  const accounts = listAccountsForBank(bankAddress);

  return (
    <GradientBackground variant="subtle">
      
      <Box sx={{ minHeight: '100vh', p: theme.spacing[4] }}>
        {/* Header */}
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
              onClick={() => navigate('/accounts')}
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
              🏦 Bank Details
            </Typography>
            
            {/* Spacer to balance the layout */}
            <Box sx={{ width: '120px' }} />
          </Box>
        </Box>
        
        <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Main Content Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: theme.spacing[6] }}>
            
            {/* Left Column - Bank Information */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              
              {/* Bank Information Card */}
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
                      <Business 
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
                      Bank Information
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
                    {/* Bank Contract Address Field */}
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
                        Contract Address
                      </Typography>
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing[2],
                        p: theme.spacing[2],
                        bgcolor: theme.colors.background.surface,
                        borderRadius: theme.borderRadius.md,
                        border: '1px solid',
                        borderColor: theme.colors.border.light,
                      }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.colors.text.primary,
                            fontFamily: theme.typography.fontFamily.mono, 
                            fontSize: '0.8rem',
                            fontWeight: theme.typography.fontWeight.normal,
                            wordBreak: 'break-all',
                            lineHeight: 1.4,
                            flex: 1,
                          }}
                        >
                          {bankAddress}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={copyBankAddress}
                          sx={{ color: theme.colors.text.secondary }}
                          title="Copy address"
                        >
                          <ContentCopy sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    {/* Bank Status */}
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
                        Bank Status
                      </Typography>
                      <Typography 
                        variant="body1"
                        sx={{ 
                          color: bankAPI 
                            ? theme.colors.success[500] 
                            : theme.colors.warning[500],
                          fontWeight: theme.typography.fontWeight.medium,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: theme.spacing[1],
                        }}
                      >
                        {bankAPI ? '✅' : '⚠️'}
                        {bankAPI ? 'Connected' : 'Connecting...'}
                      </Typography>
                    </Box>
                  </Box>
                </ThemedCardContent>
              </ThemedCard>
            </Box>

            {/* Right Column - Accounts Management */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[4] }}>
              
              {/* Accounts List Card */}
              <ThemedCard>
                <ThemedCardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: theme.spacing[3] }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: theme.borderRadius.md,
                        background: mode === 'dark'
                          ? `linear-gradient(135deg, ${theme.colors.primary[600]}33 0%, ${theme.colors.primary[500]}33 100%)`
                          : `linear-gradient(135deg, ${theme.colors.primary[500]}1A 0%, ${theme.colors.primary[600]}1A 100%)`,
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
                      Your Accounts
                    </Typography>
                  </Box>
                  
                  {accounts.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: theme.spacing[4] }}>
                      <Person 
                        sx={{ 
                          fontSize: 48, 
                          color: theme.colors.text.secondary, 
                          mb: theme.spacing[2] 
                        }} 
                      />
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          mb: theme.spacing[1],
                          color: theme.colors.text.primary,
                        }}
                      >
                        No Accounts Yet
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: theme.colors.text.secondary,
                          mb: theme.spacing[3],
                        }}
                      >
                        Create your first account to start banking with privacy
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ mb: theme.spacing[2] }}>
                      {accounts.map((account, index) => (
                        <ListItem 
                          key={account.userId}
                          sx={{
                            borderRadius: theme.borderRadius.md,
                            mb: theme.spacing[1],
                            border: '1px solid',
                            borderColor: theme.colors.border.strong,
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: theme.colors.background.elevated,
                            }
                          }}
                          onClick={() => navigate(`/bank/${bankAddress}/account/${account.userId}`)}
                        >
                          <ListItemIcon>
                            <Person sx={{ 
                              color: theme.colors.text.primary,
                              fontSize: '1.25rem'
                            }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ 
                                fontWeight: theme.typography.fontWeight.medium,
                                color: theme.colors.text.primary,
                              }}>
                                {account.label || account.userId}
                              </Typography>
                            }
                            secondary={
                              <Typography sx={{ 
                                fontSize: '0.75rem',
                                color: theme.colors.text.secondary,
                              }}>
                                Created {new Date(account.createdAt).toLocaleDateString()}
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <ThemedButton
                    variant="primary"
                    startIcon={<Add />}
                    onClick={() => setShowCreateDialog(true)}
                    disabled={loading || !isConnected}
                    fullWidth
                    sx={{ mt: theme.spacing[2] }}
                  >
                    {loading ? 'Creating Account...' : 'Create New Account'}
                  </ThemedButton>
                </ThemedCardContent>
              </ThemedCard>
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
                    Connect your wallet to create accounts in this bank
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

          {error && (
            <Box sx={{ mt: theme.spacing[4] }}>
              <ThemedCard>
                <ThemedCardContent>
                  <Typography 
                    sx={{ 
                      color: theme.colors.error[500],
                      textAlign: 'center',
                    }}
                  >
                    Error: {error}
                  </Typography>
                </ThemedCardContent>
              </ThemedCard>
            </Box>
          )}
        </Box>
      </Box>
      
      {/* Create Account Dialog */}
      <Dialog 
        open={showCreateDialog} 
        onClose={() => setShowCreateDialog(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Add /> Create New Account
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new private banking account. Your account will be secured with zero-knowledge proofs.
          </Typography>
          <TextField
            autoFocus
            label="User ID"
            placeholder="e.g., alice-123"
            fullWidth
            value={newUserId}
            onChange={(e) => setNewUserId(e.target.value)}
            sx={{ mb: 2 }}
            helperText="Choose a unique identifier for your account"
          />
          <TextField
            label="PIN"
            type="password"
            placeholder="Enter a secure PIN"
            fullWidth
            value={newPin}
            onChange={(e) => setNewPin(e.target.value)}
            sx={{ mb: 2 }}
            helperText="This PIN will be required for all transactions"
          />
          <TextField
            label="Initial Deposit (MBT)"
            placeholder="e.g., 100.00"
            fullWidth
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(e.target.value)}
            helperText="Starting balance for your account"
          />
        </DialogContent>
        <DialogActions>
          <ThemedButton onClick={() => setShowCreateDialog(false)}>Cancel</ThemedButton>
          <ThemedButton
            variant="primary"
            onClick={handleCreateAccountDialog}
            disabled={loading || !newUserId.trim() || !newPin.trim() || !initialDeposit.trim()}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </GradientBackground>
  );
};