import React from 'react';
import { createRoot } from 'react-dom/client';
import pino from 'pino';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { RuntimeConfigurationProvider, useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { BankWalletProvider } from './components/BankWallet';
import { DeployedAccountProvider } from './contexts/DeployedAccountProviderContext';
import { App as RootApp } from './App';

const theme = createTheme();

const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BankWalletProvider logger={logger}>
        <DeployedAccountProvider logger={logger}>
          <RootApp />
        </DeployedAccountProvider>
      </BankWalletProvider>
    </ThemeProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeConfigurationProvider>
      <App />
    </RuntimeConfigurationProvider>
  </React.StrictMode>,
);


