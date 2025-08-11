import React, { useCallback, useMemo, useState } from 'react';
import { Button, Card, CardContent, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import type { Logger } from 'pino';
import { BankAPI } from '@midnight-bank/bank-api';
import { firstValueFrom, filter } from 'rxjs';
import { useBankWallet } from '../components/BankWallet';

export interface OnboardingProps { logger: Logger; onComplete: (contractAddress: string) => void }

const Onboarding: React.FC<OnboardingProps> = ({ logger, onComplete }) => {
  const { providers, isConnected, connect } = useBankWallet();
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [pin, setPin] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('50.00');
  const [working, setWorking] = useState(false);
  const pinValid = useMemo(() => pin.length >= 4 && pin.length <= 8 && /^\d+$/.test(pin), [pin]);

  const onDeploy = useCallback(async () => {
    logger.info('onDeploy: Starting…');
    try {
      setWorking(true);
      const accountId = crypto.randomUUID();
      const api = await BankAPI.deploy(accountId, providers, logger);
      setContractAddress(api.deployedContractAddress);
    } catch (e) {
      logger.error(e, 'Failed to deploy bank contract');
    } finally {
      setWorking(false);
    }
  }, [providers, logger]);

  const onCreate = useCallback(async () => {
    if (!contractAddress) return;
    try {
      setWorking(true);
      const accountId = crypto.randomUUID();
      const api = await BankAPI.subscribe(accountId, providers, contractAddress, logger);
      await api.createAccount(pin, initialDeposit);
      const ready = await firstValueFrom(api.state$.pipe(filter((s) => s.accountExists === true)));
      logger.info({ event: 'onboard_ready', address: contractAddress, balance: ready.balance.toString() });
      await api.verifyAccountStatus(pin);
      onComplete(contractAddress);
    } catch (e) {
      logger.error(e, 'Failed to create bank account');
    } finally {
      setWorking(false);
    }
  }, [contractAddress, providers, logger, pin, initialDeposit, onComplete]);

  return (
    <Card sx={{ backgroundColor: 'transparent' }}>
      <CardContent>
        <Typography variant="h1" color="primary.dark" align="center" gutterBottom>
          Onboard Bank Account
        </Typography>
        <Grid container spacing={2} direction="column" alignItems="center">
          {!isConnected && (
            <Grid item>
              <Button variant="outlined" onClick={() => void connect()} disabled={working}>
                {working ? <CircularProgress size={16} /> : 'Connect Lace Wallet'}
              </Button>
            </Grid>
          )}
          <Grid item>
            <Button variant="outlined" onClick={onDeploy} disabled={working}>
              {working && !contractAddress ? <CircularProgress size={16} /> : 'Deploy Contract'}
            </Button>
          </Grid>
          {contractAddress && (
            <>
              <Grid item>
                <TextField
                  label="PIN (4-8 digits)"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
              <Grid item>
                <TextField
                  label="Initial Deposit (e.g. 50.00)"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                />
              </Grid>
              <Grid item>
                <Button variant="contained" onClick={onCreate} disabled={!pinValid || working}>
                  {working ? <CircularProgress size={16} /> : 'Create Account'}
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Onboarding;


