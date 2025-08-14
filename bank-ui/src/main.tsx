import React from 'react';
import { createRoot } from 'react-dom/client';
import pino from 'pino';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { RuntimeConfigurationProvider, useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { BankWalletProvider } from './components/BankWallet';
import { DeployedAccountProvider } from './contexts/DeployedAccountProviderContext';
import { App as RootApp } from './App';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2000, // 2 seconds - data stays fresh for 2 seconds
      refetchOnWindowFocus: true, // Refetch when user comes back to window  
      refetchInterval: 3000, // Auto-refetch every 3 seconds
      retry: 1,
    },
  },
});

const theme = createTheme();

const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BankWalletProvider logger={logger}>
          <DeployedAccountProvider logger={logger}>
            <RootApp />
          </DeployedAccountProvider>
        </BankWalletProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeConfigurationProvider>
      <App />
    </RuntimeConfigurationProvider>
  </React.StrictMode>,
);


