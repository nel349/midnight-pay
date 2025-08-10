import React from 'react';
import { createRoot } from 'react-dom/client';
import Onboarding from './pages/Onboarding';
import pino from 'pino';
import { type BankProviders } from '@midnight-bank/bank-api';

// Placeholder: providers should be constructed via wallet context (Phase 1 demo only)
const providers = {} as unknown as BankProviders;
const logger = pino({ level: 'info' });

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Onboarding providers={providers} logger={logger} onComplete={(addr) => console.log('Completed', addr)} />
  </React.StrictMode>,
);


