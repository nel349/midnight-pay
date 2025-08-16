import React, { useEffect, useMemo } from 'react';
import { Typography, Box, Alert, CircularProgress, Container } from '@mui/material';
import { Add, Launch, AccountBalanceWallet } from '@mui/icons-material';
import { listBanks, listAccountsForBank } from '../utils/AccountsLocalState';
import { useBankWallet } from '../components/BankWallet';
import { 
  ThemedButton, 
  GradientBackground, 
  AppHeader, 
  BankCard 
} from '../components';
import { useTheme } from '../theme';

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
  
  const { theme, mode } = useTheme();
  
  return (
    <GradientBackground>
      
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, position: 'relative', zIndex: 1 }}>
        {/* Elegant Header with Logo */}
        <AppHeader 
          title="Welcome to Midnight Bank"
          subtitle="Privacy-preserving decentralized banking"
          logoSize={100}
        />
        
        {/* Connection Status */}
        <Box display="flex" justifyContent="center" mb={6}>
          {!isConnected && (
            <Alert 
              severity="warning" 
              sx={{ 
                maxWidth: 600,
                width: '100%',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 193, 7, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(255, 243, 224, 0.8) 0%, rgba(255, 235, 204, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${mode === 'dark' ? 'rgba(255, 193, 7, 0.3)' : 'rgba(255, 152, 0, 0.3)'}`,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <Typography variant="body1" gutterBottom sx={{ fontWeight: theme.typography.fontWeight.medium }}>
                Connect your Lace wallet to access banking features
              </Typography>
              <ThemedButton 
                variant="secondary" 
                startIcon={connecting ? <CircularProgress size={16} /> : <AccountBalanceWallet />}
                onClick={handleConnect}
                disabled={connecting}
                sx={{ 
                  mt: 2,
                }}
              >
                {connecting ? 'Connecting...' : 'Connect Lace Wallet'}
              </ThemedButton>
            </Alert>
          )}

          {isConnected && (
            <Alert 
              severity="success" 
              sx={{ 
                maxWidth: 600,
                width: '100%',
                background: mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(220, 252, 231, 0.8) 0%, rgba(187, 247, 208, 0.8) 100%)',
                backdropFilter: 'blur(10px)',
                border: `1px solid ${mode === 'dark' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(22, 163, 74, 0.3)'}`,
                borderRadius: theme.borderRadius.lg,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeight.medium }}>
                ✅ Wallet connected! You can now create banks and accounts.
              </Typography>
            </Alert>
          )}
        </Box>
        
        {/* Action Buttons */}
        <Box display="flex" justifyContent="center" gap={3} mb={8}>
          <ThemedButton 
            variant="primary" 
            size="large"
            startIcon={<Add />}
            onClick={onCreateBank}
            disabled={!isConnected}
            sx={{
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              transform: 'translateY(0px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            Create New Bank
          </ThemedButton>
          
          <ThemedButton 
            variant="outlined"
            size="large"
            startIcon={<Launch />}
            onClick={onJoinBank}
            disabled={!isConnected}
            sx={{
              px: 4,
              py: 2,
              fontSize: '1.1rem',
              backgroundColor: 'transparent',
              backdropFilter: 'blur(10px)',
              border: `2px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              '&:hover': {
                backgroundColor: mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            Join Existing Bank
          </ThemedButton>
        </Box>
        
        {/* Banks Section */}
        {banks.length === 0 ? (
          <Box textAlign="center" py={8}>
            <Typography 
              variant="h5" 
              color="text.secondary" 
              gutterBottom
              sx={{ 
                opacity: 0.7,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              No banks yet
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ opacity: 0.6 }}
            >
              Create your first bank or join an existing one to get started with privacy-preserving banking.
            </Typography>
          </Box>
        ) : (
          <>
            <Box textAlign="center" mb={6}>
              <Typography 
                variant="h4" 
                sx={{
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                  mb: 2,
                }}
              >
                Your Banks
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ opacity: 0.8 }}>
                Manage your decentralized banking accounts
              </Typography>
            </Box>
            
            <Box 
              display="grid" 
              gridTemplateColumns={{ 
                xs: '1fr', 
                md: 'repeat(auto-fit, minmax(450px, 1fr))' 
              }}
              gap={4}
              justifyItems="center"
            >
              {banks.map((bank) => {
                const accounts = listAccountsForBank(bank.contractAddress);
                return (
                  <BankCard
                    key={bank.contractAddress}
                    bank={bank}
                    accounts={accounts}
                    onOpenBank={onOpenBank}
                    isConnected={isConnected}
                  />
                );
              })}
            </Box>
          </>
        )}
      </Container>
    </GradientBackground>
  );
};


