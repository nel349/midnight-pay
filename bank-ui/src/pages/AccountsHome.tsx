import React, { useEffect, useMemo } from 'react';
import { Button, Card, CardContent, Typography, Box, Divider, Chip } from '@mui/material';
import { AccountBalance, Add, Launch } from '@mui/icons-material';
import { listBanks, listAccountsForBank } from '../utils/AccountsLocalState';
import { useBankWallet } from '../components/BankWallet';

export const AccountsHome: React.FC<{ 
  onCreateBank: () => void; 
  onJoinBank: () => void;
  onOpenBank: (bankAddress: string, userId?: string) => void; 
}> = ({ onCreateBank, onJoinBank, onOpenBank }) => {


  // check if midnight lace is installed and connected, if connected, we should be able to see accounts and use those instead of creating new ones
  const { isConnected } = useBankWallet();

  useEffect(() => {
    console.log('isConnected', isConnected);
    if (isConnected) {
      const banks = listBanks();
      console.log('banks', banks);
    }
  }, [isConnected]);

  const banks = useMemo(() => listBanks(), []);
  
  return (
    <Card sx={{ backgroundColor: 'transparent' }}>
      <CardContent>
        <Typography variant="h1" color="primary.dark" align="center" gutterBottom>
          Welcome to Midnight Bank
        </Typography>
        
        <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
          {banks.length === 0 ? (
            <>
              <Box textAlign="center">
                <Typography color="text.secondary" gutterBottom>
                  No banks yet. Create your first bank or join an existing one to get started.
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={onCreateBank}
                >
                  Create New Bank
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<Launch />}
                  onClick={onJoinBank}
                >
                  Join Existing Bank
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box display="flex" gap={2}>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={onCreateBank}
                >
                  Create New Bank
                </Button>
                <Button 
                  variant="outlined"
                  startIcon={<Launch />}
                  onClick={onJoinBank}
                >
                  Join Existing Bank
                </Button>
              </Box>
              <Divider sx={{ width: '100%' }} />
              <Typography variant="h6">Your Banks</Typography>
            </>
          )}
          
          {banks.map((bank) => {
            const accounts = listAccountsForBank(bank.contractAddress);
            return (
              <Card key={bank.contractAddress} sx={{ width: '100%', maxWidth: 'fit-content' }}>
                <CardContent>
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
                      <Button 
                        size="small" 
                        onClick={() => onOpenBank(bank.contractAddress)}
                      >
                        Create Account
                      </Button>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1}>
                      {accounts.map((account) => (
                        <Button
                          key={`${account.bankContractAddress}-${account.userId}`}
                          variant="text"
                          onClick={() => onOpenBank(account.bankContractAddress, account.userId)}
                          sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                          <Typography variant="body2">
                            {account.label || account.userId}
                          </Typography>
                        </Button>
                      ))}
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => onOpenBank(bank.contractAddress)}
                        sx={{ alignSelf: 'flex-start', mt: 1 }}
                      >
                        + Create New Account
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};


