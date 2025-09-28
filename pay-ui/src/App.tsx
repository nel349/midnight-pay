import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Landing } from './pages/Landing';
import {
  MerchantDashboard,
  PaymentGateways,
  CreatePaymentGateway,
  JoinPaymentGateway
} from './pages';
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
            {/* Landing page */}
            <Route path="/" element={
              <Landing
                onGetStarted={() => (window.location.href = '/gateways')}
              />
            } />

            {/* Payment Gateway Management */}
            <Route path="/gateways" element={<PaymentGateways />} />
            <Route path="/create-gateway" element={
              <CreatePaymentGateway onComplete={(address) => window.location.href = '/gateways'} />
            } />
            <Route path="/join-gateway" element={<JoinPaymentGateway />} />

            {/* Role-based dashboards */}
            <Route path="/merchant" element={<MerchantDashboard />} />
            <Route path="/customer" element={<CustomerWallet />} />

            {/* Legacy routes for backward compatibility */}
            <Route path="/merchant/dashboard" element={<Navigate to="/merchant" replace />} />
            <Route path="/customer/wallet" element={<Navigate to="/customer" replace />} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </PaymentWalletProvider>
    </NotificationProvider>
  );
};


