import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Chip, 
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { 
  Refresh, 
  Notifications,
  Send,
  HourglassEmpty,
  CheckCircle,
  Outbox,
  Cancel,
  AttachMoney,
  Lock,
  LockOpen,
  InboxOutlined
} from '@mui/icons-material';
import { BankAPI } from '@midnight-bank/bank-api';
import { useAuthorizationUpdates } from '../hooks/useAuthorizationUpdates';
import { ThemedButton, ThemedCard, ThemedCardContent } from './index';
import { usePinSession } from '../contexts/PinSessionContext';
import { useModalTransactionHandler } from '../utils/errorHandler';
import { useTransactionLoading } from '../contexts/TransactionLoadingContext';
import { useTheme } from '../theme/ThemeProvider';

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
  const { setTransactionLoading } = useTransactionLoading();
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  
  // Modal state for approval
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalSenderUserId, setApprovalSenderUserId] = useState('');
  const [approvalMaxAmount, setApprovalMaxAmount] = useState('');
  const [approvalDialogError, setApprovalDialogError] = useState<string | null>(null);
  const [approvalDialogSuccess, setApprovalDialogSuccess] = useState<string | null>(null);
  
  // Modal transaction handler for approval
  const approvalModalHandler = useModalTransactionHandler(
    () => {}, // Don't set global loading for individual notifications
    setApprovalDialogError,
    setApprovalDialogSuccess,
    {
      useGlobalError: onError,
      useGlobalSuccess: onSuccess
    },
    setTransactionLoading
  );
  
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

  const handleApproveRequest = (senderUserId: string) => {
    setApprovalSenderUserId(senderUserId);
    setShowApprovalDialog(true);
  };

  const executeApproval = async () => {
    if (!bankAPI || !approvalMaxAmount.trim()) return;
    
    await approvalModalHandler.execute(
      async () => {
        const pin = await getPin('Enter your PIN to approve authorization', bankAPI);
        await bankAPI.approveTransferAuthorization(pin, approvalSenderUserId, approvalMaxAmount);
        return { senderUserId: approvalSenderUserId, maxAmount: approvalMaxAmount };
      },
      'authorization approval',
      {
        onSuccess: ({ senderUserId, maxAmount }) => {
          setApprovalDialogSuccess(`Approved authorization for ${senderUserId} with limit $${maxAmount}`);
          setTimeout(async () => {
            setShowApprovalDialog(false);
            setApprovalDialogError(null);
            setApprovalDialogSuccess(null);
            setApprovalSenderUserId('');
            setApprovalMaxAmount('');
            await refresh();
          }, 1500);
        }
      }
    );
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
      onSuccess?.(`Successfully claimed transfer from ${senderUserId}!`);
      refresh();
    } catch (error) {
      onError?.(`Failed to claim transfer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(actionKey, false);
    }
  };

  const { theme, mode } = useTheme();
  
  if (!bankAPI) {
    return (
      <ThemedCard sx={{ height: 'fit-content' }}>
        <ThemedCardContent>
          <Typography color="text.secondary">Connect to bank to see notifications</Typography>
        </ThemedCardContent>
      </ThemedCard>
    );
  }

  const totalNotifications = pendingRequests.length + outgoingRequests.length + pendingClaims.length;

  return (
    <>
    <ThemedCard sx={{ height: 'fit-content', minHeight: '350px' }}>
      <ThemedCardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: theme.spacing[3] }}>
          <Box
            sx={{
              p: 2,
              borderRadius: theme.borderRadius.md,
              background: mode === 'dark'
                ? `linear-gradient(135deg, ${theme.colors.secondary[600]}33 0%, ${theme.colors.secondary[500]}33 100%)`
                : `linear-gradient(135deg, ${theme.colors.secondary[500]}1A 0%, ${theme.colors.secondary[600]}1A 100%)`,
              mr: theme.spacing[3],
            }}
          >
            <Notifications 
              sx={{ 
                fontSize: '1.5rem',
                color: theme.colors.text.primary,
              }} 
            />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1], flex: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: theme.colors.text.primary,
                fontWeight: theme.typography.fontWeight.bold,
              }}
            >
              Real-time Notifications
            </Typography>
            {totalNotifications > 0 && (
              <Chip 
                label={totalNotifications} 
                size="small"
                sx={{
                  backgroundColor: theme.colors.error[500],
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
          <IconButton 
            onClick={refresh} 
            size="small"
            sx={{ color: theme.colors.text.secondary }}
          >
            <Refresh />
          </IconButton>
        </Box>

        {/* Content Area with flexible height */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
          {/* Incoming Authorization Requests */}
          {hasIncomingRequests && (
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.colors.text.secondary, 
                  fontWeight: theme.typography.fontWeight.medium,
                  mb: theme.spacing[2],
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                  <Send sx={{ fontSize: '0.875rem', color: theme.colors.info[500] }} />
                  Authorization Requests
                </Box>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {pendingRequests.map(request => (
                  <ThemedCard 
                    key={`${request.senderUserId}-${request.requestedAt}`} 
                    sx={{ 
                      backgroundColor: mode === 'dark' 
                        ? theme.colors.info[500] + '20'
                        : theme.colors.info[50], 
                      border: '1px solid', 
                      borderColor: theme.colors.info[500] + '40' 
                    }}
                  >
                    <ThemedCardContent sx={{ py: theme.spacing[2] }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.medium }}
                          >
                            <strong>{request.senderUserId}</strong> wants to send you money
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: theme.colors.text.secondary }}
                          >
                            {new Date(request.requestedAt * 1000).toLocaleString()}
                          </Typography>
                        </Box>
                        <ThemedButton
                          onClick={() => handleApproveRequest(request.senderUserId)}
                          disabled={isProcessing(`approve-${request.senderUserId}`)}
                          variant="outlined"
                          size="small"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                            {isProcessing(`approve-${request.senderUserId}`) ? (
                              <>
                                <HourglassEmpty sx={{ fontSize: '1rem' }} />
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle sx={{ fontSize: '1rem' }} />
                                Approve
                              </>
                            )}
                          </Box>
                        </ThemedButton>
                      </Box>
                    </ThemedCardContent>
                  </ThemedCard>
                ))}
              </Box>
            </Box>
          )}

          {/* Outgoing Requests Status */}
          {hasOutgoingRequests && (
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.colors.text.secondary, 
                  fontWeight: theme.typography.fontWeight.medium,
                  mb: theme.spacing[2],
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                  <Outbox sx={{ fontSize: '0.875rem', color: theme.colors.warning[500] }} />
                  Your Requests
                </Box>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {outgoingRequests.map(request => (
                  <ThemedCard 
                    key={`${request.recipientUserId}-${request.requestedAt}`} 
                    sx={{ 
                      backgroundColor: mode === 'dark' 
                        ? theme.colors.warning[500] + '20'
                        : theme.colors.warning[50], 
                      border: '1px solid', 
                      borderColor: theme.colors.warning[500] + '40' 
                    }}
                  >
                    <ThemedCardContent sx={{ py: theme.spacing[2] }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.medium }}
                          >
                            Request to <strong>{request.recipientUserId}</strong>
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: theme.colors.text.secondary }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                              Status:
                              {request.status === 0 ? (
                                <><HourglassEmpty sx={{ fontSize: '0.875rem', color: theme.colors.warning[500] }} /> Pending</>
                              ) : request.status === 1 ? (
                                <><CheckCircle sx={{ fontSize: '0.875rem', color: theme.colors.success[500] }} /> Approved</>
                              ) : (
                                <><Cancel sx={{ fontSize: '0.875rem', color: theme.colors.error[500] }} /> Rejected</>
                              )}
                            </Box>
                          </Typography>
                        </Box>
                        <Typography 
                          variant="caption" 
                          sx={{ color: theme.colors.text.secondary }}
                        >
                          {new Date(request.requestedAt * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                    </ThemedCardContent>
                  </ThemedCard>
                ))}
              </Box>
            </Box>
          )}

          {/* Pending Transfers to Claim */}
          {hasPendingClaims && (
            <Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.colors.text.secondary, 
                  fontWeight: theme.typography.fontWeight.medium,
                  mb: theme.spacing[2],
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                  <AttachMoney sx={{ fontSize: '0.875rem', color: theme.colors.success[500] }} />
                  Pending Transfers
                </Box>
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[2] }}>
                {pendingClaims.map((claim, idx) => (
                  <ThemedCard 
                    key={`${claim.senderUserId}-${idx}`} 
                    sx={{ 
                      backgroundColor: mode === 'dark' 
                        ? theme.colors.success[500] + '20'
                        : theme.colors.success[50], 
                      border: '1px solid', 
                      borderColor: theme.colors.success[500] + '40' 
                    }}
                  >
                    <ThemedCardContent sx={{ py: theme.spacing[2] }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography 
                            variant="body2" 
                            sx={{ color: theme.colors.text.primary, fontWeight: theme.typography.fontWeight.medium }}
                          >
                            <strong>{claim.senderUserId}</strong> sent you an encrypted transfer
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ color: theme.colors.text.secondary }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                              <Lock sx={{ fontSize: '0.875rem', color: theme.colors.text.secondary }} />
                              Amount hidden until claimed
                            </Box>
                          </Typography>
                        </Box>
                        <ThemedButton
                          onClick={() => handleClaimTransfer(claim.senderUserId)}
                          disabled={isProcessing(`claim-${claim.senderUserId}`)}
                          variant="primary"
                          size="small"
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
                            {isProcessing(`claim-${claim.senderUserId}`) ? (
                              <>
                                <HourglassEmpty sx={{ fontSize: '1rem' }} />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <LockOpen sx={{ fontSize: '1rem' }} />
                                Claim
                              </>
                            )}
                          </Box>
                        </ThemedButton>
                      </Box>
                    </ThemedCardContent>
                  </ThemedCard>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      
        {/* No Notifications */}
        {!hasIncomingRequests && !hasOutgoingRequests && !hasPendingClaims && (
          <Box sx={{ 
            textAlign: 'center', 
            py: theme.spacing[4],
            color: theme.colors.text.secondary 
          }}>
            <InboxOutlined 
              sx={{ 
                fontSize: '4rem', 
                color: theme.colors.text.secondary,
                mb: theme.spacing[2]
              }} 
            />
            <Typography 
              variant="body1"
              sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}
            >
              No pending authorization requests or transfers
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: theme.colors.text.secondary }}
            >
              Updates automatically via public ledger
            </Typography>
          </Box>
        )}
      </ThemedCardContent>
    </ThemedCard>

    {/* Approval Dialog */}
    <Dialog open={showApprovalDialog} onClose={() => {
      setShowApprovalDialog(false);
      setApprovalDialogError(null);
      setApprovalDialogSuccess(null);
      setApprovalSenderUserId('');
      setApprovalMaxAmount('');
    }} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[1] }}>
          <CheckCircle sx={{ color: theme.colors.success[500] }} />
          Approve Transfer Authorization
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Approve {approvalSenderUserId} to send you money up to a maximum amount. Set a limit to control how much they can send in a single transaction.
        </Typography>
        
        {/* Inline Modal Error/Success */}
        {approvalDialogError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Error:</strong> {approvalDialogError}
            </Typography>
          </Alert>
        )}
        
        {approvalDialogSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Success:</strong> {approvalDialogSuccess}
            </Typography>
          </Alert>
        )}
        
        <TextField
          autoFocus
          label="Maximum Amount ($)"
          placeholder="e.g., 500.00"
          fullWidth
          value={approvalMaxAmount}
          onChange={(e) => setApprovalMaxAmount(e.target.value)}
          sx={{ mt: 2 }}
          helperText="Maximum amount they can send in a single transaction"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          setShowApprovalDialog(false);
          setApprovalDialogError(null);
          setApprovalDialogSuccess(null);
          setApprovalSenderUserId('');
          setApprovalMaxAmount('');
        }}>Cancel</Button>
        <Button
          onClick={executeApproval}
          variant="contained"
          disabled={!approvalMaxAmount.trim()}
        >
          Approve Authorization
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
}