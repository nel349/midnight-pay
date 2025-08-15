import React, { useEffect, useMemo } from 'react';
import { Typography, Box, Divider, Chip, Alert, CircularProgress } from '@mui/material';
import { AccountBalance, Add, Launch, AccountBalanceWallet } from '@mui/icons-material';
import { listBanks, listAccountsForBank } from '../utils/AccountsLocalState';
import { useBankWallet } from '../components/BankWallet';
import { ThemedButton } from '../components/ThemedButton';
import { ThemedCard, ThemedCardContent } from '../components/ThemedCard';
import { ThemeToggle } from '../components/ThemeToggle';
import { useThemeValues } from '../theme';

export const AccountsHome: React.FC<{ 
  onCreateBank: () => void; 
  onJoinBank: () => void;
  onOpenBank: (bankAddress: string, userId?: string) => void; 
}> = ({ onCreateBank, onJoinBank, onOpenBank }) => {


  // check if midnight lace is installed and connected, if connected, we should be able to see accounts and use those instead of creating new ones
  const { isConnected, connect } = useBankWallet();
  const [connecting, setConnecting] = React.useState(false);

  useEffect(() => {
    console.log('isConnected', isConnected);
    if (isConnected) {
      const banks = listBanks();
      console.log('banks', banks);
    }
  }, [isConnected]);

  const banks = useMemo(() => listBanks(), []);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      await connect();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setConnecting(false);
    }
  };
  
  const theme = useThemeValues();
  
  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Theme Toggle in top-right corner */}
      <ThemeToggle 
        sx={{ 
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
        }} 
      />
      
      <ThemedCard sx={{ backgroundColor: 'transparent' }}>
        <ThemedCardContent>
        <Typography 
          variant="h1" 
          align="center" 
          gutterBottom
          sx={{
            color: theme.colors.text.primary,
            fontWeight: theme.typography.fontWeight.bold,
            fontSize: theme.typography.fontSize['3xl'],
            marginBottom: theme.spacing[6],
          }}
        >
          Welcome to Midnight Bank
        </Typography>
        
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          {!isConnected && (
            <Alert severity="warning" sx={{ width: '100%', maxWidth: 600 }}>
              <Typography variant="body2" gutterBottom>
                Connect your Lace wallet to access banking features
              </Typography>
              <ThemedButton 
                variant="outlined" 
                startIcon={connecting ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
                onClick={handleConnect}
                disabled={connecting}
                sx={{ mt: 1 }}
              >
                {connecting ? 'Connecting...' : 'Connect Lace Wallet'}
              </ThemedButton>
            </Alert>
          )}

          {isConnected && (
            <Alert severity="success" sx={{ width: '100%', maxWidth: 600 }}>
              <Typography variant="body2">
                ✅ Wallet connected! You can now create banks and accounts.
              </Typography>
            </Alert>
          )}
          {banks.length === 0 ? (
            <>
              <Box textAlign="center">
                <Typography color="text.secondary" gutterBottom>
                  No banks yet. Create your first bank or join an existing one to get started.
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <ThemedButton 
                  variant="primary" 
                  startIcon={<Add />}
                  onClick={onCreateBank}
                  disabled={!isConnected}
                >
                  Create New Bank
                </ThemedButton>
                <ThemedButton 
                  variant="outlined"
                  startIcon={<Launch />}
                  onClick={onJoinBank}
                  disabled={!isConnected}
                >
                  Join Existing Bank
                </ThemedButton>
              </Box>
            </>
          ) : (
            <>
              <Box display="flex" gap={2}>
                <ThemedButton 
                  variant="primary" 
                  startIcon={<Add />}
                  onClick={onCreateBank}
                  disabled={!isConnected}
                >
                  Create New Bank
                </ThemedButton>
                <ThemedButton 
                  variant="outlined"
                  startIcon={<Launch />}
                  onClick={onJoinBank}
                  disabled={!isConnected}
                >
                  Join Existing Bank
                </ThemedButton>
              </Box>
              <Divider sx={{ width: '100%' }} />
              <Typography variant="h6">Your Banks</Typography>
            </>
          )}
          
          {banks.map((bank) => {
            const accounts = listAccountsForBank(bank.contractAddress);
            return (
              <ThemedCard key={bank.contractAddress} sx={{ width: '100%', maxWidth: 'fit-content' }}>
                <ThemedCardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <AccountBalance color="primary" />
                    <Box flexGrow={1}>
                      <Typography variant="h6">
                        {bank.label || `Bank ${bank.contractAddress.slice(0, 8)}...`}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {bank.contractAddress}
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                  
                  {accounts.length === 0 ? (
                    <Box textAlign="center" py={2}>
                      <Typography color="text.secondary" gutterBottom>
                        No accounts in this bank yet
                      </Typography>
                      <ThemedButton 
                        size="small" 
                        onClick={() => onOpenBank(bank.contractAddress)}
                        disabled={!isConnected}
                      >
                        Create Account
                      </ThemedButton>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {accounts.map((account) => (
                        <ThemedButton
                          key={`${account.bankContractAddress}-${account.userId}`}
                          variant="outlined"
                          onClick={() => onOpenBank(account.bankContractAddress, account.userId)}
                          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                          <Typography variant="body2">
                            {account.label || account.userId}
                          </Typography>
                        </ThemedButton>
                      ))}
                      <ThemedButton 
                        size="small" 
                        variant="outlined"
                        onClick={() => onOpenBank(bank.contractAddress)}
                        disabled={!isConnected}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        + Create New Account
                      </ThemedButton>
                    </Box>
                  )}
                </ThemedCardContent>
              </ThemedCard>
            );
          })}
        </Box>
        </ThemedCardContent>
      </ThemedCard>
    </Box>
  );
};


