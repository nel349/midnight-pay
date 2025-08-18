import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BankAPI } from '@midnight-bank/bank-api';
import { usePinSession } from '../contexts/PinSessionContext';
import { ledger } from '@midnight-bank/bank-contract';

// Reactive balance hook that reads directly from ledger without transactions

export function useBalanceUpdates(bankAPI: BankAPI | null) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { getPin, isSessionActive } = usePinSession();
  
  // Use RxJS state$ to detect blockchain changes (same pattern as authorization)
  useEffect(() => {
    if (!bankAPI) return;
    
    const subscription = bankAPI.state$.subscribe(() => {
      // Trigger refresh when blockchain state changes
      setLastUpdate(Date.now());
    });
    
    return () => subscription.unsubscribe();
  }, [bankAPI]);

  // React Query for balance with PIN protection
  const { 
    data: balance, 
    error,
    isLoading,
    refetch: refetchBalance 
  } = useQuery({
    queryKey: ['userBalance', bankAPI?.userId, bankAPI?.deployedContractAddress, lastUpdate],
    queryFn: async (): Promise<bigint | null> => {
      if (!bankAPI) return null;
      
      try {
        // Read balance using pure circuit - no transaction required
        const pin = await getPin('Enter your PIN to access balance', bankAPI);
        const currentBalance = await bankAPI.readUserBalance(pin);
        
        return currentBalance;
      } catch (err) {
        console.warn('Balance fetch failed:', err);
        return null;
      }
    },
    enabled: !!bankAPI && isSessionActive(), // Only fetch when bankAPI exists and PIN session is active
    refetchInterval: 5000, // Poll every 5 seconds (same as authorization)
    staleTime: 5000, // Consider data stale after 5 seconds
    retry: 1, // Don't retry too aggressively on PIN failures
    retryDelay: 2000, // Wait 2 seconds before retry
  });

  // Derive helpful state indicators
  const hasBalance = balance !== null && balance !== undefined;
  const balanceAmount = balance || 0n;
  const isStale = Date.now() - lastUpdate < 2000; // True if blockchain changed in last 2 seconds

  return {
    balance: balanceAmount,
    hasBalance,
    isStale,
    isLoading,
    error: error as Error | null,
    
    // Manual refresh function
    refresh: refetchBalance,
    
    // Helper functions
    formatBalance: () => {
      if (!hasBalance) return '***';
      return (Number(balanceAmount) / 100).toFixed(2);
    },
    
    // Status checks
    isZeroBalance: balanceAmount === 0n,
    canSpend: (amount: bigint) => hasBalance && balanceAmount >= amount,
  };
}