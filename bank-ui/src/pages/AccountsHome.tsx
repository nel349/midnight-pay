import React, { useMemo } from 'react';
import { Button, Card, CardContent, Grid, Typography } from '@mui/material';
import { listAccounts } from '../utils/AccountsLocalState';

export const AccountsHome: React.FC<{ onCreate: () => void; onOpen: (addr: string) => void }> = ({ onCreate, onOpen }) => {
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


