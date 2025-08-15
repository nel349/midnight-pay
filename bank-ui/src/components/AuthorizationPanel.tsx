import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import {
  PersonAdd,
  Send,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { utils, type BankAPI } from '@midnight-bank/bank-api';
import { useAuthorizationUpdates } from '../hooks/useAuthorizationUpdates';

interface AuthorizationPanelProps {
  bankAPI: BankAPI;
  isConnected: boolean;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}


export const AuthorizationPanel: React.FC<AuthorizationPanelProps> = ({
  bankAPI,
  isConnected,
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

  const { authorizedContacts } = useAuthorizationUpdates(bankAPI);

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="h6">
            Zelle-like Authorization System
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowInfoDialog(true)}
            sx={{ color: 'info.main' }}
          >
            <Info />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Set up one-time authorizations to send money seamlessly like Zelle
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
          <Button
            startIcon={<PersonAdd />}
            variant="outlined"
            onClick={() => setShowRequestDialog(true)}
            disabled={loading || !isConnected}
          >
            Request Authorization
          </Button>
          
          <Button
            startIcon={<CheckCircle />}
            variant="outlined"
            onClick={() => setShowApproveDialog(true)}
            disabled={loading || !isConnected}
          >
            Approve Request
          </Button>
          
          <Button
            startIcon={<Send />}
            variant="contained"
            onClick={() => setShowTransferDialog(true)}
            disabled={loading || !isConnected}
          >
            Send to Authorized
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Authorized Contacts
        </Typography>
        
        {authorizedContacts.length === 0 ? (
          <Alert severity="info">
            No authorized contacts yet. Request authorization from someone to start sending money!
          </Alert>
        ) : (
          <List>
            {authorizedContacts.map((contact, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={contact.userId}
                  secondary={`Max: $${utils.formatBalance(contact.maxAmount)}`}
                />
                <Chip
                  label={`Can Send`}
                  size="small"
                  color="success"
                />
              </ListItem>
            ))}
          </List>
        )}

        {/* Request Authorization Dialog */}
        <Dialog open={showRequestDialog} onClose={() => setShowRequestDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Request Transfer Authorization</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Ask someone to authorize you to send them money. They will set a maximum amount limit.
            </Typography>
            <TextField
              autoFocus
              label="Recipient User ID"
              placeholder="e.g., alice-bank-account"
              fullWidth
              value={recipientUserId}
              onChange={(e) => setRecipientUserId(e.target.value)}
              sx={{ mt: 2 }}
              helperText="This is their unique user identifier in the bank system"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button
              onClick={handleRequestAuthorization}
              variant="contained"
              disabled={loading || !recipientUserId.trim()}
            >
              {loading ? 'Requesting...' : 'Send Request'}
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