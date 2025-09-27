// Test commons for payment API - following bank pattern
// TODO: Implement test environment when docker compose setup is available

import { type PaymentProviders } from '../common-types.js';

// Placeholder for test environment configuration
export interface TestConfig {
  indexer: string;
  indexerWS: string;
  paymentZkConfigPath: string;
  proofServer: string;
}

// Placeholder for test environment class
export class TestEnvironment {
  // TODO: Implement test environment setup similar to bank
  // This would include:
  // - Docker compose container management
  // - Wallet creation and management
  // - Network configuration
  // - Test data setup
}

// Placeholder for test providers configuration
export class TestProviders {
  // TODO: Implement provider configuration for testing
  async configurePaymentProviders(/* wallet, config */): Promise<PaymentProviders> {
    throw new Error('Test environment not yet implemented');
  }
}

// Placeholder for in-memory private state provider
export function inMemoryPrivateStateProvider() {
  // TODO: Implement in-memory private state provider for testing
  // This should follow the same pattern as bank's in-memory provider
  throw new Error('In-memory private state provider not yet implemented');
}