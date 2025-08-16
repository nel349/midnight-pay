import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tab,
  Tabs
} from '@mui/material';
import {
  PersonAdd,
  Send,
  CheckCircle,
  CallMade,
  CallReceived,
  ContactsOutlined,
  HelpOutline,
  ContentCopy
} from '@mui/icons-material';
import { utils, type BankAPI } from '@midnight-bank/bank-api';
import { useAuthorizationUpdates } from '../hooks/useAuthorizationUpdates';
import { ThemedButton } from './ThemedButton';

interface AuthorizationPanelProps {
  bankAPI: BankAPI;
  isConnected: boolean;
  userId: string;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}


export const AuthorizationPanel: React.FC<AuthorizationPanelProps> = ({
  bankAPI,
  isConnected,
  userId,
  onError,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [recipientUserId, setRecipientUserId] = useState('');
  const [senderUserId, setSenderUserId] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const { authorizedContacts, incomingAuthorizations } = useAuthorizationUpdates(bankAPI);

  const handleRequestAuthorization = async () => {
    if (!bankAPI || !isConnected || !recipientUserId.trim()) return;
    
    try {
      setLoading(true);
      
      const pinInput = prompt('Enter your PIN to request transfer authorization:') ?? '';
      if (!pinInput) {
        setLoading(false);
        return;
      }

      await bankAPI.requestTransferAuthorization(pinInput, recipientUserId.trim());
      
      onSuccess(`Authorization request sent to ${recipientUserId}`);
      setRecipientUserId('');
      setShowRequestDialog(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to request authorization');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAuthorization = async () => {
    if (!bankAPI || !isConnected || !senderUserId.trim() || !maxAmount.trim()) return;
    
    try {
      setLoading(true);
      
      const pinInput = prompt('Enter your PIN to approve transfer authorization:') ?? '';
      if (!pinInput) {
        setLoading(false);
        return;
      }

      await bankAPI.approveTransferAuthorization(pinInput, senderUserId.trim(), maxAmount);
      
      onSuccess(`Authorization approved for ${senderUserId} with limit $${maxAmount}`);
      setSenderUserId('');
      setMaxAmount('');
      setShowApproveDialog(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to approve authorization');
    } finally {
      setLoading(false);
    }
  };

  const handleSendToAuthorized = async () => {
    if (!bankAPI || !isConnected || !recipientUserId.trim() || !transferAmount.trim()) return;
    
    try {
      setLoading(true);
      
      const pinInput = prompt('Enter your PIN to send authorized transfer:') ?? '';
      if (!pinInput) {
        setLoading(false);
        return;
      }

      await bankAPI.sendToAuthorizedUser(pinInput, recipientUserId.trim(), transferAmount);
      
      onSuccess(`Successfully sent $${transferAmount} to ${recipientUserId}`);
      setRecipientUserId('');
      setTransferAmount('');
      setShowTransferDialog(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send authorized transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Header with Help */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            💸 Transfer Money
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowInfoDialog(true)}
            sx={{ color: 'text.secondary' }}
          >
            <HelpOutline />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Send and receive money instantly with trusted contacts
        </Typography>

        {/* Tabs for Send/Receive */}
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          variant="fullWidth"
        >
          <Tab 
            icon={<CallMade />} 
            label="Send Money" 
            iconPosition="start"
          />
          <Tab 
            icon={<CallReceived />} 
            label="Receive Money" 
            iconPosition="start"
          />
        </Tabs>

        {/* Send Money Tab */}
        {tabValue === 0 && (
          <Box>
            {authorizedContacts.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>No contacts set up yet!</strong>
                </Typography>
                <Typography variant="body2">
                  To send money, you first need to ask someone to add you as a trusted contact.
                </Typography>
              </Alert>
            ) : (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  YOUR TRUSTED CONTACTS
                </Typography>
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {authorizedContacts.map((contact, index) => (
                    <ListItem key={index} divider={index < authorizedContacts.length - 1}>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 'medium' }}>
                            {contact.userId}
                          </Typography>
                        }
                        secondary={`You can send up to $${utils.formatBalance(contact.maxAmount)}`}
                      />
                      <ThemedButton
                        size="small"
                        variant="primary"
                        startIcon={<Send />}
                        onClick={() => {
                          setRecipientUserId(contact.userId);
                          setShowTransferDialog(true);
                        }}
                        disabled={loading || !isConnected}
                      >
                        Send
                      </ThemedButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                startIcon={<PersonAdd />}
                variant="outlined"
                onClick={() => setShowRequestDialog(true)}
                disabled={loading || !isConnected}
                sx={{ flex: 1, minWidth: 200 }}
              >
                Ask to Send Money To Someone
              </Button>
              
              {authorizedContacts.length > 0 && (
                <Button
                  startIcon={<Send />}
                  variant="contained"
                  onClick={() => setShowTransferDialog(true)}
                  disabled={loading || !isConnected}
                  sx={{ flex: 1, minWidth: 200 }}
                >
                  Send Money Now
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Receive Money Tab */}
        {tabValue === 1 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Easy to receive money!</strong>
              </Typography>
              <Typography variant="body2">
                When someone wants to send you money, they'll ask for permission first. 
                You can then approve them and set a spending limit.
              </Typography>
            </Alert>

            {/* Show who can send money to you */}
            {incomingAuthorizations.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  WHO CAN SEND YOU MONEY
                </Typography>
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {incomingAuthorizations.map((contact, index) => (
                    <ListItem key={index} divider={index < incomingAuthorizations.length - 1}>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontWeight: 'medium' }}>
                            {contact.userId}
                          </Typography>
                        }
                        secondary={`Can send you up to $${utils.formatBalance(contact.maxAmount)}`}
                      />
                      <Chip
                        label="Authorized"
                        size="small"
                        sx={{ 
                          ml: 1,
                          backgroundColor: '#4caf50',
                          color: 'white',
                          fontSize: '0.75rem',
                          height: '24px',
                          '& .MuiChip-label': {
                            padding: '0 8px',
                            fontSize: '0.75rem',
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <ContactsOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Share Your User ID
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Give this to people who want to send you money
              </Typography>
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  p: 2, 
                  bgcolor: 'background.default', 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
                onClick={() => {
                  navigator.clipboard?.writeText(userId);
                  onSuccess('User ID copied to clipboard!');
                }}
                title="Click to copy your user ID"
              >
                <Typography 
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.9rem',
                    wordBreak: 'break-all',
                    flex: 1,
                  }}
                >
                  {userId}
                </Typography>
                <ContentCopy sx={{ fontSize: '1rem', color: 'text.secondary' }} />
              </Box>
            </Box>
            
            <Button
              startIcon={<CheckCircle />}
              variant="outlined"
              onClick={() => setShowApproveDialog(true)}
              disabled={loading || !isConnected}
              fullWidth
              sx={{ mt: 2 }}
            >
              Approve Someone to Send Me Money
            </Button>
          </Box>
        )}

        {/* Request Authorization Dialog */}
        <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>💬 Ask to Send Money</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Request permission to send money to someone. They'll approve you and set how much you can send.
            </Typography>
            <TextField
              autoFocus
              label="Who do you want to send money to?"
              placeholder="Enter their user ID"
              fullWidth
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              sx={{ mt: 2 }}
              helperText="Ask them for their user ID if you don't know it"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequestAuthorization}
              variant="contained"
              disabled={loading || !recipientUserId.trim()}
            >
              {loading ? 'Sending Request...' : 'Ask Permission'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Approve Authorization Dialog */}
        <Dialog open={showApproveDialog} onClose={() => setShowApproveDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Approve Transfer Authorization</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Approve someone to send you money up to a maximum amount. This is like adding them as a trusted contact.
            </Typography>
            <TextField
              label="Sender User ID"
              placeholder="e.g., bob-bank-account"
              fullWidth
              value={senderUserId}
              onChange={(e) => setSenderUserId(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
              helperText="The user ID of who wants to send you money"
            />
            <TextField
              label="Maximum Amount ($)"
              placeholder="e.g., 500.00"
              fullWidth
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              helperText="Maximum amount they can send in a single transaction"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowApproveDialog(false)}>Cancel</Button>
            <Button
              onClick={handleApproveAuthorization}
              variant="contained"
              disabled={loading || !senderUserId.trim() || !maxAmount.trim()}
            >
              {loading ? 'Approving...' : 'Approve'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Send Transfer Dialog */}
        <Dialog open={showTransferDialog} onClose={() => setShowTransferDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Send to Authorized User</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Send money to someone who has already authorized you. No additional approval needed!
            </Typography>
            <TextField
              label="Recipient User ID"
              placeholder="e.g., alice-bank-account"
              fullWidth
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              sx={{ mt: 2, mb: 2 }}
              helperText="Must be someone who has authorized you"
            />
            <TextField
              label="Amount ($)"
              placeholder="e.g., 50.00"
              fullWidth
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              helperText="Amount must be within their authorized limit"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowTransferDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSendToAuthorized}
              variant="contained"
              disabled={loading || !recipientUserId.trim() || !transferAmount.trim()}
            >
              {loading ? 'Sending...' : 'Send Money'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={showInfoDialog} onClose={() => setShowInfoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>How Authorization Works</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              <strong>Zelle-like Authorization System:</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Request Authorization:</strong> Ask someone to authorize you to send them money
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Approve Request:</strong> They approve your request and set a maximum amount limit
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Send Money:</strong> Once authorized, you can send money instantly without additional approvals
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Benefits:</strong> One-time setup, instant transfers, recipient controls limits, privacy-preserving with zero-knowledge proofs.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowInfoDialog(false)}>Got it</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};