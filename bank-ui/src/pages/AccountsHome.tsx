import React, { useEffect, useMemo } from 'react';
import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import { listAccounts } from '../utils/AccountsLocalState';
import { useBankWallet } from '../components/BankWallet';

export const AccountsHome: React.FC<{ onCreate: () => void; onOpen: (addr: string) => void }> = ({ onCreate, onOpen }) => {


  // check if midnight lace is installed and connected, if connected, we should be able to see accounts and use those instead of creating new ones
  const { isConnected } = useBankWallet();

  useEffect(() => {
    console.log('isConnected', isConnected);
    if (isConnected) {
      // we should be able to see accounts and use those instead of creating new ones
      // the problem is that we don't have a way to know if the accounts are the same as the ones in the wallet
      // so we need to check if the accounts are the same as the ones in the wallet
      // if they are, we should be able to use those instead of creating new ones
      const accounts = listAccounts();
      console.log('accounts', accounts);
    }
  }, [isConnected]);

  const accounts = useMemo(() => listAccounts(), []);
  return (
    <Card sx={{ backgroundColor: 'transparent' }}>
      <CardContent>
        <Typography variant="h1" color="primary.dark" align="center" gutterBottom>
          Welcome to Midnight Bank
        </Typography>
        <Grid container spacing={2} direction="column" alignItems="center">
          {accounts.length === 0 ? (
            <>
              <Grid item>
                <Typography color="text.secondary" align="center" gutterBottom>
                  No accounts saved yet. Create your first account to get started.
                </Typography>
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={onCreate}>Create Account</Button>
              </Grid>
            </>
          ) : (
            <>
              <Grid item>
                <Button variant="contained" onClick={onCreate}>Create New Account</Button>
              </Grid>
              <Grid item>
                <Typography variant="h6">Your Accounts</Typography>
              </Grid>
            </>
          )}
          {accounts.map((a) => (
            <Grid item key={a.address}>
              <Button variant="outlined" onClick={() => onOpen(a.address)}>
                {a.label ?? a.address}
              </Button>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};


