import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BankAPI } from '@midnight-bank/bank-api';

interface PendingRequest {
  senderUserId: string;
  requestedAt: number;
}

interface PendingClaim {
  senderUserId: string;
  amount: bigint;
}

interface OutgoingRequest {
  recipientUserId: string;
  requestedAt: number;
  status: number;
}

export interface AuthorizedContact {
  userId: string;
  maxAmount: bigint;
}


export function useAuthorizationUpdates(bankAPI: BankAPI | null) {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Use RxJS state$ to detect blockchain changes
  useEffect(() => {
    if (!bankAPI) return;
    
    const subscription = bankAPI.state$.subscribe(() => {
      // Trigger refresh when blockchain state changes
      setLastUpdate(Date.now());
    });
    
    return () => subscription.unsubscribe();
  }, [bankAPI]);

  // React Query for pending authorization requests (Bob checks what Alice requested)
  const { data: pendingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['pendingAuthRequests', bankAPI?.userId, lastUpdate],
    queryFn: async () => {
      if (!bankAPI) return [];
      return bankAPI.getPendingAuthRequests();
    },
    enabled: !!bankAPI,
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 1000, // Consider data stale after 1 second
  });

  // React Query for outgoing requests (Alice checks her requests)
  const { data: outgoingRequests, refetch: refetchOutgoing } = useQuery({
    queryKey: ['outgoingAuthRequests', bankAPI?.userId, lastUpdate],
    queryFn: async () => {
      if (!bankAPI) return [];
      return bankAPI.getOutgoingAuthRequests();
    },
    enabled: !!bankAPI,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  // Pending claims derived from public mapping; no PIN needed
  const { data: pendingClaims, refetch: refetchClaims } = useQuery({
    queryKey: ['pendingClaims', bankAPI?.userId, lastUpdate],
    queryFn: async () => {
      if (!bankAPI) return [];
      return bankAPI.getPendingClaims();
    },
    enabled: !!bankAPI,
    refetchInterval: 3000,
    staleTime: 1000,
  });

  const { data: authorizedContacts, refetch: refetchContacts } = useQuery({
    queryKey: ['authorizedContacts', bankAPI?.userId],
    queryFn: async () => {
      if (!bankAPI) return [];
      return bankAPI.getAuthorizedContacts();
    },
    enabled: !!bankAPI,
    staleTime: 1000,
    refetchInterval: 3000,
  });

  const { data: incomingAuthorizations, refetch: refetchIncoming } = useQuery({
    queryKey: ['incomingAuthorizations', bankAPI?.userId, lastUpdate],
    queryFn: async () => {
      if (!bankAPI) return [];
      return bankAPI.getIncomingAuthorizations();
    },
    enabled: !!bankAPI,
    staleTime: 1000,
    refetchInterval: 3000,
  });

  const refresh = () => {
    refetchRequests();
    refetchOutgoing();
    refetchClaims();
    refetchContacts();
    refetchIncoming();
  };

  return {
    authorizedContacts: (authorizedContacts || []) as AuthorizedContact[],
    incomingAuthorizations: (incomingAuthorizations || []) as AuthorizedContact[],
    // Incoming requests (for recipients)
    pendingRequests: (pendingRequests || []) as PendingRequest[],
    
    // Outgoing requests (for senders)
    outgoingRequests: (outgoingRequests || []) as OutgoingRequest[],
    
    // Pending transfers to claim
    pendingClaims: (pendingClaims || []) as PendingClaim[],
    
    // Manual refresh function
    refresh,
    
    // Loading states
    isLoading: !bankAPI,
    
    // Helper functions
    hasIncomingRequests: (pendingRequests || []).length > 0,
    hasOutgoingRequests: (outgoingRequests || []).length > 0,
    hasPendingClaims: (pendingClaims || []).length > 0,
  };
}