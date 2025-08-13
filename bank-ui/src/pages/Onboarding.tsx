import React, { useCallback, useMemo, useState } from 'react';
import { Button, Card, CardContent, CircularProgress, TextField, Typography, Box } from '@mui/material';
import type { Logger } from 'pino';
import { BankAPI } from '@midnight-bank/bank-api';
import { firstValueFrom, filter } from 'rxjs';
import { useBankWallet } from '../components/BankWallet';
import { saveAccount, saveBank } from '../utils/AccountsLocalState';

export interface OnboardingProps { logger: Logger; onComplete: (contractAddress: string) => void }

const Onboarding: React.FC<OnboardingProps> = ({ logger, onComplete }) => {
  const { providers, isConnected, connect } = useBankWallet();
  const [contractAddress, setContractAddress] = useState<string | undefined>(undefined);
  const [label, setLabel] = useState('');
  const [pin, setPin] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('50.00');
  const [working, setWorking] = useState(false);
  const pinValid = useMemo(() => pin.length >= 4 && pin.length <= 8 && /^\d+$/.test(pin), [pin]);

  const onCreateAccount = useCallback(async () => {
    logger.info('onCreateAccount: Starting…');
    try {
      setWorking(true);
      const accountId = crypto.randomUUID();
      const api = await BankAPI.deploy(accountId, providers, logger);
      setContractAddress(api.deployedContractAddress);
      await api.createAccount(accountId, pin, initialDeposit);
      const ready = await firstValueFrom(api.state$.pipe(filter((s) => s.accountExists === true)));
      logger.info({ event: 'onboard_ready', address: api.deployedContractAddress, balance: ready.balance.toString() });
      await api.verifyAccountStatus(pin);
      const now = new Date().toISOString();
      saveBank({
        contractAddress: api.deployedContractAddress,
        label: label || undefined,
        createdAt: now,
        lastUsedAt: now,
      });
      saveAccount({
        bankContractAddress: api.deployedContractAddress,
        userId: accountId,
        label: label || undefined,
        createdAt: now,
        lastUsedAt: now,
      });
      // Store account creation info for debugging if needed
      sessionStorage.setItem('lastAccountCreation', JSON.stringify({
        balance: ready.balance.toString(),
        contractAddress: api.deployedContractAddress,
        timestamp: new Date().toISOString()
      }));
      
      onComplete(api.deployedContractAddress);
    } catch (e) {
      logger.error(e, 'Failed to create bank account');
    } finally {
      setWorking(false);
    }
  }, [providers, logger, pin, initialDeposit, onComplete]);

  return (
    <Card sx={{ backgroundColor: 'transparent' }}>
      <CardContent>
        <Typography variant="h1" color="primary.dark" align="center" gutterBottom>
          Midnight Bank
        </Typography>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          {!isConnected && (
            <Box>
              <Button variant="outlined" onClick={() => void connect()} disabled={working}>
                {working ? <CircularProgress size={16} /> : 'Connect Lace Wallet'}
              </Button>
            </Box>
          )}
          <Box>
            <TextField label="Label (optional)" value={label} onChange={(e) => setLabel(e.target.value)} />
          </Box>
          <Box>
            <TextField
              label="PIN (4-8 digits)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
            />
          </Box>
          <Box>
            <TextField
              label="Initial Deposit (e.g. 50.00)"
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(e.target.value)}
            />
          </Box>
          <Box>
            <Button variant="contained" onClick={onCreateAccount} disabled={!pinValid || !isConnected || working}>
              {working ? <CircularProgress size={16} /> : 'Create Account'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Onboarding;


