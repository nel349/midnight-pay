import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Chip, IconButton } from '@mui/material';
import { Refresh, Notifications } from '@mui/icons-material';
import { BankAPI } from '@midnight-bank/bank-api';
import { useAuthorizationUpdates } from '../hooks/useAuthorizationUpdates';
import { ThemedButton } from './ThemedButton';
import { usePinSession } from '../contexts/PinSessionContext';

interface AuthorizationNotificationsProps {
  bankAPI: BankAPI | null;
  onError?: (error: string) => void;
  onSuccess?: (message: string) => void;
}

export function AuthorizationNotifications({ 
  bankAPI, 
  onError, 
  onSuccess 
}: AuthorizationNotificationsProps) {
  const { getPin } = usePinSession();
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  
  const {
    pendingRequests,
    outgoingRequests,
    pendingClaims,
    refresh,
    hasIncomingRequests,
    hasOutgoingRequests,
    hasPendingClaims
  } = useAuthorizationUpdates(bankAPI);

  const isProcessing = (actionKey: string) => processingActions.has(actionKey);

  const setProcessing = (actionKey: string, processing: boolean) => {
    setProcessingActions(prev => {
      const newSet = new Set(prev);
      if (processing) {
        newSet.add(actionKey);
      } else {
        newSet.delete(actionKey);
      }
      return newSet;
    });
  };

  const handleApproveRequest = async (senderUserId: string) => {
    if (!bankAPI) return;
    
    const maxAmount = prompt('Enter the maximum amount they can send you (e.g., 500.00):');
    if (!maxAmount || !maxAmount.trim()) return;
    
    const pin = await getPin('Enter your PIN to approve authorization', bankAPI);
    
    const actionKey = `approve-${senderUserId}`;
    setProcessing(actionKey, true);
    
    try {
      await bankAPI.approveTransferAuthorization(pin, senderUserId, maxAmount);
      onSuccess?.(`✅ Approved authorization for ${senderUserId} (max: $${maxAmount})`);
      refresh();
    } catch (error) {
      onError?.(`Failed to approve authorization: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(actionKey, false);
    }
  };

  const handleClaimTransfer = async (senderUserId: string) => {
    if (!bankAPI) return;
    
    const pin = await getPin('Enter your PIN to claim transfer', bankAPI);
    
    const actionKey = `claim-${senderUserId}`;
    setProcessing(actionKey, true);
    
    try {
      // Preflight: ensure a pending claim exists for this sender
      const claims = await bankAPI.getPendingClaims();
      const hasClaim = claims.some(c => c.senderUserId === senderUserId);
      if (!hasClaim) {
        onError?.('No pending transfer found for this sender. Please wait a few seconds and refresh.');
        return;
      }

      await bankAPI.claimAuthorizedTransfer(pin, senderUserId);
      onSuccess?.(`💰 Successfully claimed transfer from ${senderUserId}!`);
      refresh();
    } catch (error) {
      onError?.(`Failed to claim transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(actionKey, false);
    }
  };

  if (!bankAPI) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary">Connect to bank to see notifications</Typography>
        </CardContent>
      </Card>
    );
  }

  const totalNotifications = pendingRequests.length + outgoingRequests.length + pendingClaims.length;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            <Typography variant="h6">
              Real-time Notifications
            </Typography>
            {totalNotifications > 0 && (
              <Chip 
                label={totalNotifications} 
                size="small"
                sx={{
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontSize: '0.75rem',
                  height: '24px',
                  minWidth: '24px',
                  '& .MuiChip-label': {
                    padding: '0 6px',
                    fontSize: '0.75rem',
                  }
                }}
              />
            )}
          </Box>
          <IconButton onClick={refresh} size="small">
            <Refresh />
          </IconButton>
        </Box>

        {/* Incoming Authorization Requests */}
        {hasIncomingRequests && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              📤 Authorization Requests
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingRequests.map(request => (
                <Card 
                  key={`${request.senderUserId}-${request.requestedAt}`} 
                  sx={{ bgcolor: 'info.lighter', border: '1px solid', borderColor: 'info.light' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">
                          <strong>{request.senderUserId}</strong> wants to send you money
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Requested: {new Date(request.requestedAt * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                      <ThemedButton
                        onClick={() => handleApproveRequest(request.senderUserId)}
                        disabled={isProcessing(`approve-${request.senderUserId}`)}
                        variant="outlined"
                        sx={{
                          marginLeft: 'auto',
                        }}
                      >
                        {isProcessing(`approve-${request.senderUserId}`) 
                          ? '⏳ Approving...' 
                          : '✅ Set Limit & Approve'
                        }
                      </ThemedButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Outgoing Requests Status */}
        {hasOutgoingRequests && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              📨 Your Requests
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {outgoingRequests.map(request => (
                <Card 
                  key={`${request.recipientUserId}-${request.requestedAt}`} 
                  sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.light' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">
                          Request to <strong>{request.recipientUserId}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {request.status === 0 ? '⏳ Pending' : request.status === 1 ? '✅ Approved' : '❌ Rejected'}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(request.requestedAt * 1000).toLocaleString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}

        {/* Pending Transfers to Claim */}
        {hasPendingClaims && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              💰 Pending Transfers
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {pendingClaims.map((claim, idx) => (
                <Card 
                  key={`${claim.senderUserId}-${idx}`} 
                  sx={{ bgcolor: 'success.lighter', border: '1px solid', borderColor: 'success.light' }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body1">
                          <strong>{claim.senderUserId}</strong> sent you an encrypted transfer
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          💎 Amount hidden until claimed (zero-knowledge privacy)
                        </Typography>
                      </Box>
                      <Button
                        onClick={() => handleClaimTransfer(claim.senderUserId)}
                        disabled={isProcessing(`claim-${claim.senderUserId}`)}
                        variant="contained"
                        color="secondary"
                        size="small"
                      >
                        {isProcessing(`claim-${claim.senderUserId}`) 
                          ? '⏳ Claiming...' 
                          : '🔓 Claim Transfer'
                        }
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        )}
      
        {/* No Notifications */}
        {!hasIncomingRequests && !hasOutgoingRequests && !hasPendingClaims && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>
              📭
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              No pending authorization requests or transfers
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Updates automatically every 3 seconds via public ledger
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}