import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AccountsHome } from './pages/AccountsHome';
import { AccountDetails } from './pages/AccountDetails';
import Onboarding from './pages/Onboarding';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import pino from 'pino';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' });
  setNetworkId((cfg.NETWORK_ID as NetworkId) ?? NetworkId.Undeployed);
  
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route path="/" element={<Navigate to="/accounts" replace />} />
        <Route path="/accounts" element={<AccountsHome onCreate={() => (window.location.href = '/accounts/create')} onOpen={(addr) => (window.location.href = `/account/${addr}`)} />} />
        <Route path="/accounts/create" element={<Onboarding logger={logger} onComplete={(addr) => (window.location.href = `/account/${addr}`)} />} />
        <Route path="/account/:addr" element={<AccountDetails />} />
        <Route path="*" element={<Navigate to="/accounts" replace />} />
      </Routes>
    </BrowserRouter>
  );
};


