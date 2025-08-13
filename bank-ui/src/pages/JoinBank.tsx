import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Alert
} from '@mui/material';
import { ArrowBack, Launch } from '@mui/icons-material';
import { saveBank } from '../utils/AccountsLocalState';

export const JoinBank: React.FC = () => {
  const navigate = useNavigate();
  const [contractAddress, setContractAddress] = useState('');
  const [bankLabel, setBankLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoinBank = async () => {
    if (!contractAddress.trim()) {
      setError('Please enter a bank contract address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Basic validation - check if it looks like a valid address
      if (contractAddress.length < 10) {
        throw new Error('Invalid contract address format');
      }

      // Save bank to local storage
      saveBank({
        contractAddress: contractAddress.trim(),
        label: bankLabel.trim() || undefined,
        createdAt: new Date().toISOString()
      });

      // Navigate to the bank page
      navigate(`/bank/${contractAddress.trim()}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join bank');
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/accounts')}
            sx={{ mr: 2 }}
          >
            Back to Accounts
          </Button>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            Join Existing Bank
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Enter the contract address of an existing Midnight Bank to join it. 
          You'll be able to create accounts and manage banking operations within this bank.
        </Typography>

        <Box display="flex" flexDirection="column" gap={3}>
          <TextField
            label="Bank Contract Address"
            placeholder="0x123abc..."
            fullWidth
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            helperText="The deployed contract address of the bank you want to join"
            sx={{ fontFamily: 'monospace' }}
          />

          <TextField
            label="Bank Label (Optional)"
            placeholder="e.g., Family Bank, Company Bank"
            fullWidth
            value={bankLabel}
            onChange={(e) => setBankLabel(e.target.value)}
            helperText="A friendly name to identify this bank"
          />

          <Alert severity="info">
            <Typography variant="body2">
              <strong>Note:</strong> Joining a bank only adds it to your local list. 
              You'll still need to create accounts within the bank to start banking operations.
            </Typography>
          </Alert>

          <Button
            variant="contained"
            startIcon={<Launch />}
            onClick={handleJoinBank}
            disabled={loading || !contractAddress.trim()}
            size="large"
          >
            {loading ? 'Joining Bank...' : 'Join Bank'}
          </Button>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};