import React, { useState, useEffect } from 'react';
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
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Shield,
  PersonAdd,
  AccessTime,
  HelpOutline,
  Delete,
  CheckCircle,
  Warning
} from '@mui/icons-material';
import { utils, type BankAPI } from '@midnight-bank/bank-api';
import { ThemedButton } from './ThemedButton';
import { usePinSession } from '../contexts/PinSessionContext';

interface DisclosurePanelProps {
  bankAPI: BankAPI;
  isConnected: boolean;
  userId: string;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

interface DisclosurePermission {
  requesterId: string;
  permissionType: 'threshold' | 'exact';
  thresholdAmount: bigint;
  expiresAt: Date | null;
}

export const DisclosurePanel: React.FC<DisclosurePanelProps> = ({
  bankAPI,
  isConnected,
  userId,
  onError,
  onSuccess
}) => {
  const { getPin } = usePinSession();
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<DisclosurePermission[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Grant permission form state
  const [requesterId, setRequesterId] = useState('');
  const [permissionType, setPermissionType] = useState<'threshold' | 'exact'>('threshold');
  const [thresholdAmount, setThresholdAmount] = useState('');
  const [useAbsoluteDate, setUseAbsoluteDate] = useState(false);
  const [expirationHours, setExpirationHours] = useState('24');
  const [expirationDate, setExpirationDate] = useState('');
  const [neverExpires, setNeverExpires] = useState(false);
  
  // Verification form state
  const [verifyUserId, setVerifyUserId] = useState('');
  const [verifyAmount, setVerifyAmount] = useState('');
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [disclosedBalance, setDisclosedBalance] = useState<bigint | null>(null);
  
  // Inline error states
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  // Dialog states
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // Load permissions on component mount and when connected
  useEffect(() => {
    if (isConnected && bankAPI) {
      loadPermissions();
    }
  }, [isConnected, bankAPI]);

  const loadPermissions = async () => {
    try {
      const pinInput = await getPin('Enter your PIN to view disclosure permissions');
      
      const perms = await bankAPI.getDisclosurePermissions(pinInput);
      setPermissions(perms);
    } catch (err) {
      onError('Failed to load permissions: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleGrantPermission = async () => {
    if (!bankAPI || !isConnected || !requesterId.trim()) return;
    
    try {
      setLoading(true);
      
      const pinInput = await getPin('Enter your PIN to grant disclosure permission');

      if (useAbsoluteDate && expirationDate) {
        // Use absolute date API
        const expiresAt = new Date(expirationDate);
        await bankAPI.grantDisclosurePermissionUntil(
          pinInput, 
          requesterId.trim(), 
          permissionType, 
          thresholdAmount || '0.00', 
          expiresAt
        );
      } else {
        // Use relative hours API
        const hours = neverExpires ? 0 : parseInt(expirationHours || '24');
        await bankAPI.grantDisclosurePermission(
          pinInput, 
          requesterId.trim(), 
          permissionType, 
          thresholdAmount || '0.00', 
          hours
        );
      }
      
      onSuccess(`${permissionType === 'threshold' ? 'Threshold' : 'Exact'} disclosure permission granted to ${requesterId}`);
      
      // Reset form and reload permissions
      setRequesterId('');
      setThresholdAmount('');
      setExpirationHours('24');
      setExpirationDate('');
      setShowGrantDialog(false);
      await loadPermissions();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to grant permission');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyBalance = async () => {
    if (!bankAPI || !isConnected || !verifyUserId.trim() || !verifyAmount.trim()) return;
    
    try {
      setLoading(true);
      // Clear previous results and errors when starting new verification
      setVerificationResult(null);
      setDisclosedBalance(null);
      setVerifyError(null);
      setBalanceError(null);
      
      const pinInput = await getPin('Enter your PIN to verify balance');

      const result = await bankAPI.verifyBalanceThreshold(pinInput, verifyUserId.trim(), verifyAmount);
      setVerificationResult(result);
      onSuccess(`Threshold Verification: ${verifyUserId} ${result ? 'has' : 'does not have'} at least $${verifyAmount}`);
    } catch (err) {
      // Keep results cleared on error and show inline error
      setVerificationResult(null);
      setDisclosedBalance(null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify balance';
      setVerifyError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGetDisclosedBalance = async () => {
    if (!bankAPI || !isConnected || !verifyUserId.trim()) return;
    
    try {
      setLoading(true);
      // Clear previous results and errors when starting new balance request
      setVerificationResult(null);
      setDisclosedBalance(null);
      setVerifyError(null);
      setBalanceError(null);
      
      const pinInput = await getPin('Enter your PIN to get disclosed balance');

      const balance = await bankAPI.getDisclosedBalance(pinInput, verifyUserId.trim());
      setDisclosedBalance(balance);
      onSuccess(`${verifyUserId}'s balance: $${utils.formatBalance(balance)}`);
    } catch (err) {
      // Keep results cleared on error and show inline error
      setVerificationResult(null);
      setDisclosedBalance(null);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get disclosed balance';
      setBalanceError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokePermission = async (requesterId: string) => {
    if (!bankAPI || !isConnected) return;
    
    try {
      setLoading(true);
      
      const pinInput = await getPin(`Enter your PIN to revoke ${requesterId}'s permission`);

      await bankAPI.revokeDisclosurePermission(pinInput, requesterId);
      onSuccess(`Permission revoked for ${requesterId}`);
      await loadPermissions();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to revoke permission');
    } finally {
      setLoading(false);
    }
  };

  const formatExpirationDate = (expiresAt: Date | null): string => {
    if (!expiresAt) return 'Never expires';
    
    const now = new Date();
    const timeDiff = expiresAt.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Expired';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Expires in ${days} day${days > 1 ? 's' : ''} (${expiresAt.toLocaleDateString()})`;
    } else {
      return `Expires in ${hours} hour${hours > 1 ? 's' : ''} (${expiresAt.toLocaleTimeString()})`;
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Header with Help */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 'bold' }}>
            🔍 Balance Disclosure
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
          Manage who can verify your balance and grant selective disclosure permissions
        </Typography>

        {/* Tabs for Grant/Verify */}
        <Tabs 
          value={tabValue} 
          onChange={(_, newValue) => setTabValue(newValue)} 
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          variant="fullWidth"
        >
          <Tab 
            icon={<Shield />} 
            label="My Permissions" 
            iconPosition="start"
          />
          <Tab 
            icon={<Visibility />} 
            label="Verify Balances" 
            iconPosition="start"
          />
        </Tabs>

        {/* My Permissions Tab */}
        {tabValue === 0 && (
          <Box>
            {/* Granted Permissions List */}
            {permissions.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>
                  ACTIVE DISCLOSURE PERMISSIONS
                </Typography>
                <List sx={{ bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {permissions.map((permission, index) => (
                    <ListItem 
                      key={index} 
                      divider={index < permissions.length - 1}
                      sx={{ display: 'flex', alignItems: 'flex-start', pr: 8 }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 'medium' }}>
                              {permission.requesterId}
                            </Typography>
                            <Chip
                              label={permission.permissionType === 'threshold' ? 'Threshold' : 'Exact Balance'}
                              size="small"
                              color={permission.permissionType === 'threshold' ? 'primary' : 'secondary'}
                              sx={{
                                height: '24px',
                                '& .MuiChip-label': {
                                  padding: '0 8px',
                                  fontSize: '0.75rem',
                                }
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            {permission.permissionType === 'threshold' && (
                              <Typography variant="body2" color="text.secondary">
                                Can verify if you have ≥ ${utils.formatBalance(permission.thresholdAmount)}
                              </Typography>
                            )}
                            {permission.permissionType === 'exact' && (
                              <Typography variant="body2" color="text.secondary">
                                Can see your exact balance
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary">
                              {formatExpirationDate(permission.expiresAt)}
                            </Typography>
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleRevokePermission(permission.requesterId)}
                        disabled={loading}
                        sx={{ 
                          color: 'error.main',
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)'
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            {permissions.length === 0 && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>No disclosure permissions granted yet</strong>
                </Typography>
                <Typography variant="body2">
                  Grant permissions to allow specific people to verify your balance or see exact amounts.
                </Typography>
              </Alert>
            )}
            
            <ThemedButton
              startIcon={<PersonAdd />}
              variant="primary"
              onClick={() => setShowGrantDialog(true)}
              disabled={loading || !isConnected}
              fullWidth
            >
              Grant Disclosure Permission
            </ThemedButton>
          </Box>
        )}

        {/* Verify Balances Tab */}
        {tabValue === 1 && (
          <Box>
            <Alert severity="success" sx={{ mb: 3 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Verify someone's balance!</strong>
              </Typography>
              <Typography variant="body2">
                If they've granted you permission, you can check if they meet a threshold or see their exact balance.
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="User ID to verify"
                placeholder="e.g., alice-bank-account"
                value={verifyUserId}
                onChange={(e) => {
                  setVerifyUserId(e.target.value);
                  setVerifyError(null);
                  setBalanceError(null);
                }}
                sx={{ flex: 1 }}
                helperText="Must have granted you disclosure permission"
              />
              <TextField
                label="Threshold Amount ($)"
                placeholder="e.g., 100.00"
                value={verifyAmount}
                onChange={(e) => {
                  setVerifyAmount(e.target.value);
                  setVerifyError(null);
                  setBalanceError(null);
                }}
                sx={{ width: 200 }}
                helperText="Check if they have at least this amount"
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <ThemedButton
                startIcon={<CheckCircle />}
                variant="primary"
                onClick={handleVerifyBalance}
                disabled={loading || !isConnected || !verifyUserId.trim() || !verifyAmount.trim()}
                sx={{ flex: 1 }}
              >
                Verify Threshold
              </ThemedButton>
              
              <ThemedButton
                startIcon={<Visibility />}
                variant="secondary"
                onClick={handleGetDisclosedBalance}
                disabled={loading || !isConnected || !verifyUserId.trim()}
                sx={{ flex: 1 }}
              >
                Get Exact Balance
              </ThemedButton>
            </Box>

            {/* Inline Error Messages */}
            {verifyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Verification Error:</strong> {verifyError}
                </Typography>
              </Alert>
            )}

            {balanceError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Balance Error:</strong> {balanceError}
                </Typography>
              </Alert>
            )}

            {/* Verification Results */}
            {verificationResult !== null && (
              <Alert severity={verificationResult ? 'success' : 'warning'} sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Threshold Verification:</strong> {verifyUserId} {verificationResult ? 'has' : 'does not have'} at least ${verifyAmount}
                </Typography>
              </Alert>
            )}

            {disclosedBalance !== null && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Exact Balance:</strong> {verifyUserId} has ${utils.formatBalance(disclosedBalance)}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Grant Permission Dialog */}
        <Dialog open={showGrantDialog} onClose={() => setShowGrantDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Grant Disclosure Permission</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Grant someone permission to verify your balance. You can set limits and expiration.
            </Typography>
            
            <TextField
              autoFocus
              label="Requester User ID"
              placeholder="e.g., lender-bank-account"
              fullWidth
              value={requesterId}
              onChange={(e) => setRequesterId(e.target.value)}
              sx={{ mb: 3 }}
              helperText="Who should be able to verify your balance"
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Permission Type</InputLabel>
              <Select
                value={permissionType}
                onChange={(e) => setPermissionType(e.target.value as 'threshold' | 'exact')}
                label="Permission Type"
              >
                <MenuItem value="threshold">Threshold Verification</MenuItem>
                <MenuItem value="exact">Exact Balance Disclosure</MenuItem>
              </Select>
              <FormHelperText>
                {permissionType === 'threshold' 
                  ? 'They can only verify if you have at least a certain amount'
                  : 'They can see your exact balance amount'
                }
              </FormHelperText>
            </FormControl>

            {permissionType === 'threshold' && (
              <TextField
                label="Maximum Threshold ($)"
                placeholder="e.g., 1000.00"
                fullWidth
                value={thresholdAmount}
                onChange={(e) => setThresholdAmount(e.target.value)}
                sx={{ mb: 3 }}
                helperText="Maximum amount they can check against"
              />
            )}

            {/* Expiration Settings */}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Expiration Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={neverExpires}
                  onChange={(e) => setNeverExpires(e.target.checked)}
                />
              }
              label="Never expires"
              sx={{ mb: 2 }}
            />

            {!neverExpires && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={useAbsoluteDate}
                      onChange={(e) => setUseAbsoluteDate(e.target.checked)}
                    />
                  }
                  label="Set specific expiration date"
                  sx={{ mb: 2 }}
                />

                {useAbsoluteDate ? (
                  <TextField
                    label="Expiration Date & Time"
                    type="datetime-local"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    InputLabelProps={{ shrink: true }}
                  />
                ) : (
                  <TextField
                    label="Expires in (hours)"
                    type="number"
                    value={expirationHours}
                    onChange={(e) => setExpirationHours(e.target.value)}
                    fullWidth
                    sx={{ mb: 2 }}
                    helperText="24 = 1 day, 168 = 1 week"
                  />
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowGrantDialog(false)}>Cancel</Button>
            <Button
              onClick={handleGrantPermission}
              variant="contained"
              disabled={loading || !requesterId.trim()}
            >
              {loading ? 'Granting...' : 'Grant Permission'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Info Dialog */}
        <Dialog open={showInfoDialog} onClose={() => setShowInfoDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>How Balance Disclosure Works</DialogTitle>
          <DialogContent>
            <Typography variant="body2" paragraph>
              <strong>Privacy-Preserving Balance Verification:</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              1. <strong>Grant Permission:</strong> Give specific people permission to verify your balance
            </Typography>
            <Typography variant="body2" paragraph>
              2. <strong>Threshold Verification:</strong> They can check if you have at least a certain amount (Yes/No answer)
            </Typography>
            <Typography variant="body2" paragraph>
              3. <strong>Exact Balance:</strong> For trusted parties, allow them to see your exact balance
            </Typography>
            <Typography variant="body2" paragraph>
              4. <strong>Time-Limited:</strong> Set expiration dates to automatically revoke access
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Use Cases:</strong> Loan applications, insurance verification, business partnerships, family financial planning.
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