import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Alert,
  CircularProgress,
  Container,
  Stack,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  Remove,
  TrendingDown,
  Subscriptions,
  History,
  Payment,
} from '@mui/icons-material';
import { usePaymentWallet } from '../components/PaymentWallet';
import { PaymentAPI, SUBSCRIPTION_STATUS } from '@midnight-pay/pay-api';
import { usePaymentContract } from '../hooks/usePaymentContract';
import { take } from 'rxjs/operators';
import {
  ThemedButton,
  GradientBackground,
  AppHeader,
  ThemedCard,
  ThemedCardContent,
} from '../components';

interface CustomerStats {
  availableBalance: string;
  totalSpent: string;
  activeSubscriptions: number;
  lastActivity: string;
}

export const CustomerWallet: React.FC = () => {
  const { isConnected, connect } = usePaymentWallet();
  const {
    contractAddress,
    paymentAPI,
    entityId: customerId,
    isInitializing,
    error: contractError,
    setEntity
  } = usePaymentContract();
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    availableBalance: '0.00',
    totalSpent: '0.00',
    activeSubscriptions: 0,
    lastActivity: 'Never',
  });

  // Dialog states
  const [depositDialog, setDepositDialog] = useState(false);
  const [withdrawDialog, setWithdrawDialog] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Set up customer entity when connected but not set
  useEffect(() => {
    if (isConnected && !customerId && !isInitializing) {
      const setupCustomer = async () => {
        try {
          const generatedCustomerId = `customer-${Date.now()}`;
          await setEntity(generatedCustomerId, 'customer');
        } catch (error) {
          console.error('Failed to set up customer entity:', error);
        }
      };

      setupCustomer();
    }
  }, [isConnected, customerId, isInitializing, setEntity]);

  // Fetch real data from PaymentAPI
  useEffect(() => {
    if (paymentAPI && customerId) {
      const fetchCustomerData = async () => {
        try {
          const balance = await paymentAPI.getCustomerBalance(customerId);

          setStats({
            availableBalance: (Number(balance.availableBalance) / 100).toFixed(2),
            totalSpent: (Number(balance.totalSpent) / 100).toFixed(2),
            activeSubscriptions: balance.activeSubscriptions,
            lastActivity: balance.lastActivity > 0 ? new Date(balance.lastActivity).toLocaleDateString() : 'Never',
          });
        } catch (error) {
          console.error('Failed to fetch customer data:', error);
          // Keep default data on error
          setStats({
            availableBalance: '0.00',
            totalSpent: '0.00',
            activeSubscriptions: 0,
            lastActivity: 'Never',
          });
        }
      };

      fetchCustomerData();

      // Subscribe to real-time updates
      const subscription = paymentAPI.state$.subscribe(() => {
        fetchCustomerData();
      });

      return () => subscription.unsubscribe();
    }
  }, [paymentAPI, customerId]);

  const handleDeposit = async () => {
    if (!paymentAPI || !depositAmount || !customerId) return;

    try {
      setLoading(true);
      await paymentAPI.depositCustomerFunds(customerId, depositAmount);
      setDepositDialog(false);
      setDepositAmount('');
    } catch (error) {
      console.error('Deposit failed:', error);
      alert('Deposit failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!paymentAPI || !withdrawAmount || !customerId) return;

    try {
      setLoading(true);
      await paymentAPI.withdrawCustomerFunds(customerId, withdrawAmount);
      setWithdrawDialog(false);
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Withdrawal failed. Please check your balance and try again.');
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string;
    icon: React.ReactNode;
    color?: 'primary' | 'secondary' | 'success' | 'info';
  }> = ({ title, value, icon, color = 'primary' }) => (
    <ThemedCard>
      <ThemedCardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color: `${color}.main`, fontSize: 40 }}>
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              {value}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {title}
            </Typography>
          </Box>
        </Stack>
      </ThemedCardContent>
    </ThemedCard>
  );

  // Show setup flow if no contract or entity is set
  if (!isConnected || !contractAddress || !customerId) {
    return (
      <GradientBackground>
        <AppHeader />
        <Container maxWidth="md">
          <Box textAlign="center" sx={{ py: 8 }}>
            <AccountBalanceWallet sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
              {!isConnected ? 'Connect Your Lace Wallet' : 'Setting Up Payment Gateway'}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              {!isConnected
                ? 'To access your customer wallet and manage payments, please connect your Lace wallet. Enjoy private, secure transactions on the Midnight Network.'
                : isInitializing
                ? 'Initializing your payment gateway connection and customer account...'
                : 'Setting up your customer profile...'
              }
            </Typography>
            {contractError && (
              <Alert severity="error" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                Contract Error: {contractError.message}
              </Alert>
            )}
            <ThemedButton
              variant="primary"
              size="large"
              onClick={handleConnect}
              disabled={connecting || isInitializing}
              startIcon={
                connecting || isInitializing
                  ? <CircularProgress size={20} />
                  : <AccountBalanceWallet />
              }
              sx={{ px: 4, py: 2 }}
            >
              {connecting
                ? 'Connecting...'
                : isInitializing
                ? 'Setting Up...'
                : 'Connect Lace Wallet'
              }
            </ThemedButton>
          </Box>
        </Container>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <AppHeader />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Customer Wallet
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Chip
                  label="Connected"
                  color="success"
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  Manage your funds and subscriptions securely
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <ThemedButton
                variant="outlined"
                startIcon={<Remove />}
                size="small"
                onClick={() => setWithdrawDialog(true)}
                disabled={loading}
              >
                Withdraw
              </ThemedButton>
              <ThemedButton
                variant="primary"
                startIcon={<Add />}
                size="small"
                onClick={() => setDepositDialog(true)}
                disabled={loading}
              >
                Deposit Funds
              </ThemedButton>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Available Balance"
              value={`$${stats.availableBalance}`}
              icon={<AccountBalanceWallet />}
              color="success"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Total Spent"
              value={`$${stats.totalSpent}`}
              icon={<TrendingDown />}
              color="info"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Active Subscriptions"
              value={stats.activeSubscriptions.toString()}
              icon={<Subscriptions />}
              color="primary"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Last Activity"
              value={stats.lastActivity}
              icon={<History />}
              color="secondary"
            />
          </Box>
        </Box>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
            <ThemedCard>
              <ThemedCardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<Add />}
                      sx={{ py: 2 }}
                      onClick={() => setDepositDialog(true)}
                      disabled={loading}
                    >
                      Deposit Funds
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<Subscriptions />}
                      sx={{ py: 2 }}
                    >
                      Manage Subscriptions
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<History />}
                      sx={{ py: 2 }}
                    >
                      Transaction History
                    </ThemedButton>
                  </Box>
                </Box>
              </ThemedCardContent>
            </ThemedCard>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 32%' } }}>
            <ThemedCard>
              <ThemedCardContent>
                <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
                  Account Info
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Customer ID
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {customerId.slice(0, 20)}...
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Privacy Status
                    </Typography>
                    <Chip
                      label="ZK Protected"
                      color="success"
                      size="small"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 1.5,
                        py: 0.5
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Network
                    </Typography>
                    <Typography variant="body1">
                      Midnight Network
                    </Typography>
                  </Box>
                </Stack>
              </ThemedCardContent>
            </ThemedCard>
          </Box>
        </Box>

        {/* Recent Activity Placeholder */}
        <ThemedCard>
          <ThemedCardContent>
            <Typography variant="h6" component="h2" sx={{ mb: 3, fontWeight: 'bold' }}>
              Recent Transactions
            </Typography>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="textSecondary">
                Your transaction history will appear here as you make payments.
              </Typography>
              <ThemedButton
                variant="outlined"
                sx={{ mt: 2 }}
              >
                View All Transactions
              </ThemedButton>
            </Box>
          </ThemedCardContent>
        </ThemedCard>
      </Container>

      {/* Deposit Dialog */}
      <Dialog open={depositDialog} onClose={() => setDepositDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Deposit Funds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add funds to your wallet to enable payments and subscriptions.
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="10.00"
            inputProps={{ min: 0, step: 0.01 }}
          />
        </DialogContent>
        <DialogActions>
          <ThemedButton onClick={() => setDepositDialog(false)} variant="outlined">
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleDeposit}
            variant="primary"
            disabled={!depositAmount || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Add />}
          >
            {loading ? 'Processing...' : 'Deposit'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawDialog} onClose={() => setWithdrawDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Withdraw Funds</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Withdraw funds from your wallet. Available balance: ${stats.availableBalance}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Amount (USD)"
            type="number"
            fullWidth
            variant="outlined"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            placeholder="10.00"
            inputProps={{ min: 0, step: 0.01, max: parseFloat(stats.availableBalance) }}
          />
        </DialogContent>
        <DialogActions>
          <ThemedButton onClick={() => setWithdrawDialog(false)} variant="outlined">
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleWithdraw}
            variant="primary"
            disabled={!withdrawAmount || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Remove />}
          >
            {loading ? 'Processing...' : 'Withdraw'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </GradientBackground>
  );
};