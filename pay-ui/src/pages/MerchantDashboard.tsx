import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  Stack,
  Chip,
} from '@mui/material';
import {
  AccountBalanceWallet,
  Add,
  TrendingUp,
  Subscriptions,
  People,
  Download,
} from '@mui/icons-material';
import { usePaymentWallet } from '../components/PaymentWallet';
import { PaymentAPI, MERCHANT_TIER } from '@midnight-pay/pay-api';
import { take } from 'rxjs/operators';
import {
  ThemedButton,
  GradientBackground,
  AppHeader,
  ThemedCard,
  ThemedCardContent,
} from '../components';
import { useTheme } from '../theme';

interface MerchantStats {
  totalEarnings: string;
  activeSubscriptions: number;
  totalCustomers: number;
  thisMonthRevenue: string;
  availableBalance: string;
  merchantTier: MERCHANT_TIER;
}

export const MerchantDashboard: React.FC = () => {
  const { isConnected, connect, providers } = usePaymentWallet();
  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentAPI, setPaymentAPI] = useState<PaymentAPI | null>(null);
  const [merchantId] = useState(() => `merchant-${Date.now()}`); // In real app, this would be from auth
  const [stats, setStats] = useState<MerchantStats>({
    totalEarnings: '0.00',
    activeSubscriptions: 0,
    totalCustomers: 0,
    thisMonthRevenue: '0.00',
    availableBalance: '0.00',
    merchantTier: MERCHANT_TIER.unverified,
  });

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

  // Initialize PaymentAPI when connected
  useEffect(() => {
    if (isConnected && providers && !paymentAPI) {
      const initializeAPI = async () => {
        try {
          setLoading(true);
          // For demo, use a deployed contract address or deploy if needed
          const api = await PaymentAPI.build(merchantId, providers);
          setPaymentAPI(api);

          // Register merchant if not already registered
          try {
            await api.registerMerchant(merchantId, 'Demo Merchant Business');
          } catch (error) {
            // Merchant might already be registered, which is fine
            console.log('Merchant already registered or registration failed:', error);
          }
        } catch (error) {
          console.error('Failed to initialize PaymentAPI:', error);
        } finally {
          setLoading(false);
        }
      };

      initializeAPI();
    }
  }, [isConnected, providers, paymentAPI, merchantId]);

  // Fetch real data from PaymentAPI
  useEffect(() => {
    if (paymentAPI) {
      const fetchMerchantData = async () => {
        try {
          const balance = await paymentAPI.getMerchantBalance(merchantId);
          const state = await paymentAPI.state$.pipe(take(1)).toPromise();

          setStats({
            totalEarnings: (Number(balance.totalEarnings) / 100).toFixed(2),
            activeSubscriptions: balance.activeSubscribers,
            totalCustomers: balance.activeSubscribers, // For now, same as active subscriptions
            thisMonthRevenue: (Number(balance.totalEarnings) / 100).toFixed(2), // Simplified
            availableBalance: (Number(balance.availableBalance) / 100).toFixed(2),
            merchantTier: MERCHANT_TIER.unverified, // This would come from merchant info
          });
        } catch (error) {
          console.error('Failed to fetch merchant data:', error);
          // Keep mock data on error
          setStats({
            totalEarnings: '0.00',
            activeSubscriptions: 0,
            totalCustomers: 0,
            thisMonthRevenue: '0.00',
            availableBalance: '0.00',
            merchantTier: MERCHANT_TIER.unverified,
          });
        }
      };

      fetchMerchantData();

      // Subscribe to real-time updates
      const subscription = paymentAPI.state$.subscribe(() => {
        fetchMerchantData();
      });

      return () => subscription.unsubscribe();
    }
  }, [paymentAPI, merchantId]);

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

  if (!isConnected) {
    return (
      <GradientBackground>
        <AppHeader />
        <Container maxWidth="md">
          <Box textAlign="center" sx={{ py: 8 }}>
            <AccountBalanceWallet sx={{ fontSize: 80, color: 'primary.main', mb: 3 }} />
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 'bold' }}>
              Connect Your Lace Wallet
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              To access your merchant dashboard and manage payments, please connect your Lace wallet.
              This enables secure, private transactions on the Midnight Network.
            </Typography>
            <ThemedButton
              variant="primary"
              size="large"
              onClick={handleConnect}
              disabled={connecting}
              startIcon={connecting ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
              sx={{ px: 4, py: 2 }}
            >
              {connecting ? 'Connecting...' : 'Connect Lace Wallet'}
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
                Merchant Dashboard
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
                  Welcome back! Here's your payment overview.
                </Typography>
              </Stack>
            </Box>
            <Stack direction="row" spacing={2}>
              <ThemedButton
                variant="outlined"
                startIcon={<Download />}
                size="small"
              >
                Export Data
              </ThemedButton>
              <ThemedButton
                variant="primary"
                startIcon={<Add />}
                size="small"
              >
                Create Subscription Plan
              </ThemedButton>
            </Stack>
          </Stack>
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="Total Earnings"
              value={`$${stats.totalEarnings}`}
              icon={<TrendingUp />}
              color="success"
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
              title="Total Customers"
              value={stats.totalCustomers.toString()}
              icon={<People />}
              color="info"
            />
          </Box>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 22%' }, minWidth: 250 }}>
            <StatCard
              title="This Month"
              value={`$${stats.thisMonthRevenue}`}
              icon={<TrendingUp />}
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
                    >
                      New Subscription
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<AccountBalanceWallet />}
                      sx={{ py: 2 }}
                    >
                      Withdraw Earnings
                    </ThemedButton>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 45%', md: '1 1 30%' } }}>
                    <ThemedButton
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      sx={{ py: 2 }}
                    >
                      View Customers
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
                  Account Status
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Merchant Tier
                    </Typography>
                    <Chip
                      label={MERCHANT_TIER[stats.merchantTier] || 'Unverified'}
                      color={stats.merchantTier >= MERCHANT_TIER.verified ? 'success' : 'primary'}
                      size="small"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        px: 1.5,
                        py: 0.5,
                        height: 'auto'
                      }}
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Available Balance
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {loading ? (
                        <CircularProgress size={20} />
                      ) : (
                        `$${stats.availableBalance}`
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Transaction Fee
                    </Typography>
                    <Typography variant="body1">
                      2.5% + $0.30
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
                Transaction history will appear here once you start processing payments.
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
    </GradientBackground>
  );
};