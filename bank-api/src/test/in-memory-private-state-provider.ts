import { type PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ContractAddress, SigningKey } from '@midnight-ntwrk/compact-runtime';

/**
 * Simple in-memory implementation of private state provider for testing
 */
export function inMemoryPrivateStateProvider<PSI extends string = string, PS = any>(): PrivateStateProvider<PSI, PS> {
  const stateStore = new Map<PSI, PS>();
  const signingKeys = new Map<ContractAddress, SigningKey>();

  return {
    async set(privateStateId: PSI, state: PS): Promise<void> {
      stateStore.set(privateStateId, state);
    },

    async get(privateStateId: PSI): Promise<PS | null> {
      return stateStore.has(privateStateId) ? stateStore.get(privateStateId)! : null;
    },

    async remove(privateStateId: PSI): Promise<void> {
      stateStore.delete(privateStateId);
    },

    async clear(): Promise<void> {
      stateStore.clear();
    },

    async setSigningKey(address: ContractAddress, signingKey: SigningKey): Promise<void> {
      signingKeys.set(address, signingKey);
    },

    async getSigningKey(address: ContractAddress): Promise<SigningKey | null> {
      return signingKeys.has(address) ? signingKeys.get(address)! : null;
    },

    async removeSigningKey(address: ContractAddress): Promise<void> {
      signingKeys.delete(address);
    },

    async clearSigningKeys(): Promise<void> {
      signingKeys.clear();
    },
  };
}