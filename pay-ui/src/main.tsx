import React from 'react';
import { createRoot } from 'react-dom/client';
import pino from 'pino';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { RuntimeConfigurationProvider, useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { PaymentWalletProvider } from './components/PaymentWallet';
import { PinSessionProvider } from './contexts/PinSessionContext';
import { TransactionLoadingProvider } from './contexts/TransactionLoadingContext';
import { App as RootApp } from './App';
import { ThemeProvider, ThemeStyleInjector, DynamicMuiThemeProvider } from './theme';
import { TopBar } from './components';

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

const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' });
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider> {/* Midnight theme provider with automatic switching */}
        <ThemeStyleInjector />
        <DynamicMuiThemeProvider> {/* Dynamic Material-UI theme provider */}
          <CssBaseline />
          <TopBar />
          <PaymentWalletProvider logger={logger}>
              <PinSessionProvider>
                <TransactionLoadingProvider>
                  <RootApp />
                </TransactionLoadingProvider>
              </PinSessionProvider>
          </PaymentWalletProvider>
        </DynamicMuiThemeProvider>
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


