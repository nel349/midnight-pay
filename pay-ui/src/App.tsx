import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { CustomerWallet } from './pages/CustomerWallet';
import { useRuntimeConfiguration } from './config/RuntimeConfiguration';
import { NotificationProvider } from './contexts/NotificationContext';
import { PaymentWalletProvider } from './components/PaymentWallet';
import pino from 'pino';
import { NetworkId, setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

export const App: React.FC = () => {
  const cfg = useRuntimeConfiguration();
  const logger = pino({ level: cfg.LOGGING_LEVEL ?? 'info' , browser: { asObject: true } });
  setNetworkId((cfg.NETWORK_ID as NetworkId) ?? NetworkId.Undeployed);
  
  return (
    <NotificationProvider>
      <PaymentWalletProvider logger={logger}>
        <BrowserRouter basename="/">
          <Routes>
          <Route path="/" element={
            <Landing
              onMerchantSignup={() => (window.location.href = '/merchant/dashboard')}
              onCustomerSignup={() => (window.location.href = '/customer/wallet')}
            />
          } />
          <Route path="/merchant/dashboard" element={<MerchantDashboard />} />
          <Route path="/customer/wallet" element={<CustomerWallet />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PaymentWalletProvider>
    </NotificationProvider>
  );
};


