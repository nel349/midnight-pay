import React from 'react';
import { createRoot } from 'react-dom/client';
import pino from 'pino';
import { RuntimeConfigurationProvider, useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { BankWalletProvider } from './components/BankWallet';
import { DeployedAccountProvider } from './contexts/DeployedAccountProviderContext';
import Onboarding from './pages/Onboarding';

const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' });
  return (
    <BankWalletProvider logger={logger}>
      <DeployedAccountProvider logger={logger}>
        <Onboarding logger={logger} onComplete={(addr) => logger.info({ event: 'onboard_complete', addr })} />
      </DeployedAccountProvider>
    </BankWalletProvider>
  );
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RuntimeConfigurationProvider>
      <App />
    </RuntimeConfigurationProvider>
  </React.StrictMode>,
);


