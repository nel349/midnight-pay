import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { AccountsHome } from './pages/AccountsHome';
import { AccountDetails } from './pages/AccountDetails';
import { BankDetails } from './pages/BankDetails';
import { JoinBank } from './pages/JoinBank';
import CreateBank from './pages/CreateBank';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { NotificationProvider } from './contexts/NotificationContext';
import pino from 'pino';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' , browser: { asObject: true } });
  setNetworkId((cfg.NETWORK_ID as NetworkId) ?? NetworkId.Undeployed);
  
  return (
    <NotificationProvider>
      <BrowserRouter basename="/">
        <Routes>
          <Route path="/" element={
            <Landing
              onMerchantSignup={() => (window.location.href = '/merchant/dashboard')}
              onCustomerSignup={() => (window.location.href = '/customer/wallet')}
            />
          } />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/customer/wallet" element={<MerchantDashboard />} /> {/* Placeholder for now */}

          {/* Keep original bank routes for compatibility */}
          <Route path="/accounts" element={
            <AccountsHome
              onCreateBank={() => (window.location.href = '/bank/create')}
              onJoinBank={() => (window.location.href = '/bank/join')}
              onOpenBank={(bankAddress, userId) => {
                if (userId) {
                  window.location.href = `/bank/${bankAddress}/account/${userId}`;
                } else {
                  window.location.href = `/bank/${bankAddress}`;
                }
              }}
            />
          } />
          <Route path="/bank/create" element={<CreateBank logger={logger} onComplete={(bankAddress) => (window.location.href = `/bank/${bankAddress}`)} />} />
          <Route path="/bank/join" element={<JoinBank />} />
          <Route path="/bank/:bankAddress" element={<BankDetails />} />
          <Route path="/bank/:bankAddress/account/:userId" element={<AccountDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
};


