import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Container,
  Stack,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import { usePaymentContract } from '../hooks/usePaymentContract';
import { take } from 'rxjs/operators';
import {
  ThemedButton,
  GradientBackground,
  AppHeader,
  ThemedCard,
  ThemedCardContent,
} from '../components';
import { useTheme } from '../theme';
import { findExistingMerchant, savePaymentUser, listPaymentUsers, removeMerchantFromStorage } from '../utils/PaymentLocalState';
import { useNotification } from '../contexts/NotificationContext';

interface MerchantStats {
  totalEarnings: string;
  activeSubscriptions: number;
  totalCustomers: number;
  thisMonthRevenue: string;
  availableBalance: string;
  merchantTier: MERCHANT_TIER;
}

interface MerchantDetails {
  businessName: string;
  tier: MERCHANT_TIER;
  transactionCount: string;
  totalVolume: string;
  isActive: boolean;
  createdAt: string;
}

export const MerchantDashboard: React.FC = () => {
  const { isConnected, connect } = usePaymentWallet();
  const {
    contractAddress,
    paymentAPI,
    entityId: merchantId,
    isInitializing,
    error: contractError,
    setEntity
  } = usePaymentContract();
  const { showSuccess, showError } = useNotification();

  const [connecting, setConnecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);

  // Subscription creation states
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState({
    customerId: '',
    amount: '',
    maxAmount: '',
    frequencyDays: 30,
  });
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [stats, setStats] = useState<MerchantStats>({
    totalEarnings: '0.00',
    activeSubscriptions: 0,
    totalCustomers: 0,
    thisMonthRevenue: '0.00',
    availableBalance: '0.00',
    merchantTier: MERCHANT_TIER.unverified,
  });
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails>({
    businessName: '',
    tier: MERCHANT_TIER.unverified,
    transactionCount: '0',
    totalVolume: '0.00',
    isActive: true,
    createdAt: '',
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

  // Set up merchant entity when connected but not set OR when we need to verify existing merchant
  useEffect(() => {
    if (isConnected && contractAddress && !isInitializing) {
      // Always run setup to verify merchant state, even if merchantId exists
      const setupMerchant = async () => {
        try {
          console.log('🔄 SETUP MERCHANT - Starting setup process');
          console.log('🔄 SETUP MERCHANT - Contract address:', contractAddress);
          console.log('🔄 SETUP MERCHANT - Current merchant ID:', merchantId);

          // DEBUG: Check what's in localStorage
          const allUsers = listPaymentUsers();
          console.log('🔍 SETUP MERCHANT - All users in localStorage:', allUsers);

          const contractUsers = allUsers.filter(u => u.paymentContractAddress === contractAddress);
          console.log('🔍 SETUP MERCHANT - Users for this contract:', contractUsers);

          const existingMerchants = contractUsers.filter(u => u.entityType === 'merchant');
          console.log('🔍 SETUP MERCHANT - Existing merchants for this contract:', existingMerchants);

          // Check if a merchant ID already exists for this gateway (for persistence only)
          const existingMerchant = findExistingMerchant(contractAddress);
          console.log('🔍 SETUP MERCHANT - findExistingMerchant result:', existingMerchant);

          if (merchantId) {
            console.log('🔄 SETUP MERCHANT - Merchant ID already set from session:', merchantId);
            console.log('🔄 SETUP MERCHANT - Will verify if this matches localStorage and blockchain');

            // Check if the sessionStorage merchant ID has a corresponding localStorage entry
            if (existingMerchant && existingMerchant.entityId === merchantId) {
              console.log('✅ SETUP MERCHANT - SessionStorage matches localStorage merchant');
            } else if (existingMerchant) {
              console.log('⚠️  SETUP MERCHANT - SessionStorage merchant differs from localStorage');
              console.log('⚠️  SETUP MERCHANT - Session:', merchantId, 'vs localStorage:', existingMerchant.entityId);
            } else {
              console.log('⚠️  SETUP MERCHANT - SessionStorage merchant has no localStorage entry');
            }
          } else if (existingMerchant) {
            console.log('🔄 SETUP MERCHANT - Using existing merchant ID from localStorage:', existingMerchant.entityId);
            console.log('🔄 SETUP MERCHANT - Business name from localStorage:', existingMerchant.label);
            console.log('⚠️  SETUP MERCHANT - Will verify blockchain registration after setting entity');
            await setEntity(existingMerchant.entityId, 'merchant');
          } else {
            console.log('🆕 SETUP MERCHANT - No existing merchant found, creating new merchant ID');
            const generatedMerchantId = `merchant-${Date.now()}`;
            console.log('🆕 SETUP MERCHANT - Generated new ID:', generatedMerchantId);
            await setEntity(generatedMerchantId, 'merchant');
            console.log('⏳ SETUP MERCHANT - New merchant entity created, will save to localStorage after blockchain registration');
          }
        } catch (error) {
          console.error('❌ SETUP MERCHANT - Failed to set up merchant entity:', error);
        }
      };

      setupMerchant();
    }
  }, [isConnected, contractAddress, isInitializing, setEntity]);

  // Check merchant registration status - BLOCKCHAIN IS SINGLE SOURCE OF TRUTH
  useEffect(() => {
    if (paymentAPI && merchantId && contractAddress) {
      const checkRegistration = async () => {
        try {
          console.log('🔍 REGISTRATION CHECK - Starting blockchain verification');
          console.log('🔍 REGISTRATION CHECK - Merchant ID:', merchantId);
          console.log('🔍 REGISTRATION CHECK - Contract address:', contractAddress);

          // Wait for PaymentAPI state to be properly synced using the state observable
          console.log('⏳ REGISTRATION CHECK - Waiting for PaymentAPI state sync...');
          await new Promise<void>((resolve) => {
            let stateUpdateCount = 0;
            const subscription = paymentAPI.state$.subscribe((state) => {
              stateUpdateCount++;
              console.log(`📡 REGISTRATION CHECK - PaymentAPI state updated (${stateUpdateCount}):`, state);

              // Wait for a few state updates to ensure private state is fully loaded
              if (stateUpdateCount >= 2) {
                subscription.unsubscribe();
                resolve();
              }
            });
            // Fallback timeout in case state doesn't update enough
            setTimeout(() => {
              subscription.unsubscribe();
              resolve();
            }, 5000); // Increased timeout to 5 seconds
          });

          // Check blockchain for merchant registration - this is the ONLY truth
          const merchantInfo = await paymentAPI.getMerchantInfo(merchantId);
          console.log('✅ REGISTRATION CHECK - Merchant found on blockchain:', merchantInfo);
          console.log('✅ REGISTRATION CHECK - Business name:', merchantInfo.businessName);
          console.log('✅ REGISTRATION CHECK - Merchant tier:', merchantInfo.tier);
          console.log('✅ REGISTRATION CHECK - Is active:', merchantInfo.isActive);
          setIsRegistered(true);
        } catch (error) {
          console.log('❌ REGISTRATION CHECK - Merchant not found on blockchain');
          console.log('❌ REGISTRATION CHECK - Error:', error);

          // Check if merchant exists in localStorage
          const existingMerchant = findExistingMerchant(contractAddress);
          console.log('🔍 REGISTRATION CHECK - Checking localStorage:', existingMerchant);

          if (existingMerchant && existingMerchant.entityId === merchantId) {
            console.log('⚠️  REGISTRATION CHECK - Merchant exists in localStorage but not found on blockchain');
            console.log('⚠️  REGISTRATION CHECK - This could be a private state sync issue or registration failure');
            console.log('⚠️  REGISTRATION CHECK - NOT removing localStorage data to preserve merchant ID consistency');
          } else {
            console.log('🔍 REGISTRATION CHECK - No localStorage entry found');
          }

          // CRITICAL: Only clear sessionStorage if NO localStorage entry exists
          // If localStorage entry exists, the merchant was registered but private state might need time to sync
          if (!existingMerchant) {
            console.log('🧹 REGISTRATION CHECK - No localStorage entry, clearing sessionStorage for fresh start');
            try {
              window.sessionStorage.removeItem('current-entity-id');
              window.sessionStorage.removeItem('current-entity-type');
              console.log('🧹 REGISTRATION CHECK - SessionStorage cleared');
            } catch (error) {
              console.error('Failed to clear sessionStorage:', error);
            }
          } else {
            console.log('⚠️  REGISTRATION CHECK - Merchant exists in localStorage, keeping sessionStorage for consistency');
            console.log('⚠️  REGISTRATION CHECK - This might be a temporary private state sync issue');
          }

          console.log('📝 REGISTRATION CHECK - Showing registration form');
          setIsRegistered(false);
          setRegistrationOpen(true);
        }
      };

      checkRegistration();
    }
  }, [paymentAPI, merchantId, contractAddress]);

  // Handle merchant registration
  // Helper function to format merchant tier
  const getTierLabel = (tier: MERCHANT_TIER): string => {
    switch (tier) {
      case MERCHANT_TIER.unverified:
        return 'Unverified';
      case MERCHANT_TIER.basic:
        return 'Basic';
      case MERCHANT_TIER.verified:
        return 'Verified';
      case MERCHANT_TIER.premium:
        return 'Premium';
      default:
        return 'Unknown';
    }
  };

  const getTierColor = (tier: MERCHANT_TIER): 'default' | 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' => {
    switch (tier) {
      case MERCHANT_TIER.unverified:
        return 'warning';
      case MERCHANT_TIER.basic:
        return 'info';
      case MERCHANT_TIER.verified:
        return 'success';
      case MERCHANT_TIER.premium:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const handleCreateSubscription = async () => {
    if (!paymentAPI || !merchantId || !subscriptionData.customerId || !subscriptionData.amount) return;

    const amount = parseFloat(subscriptionData.amount);
    const maxAmount = parseFloat(subscriptionData.maxAmount || subscriptionData.amount);

    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid subscription amount greater than $0.00');
      return;
    }

    if (isNaN(maxAmount) || maxAmount < amount) {
      showError('Maximum amount must be greater than or equal to the subscription amount');
      return;
    }

    if (subscriptionData.frequencyDays < 1 || subscriptionData.frequencyDays > 365) {
      showError('Frequency must be between 1 and 365 days');
      return;
    }

    try {
      setCreatingSubscription(true);
      const result = await paymentAPI.createSubscription(
        merchantId,
        subscriptionData.customerId.trim(),
        subscriptionData.amount,
        subscriptionData.maxAmount || subscriptionData.amount,
        subscriptionData.frequencyDays
      );

      console.log('✅ Subscription created successfully:', result);
      showSuccess(`Subscription created successfully for customer ${subscriptionData.customerId}!`);
      setSubscriptionDialog(false);
      setSubscriptionData({
        customerId: '',
        amount: '',
        maxAmount: '',
        frequencyDays: 30,
      });
    } catch (error) {
      console.error('❌ Failed to create subscription:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown subscription creation error';
      showError(`Failed to create subscription: ${errorMessage}`);
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleRegisterMerchant = async () => {
    if (!paymentAPI || !merchantId || !businessName.trim()) return;

    console.log('📝 REGISTERING - Starting merchant registration');
    console.log('📝 REGISTERING - Merchant ID:', merchantId);
    console.log('📝 REGISTERING - Business name:', businessName.trim());
    console.log('📝 REGISTERING - Contract address:', contractAddress);

    try {
      setRegistering(true);

      console.log('🔄 REGISTERING - Calling paymentAPI.registerMerchant...');
      await paymentAPI.registerMerchant(merchantId, businessName.trim());
      console.log('✅ REGISTERING - registerMerchant call completed');

      // Wait for the blockchain state to be updated
      console.log('⏳ REGISTERING - Waiting for blockchain state update...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.log('❌ REGISTERING - Timeout waiting for state update');
          reject(new Error('Timeout waiting for blockchain state update'));
        }, 10000); // 10 second timeout

        const subscription = paymentAPI.state$.subscribe((state) => {
          console.log('📡 REGISTERING - State update received, checking for merchant...');

          // Try to verify the merchant was registered
          paymentAPI.getMerchantInfo(merchantId)
            .then((merchantInfo) => {
              console.log('✅ REGISTERING - Merchant verified on blockchain:', merchantInfo);
              clearTimeout(timeout);
              subscription.unsubscribe();
              resolve();
            })
            .catch((error) => {
              console.log('⏳ REGISTERING - Merchant not yet available, waiting for next state update...');
              // Don't resolve yet, wait for next state update
            });
        });
      });

      console.log('✅ REGISTERING - Merchant successfully registered and verified on blockchain');

      // Save merchant ID to localStorage only AFTER blockchain verification
      const merchantRecord = {
        paymentContractAddress: contractAddress!,
        entityId: merchantId,
        entityType: 'merchant' as const,
        label: businessName.trim(),
        createdAt: new Date().toISOString()
      };
      savePaymentUser(merchantRecord);
      console.log('💾 REGISTERING - Merchant ID saved to localStorage after blockchain verification');

      showSuccess(`Business "${businessName.trim()}" registered successfully!`);
      setIsRegistered(true);
      setRegistrationOpen(false);
      setBusinessName('');
    } catch (error) {
      console.error('❌ REGISTERING - Failed to register merchant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown registration error';

      if (errorMessage.includes('Merchant already exists')) {
        console.log('✅ REGISTERING - Merchant already exists on blockchain');

        // Verify the existing merchant
        try {
          const existingMerchant = await paymentAPI.getMerchantInfo(merchantId);
          console.log('✅ REGISTERING - Verified existing merchant:', existingMerchant);

          savePaymentUser({
            paymentContractAddress: contractAddress!,
            entityId: merchantId,
            entityType: 'merchant',
            label: businessName.trim(),
            createdAt: new Date().toISOString()
          });
          showSuccess('Merchant account already exists and is now active!');
          setIsRegistered(true);
          setRegistrationOpen(false);
          setBusinessName('');
        } catch (verifyError) {
          console.error('❌ REGISTERING - Failed to verify existing merchant:', verifyError);
          showError(`Failed to verify existing merchant: ${verifyError}`);
        }
      } else {
        showError(`Registration failed: ${errorMessage}`);
      }
    } finally {
      setRegistering(false);
    }
  };

  // Fetch real data from PaymentAPI
  useEffect(() => {
    if (paymentAPI && merchantId && isRegistered) {
      const fetchMerchantData = async () => {
        try {
          // Fetch ALL data from blockchain - single source of truth
          const [balance, merchantInfo] = await Promise.all([
            paymentAPI.getMerchantBalance(merchantId),
            paymentAPI.getMerchantInfo(merchantId),
          ]);

          console.log('📊 Loading merchant data from blockchain:', { balance, merchantInfo });

          setStats({
            totalEarnings: (Number(balance.totalEarnings) / 100).toFixed(2),
            activeSubscriptions: balance.activeSubscribers,
            totalCustomers: balance.activeSubscribers,
            thisMonthRevenue: (Number(balance.totalEarnings) / 100).toFixed(2),
            availableBalance: (Number(balance.availableBalance) / 100).toFixed(2),
            merchantTier: merchantInfo.tier,
          });

          setMerchantDetails({
            businessName: merchantInfo.businessName,
            tier: merchantInfo.tier,
            transactionCount: merchantInfo.transactionCount.toString(),
            totalVolume: (Number(merchantInfo.totalVolume) / 100).toFixed(2),
            isActive: merchantInfo.isActive,
            createdAt: new Date(merchantInfo.createdAt * 1000).toLocaleDateString(),
          });
        } catch (error) {
          console.error('❌ Failed to fetch merchant data from blockchain:', error);
          // If blockchain data fails, merchant is not properly registered
          console.log('❌ Blockchain data unavailable - merchant not registered');
          setIsRegistered(false);
          setRegistrationOpen(true);
        }
      };

      fetchMerchantData();

      // Subscribe to real-time updates
      const subscription = paymentAPI.state$.subscribe(() => {
        fetchMerchantData();
      });

      return () => subscription.unsubscribe();
    }
  }, [paymentAPI, merchantId, isRegistered]);

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
  if (!isConnected || !contractAddress || !merchantId) {
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
                ? 'To access your merchant dashboard and manage payments, please connect your Lace wallet.'
                : isInitializing
                ? 'Creating your merchant account on the blockchain. This requires a wallet signature to establish your secure merchant identity.'
                : !contractAddress
                ? 'Please connect to a payment gateway first.'
                : 'Setting up your merchant profile. You may need to sign a transaction to create your merchant account.'
              }
            </Typography>
            {isInitializing && (
              <Alert severity="info" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                <Typography variant="body2">
                  🔐 <strong>Wallet Signature Required:</strong> Creating your merchant account requires a blockchain transaction. This is a one-time setup to establish your secure identity.
                </Typography>
              </Alert>
            )}
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
                {merchantDetails.businessName || 'Merchant Dashboard'}
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
                <Chip
                  label={getTierLabel(merchantDetails.tier)}
                  color={getTierColor(merchantDetails.tier)}
                  size="small"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    px: 1.5,
                    py: 0.5
                  }}
                />
                <Typography variant="body2" color="textSecondary">
                  {merchantDetails.isActive ? 'Active merchant account' : 'Inactive account'}
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
                      onClick={() => setSubscriptionDialog(true)}
                      disabled={loading}
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
                  Business Information
                </Typography>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Business Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {merchantDetails.businessName || 'Not Set'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Merchant Tier
                    </Typography>
                    <Chip
                      label={getTierLabel(merchantDetails.tier)}
                      color={getTierColor(merchantDetails.tier)}
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
                      Total Transactions
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {merchantDetails.transactionCount}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Volume
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      ${merchantDetails.totalVolume}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Member Since
                    </Typography>
                    <Typography variant="body1">
                      {merchantDetails.createdAt || 'Unknown'}
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

      {/* Merchant Registration Modal */}
      <Dialog
        open={registrationOpen}
        onClose={() => {}} // Prevent closing - registration is required
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          🏪 Register Your Business
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            To start accepting payments, please register your business with the payment gateway.
          </Typography>

          <TextField
            autoFocus
            label="Business Name"
            placeholder="e.g., My Coffee Shop, Tech Solutions LLC"
            fullWidth
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            helperText="Enter your business or organization name"
            disabled={registering}
            sx={{ mb: 2 }}
          />

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This will create your merchant account on the blockchain.
              You may need to sign a transaction to complete registration.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <ThemedButton
            variant="primary"
            onClick={handleRegisterMerchant}
            disabled={!businessName.trim() || registering}
            startIcon={registering ? <CircularProgress size={20} /> : <Add />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {registering ? 'Registering...' : 'Register Business'}
          </ThemedButton>
        </DialogActions>
      </Dialog>

      {/* Subscription Creation Dialog */}
      <Dialog open={subscriptionDialog} onClose={() => setSubscriptionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1, fontWeight: 'bold' }}>
          📋 Create New Subscription
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Create a recurring subscription for a customer. They'll be charged automatically based on the frequency you set.
          </Typography>
          <Stack spacing={3}>
            <TextField
              autoFocus
              label="Customer ID"
              type="text"
              fullWidth
              variant="outlined"
              value={subscriptionData.customerId}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, customerId: e.target.value }))}
              placeholder="customer-123456"
              helperText="Enter the customer's unique identifier"
            />
            <TextField
              label="Subscription Amount (USD)"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.amount}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="9.99"
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Amount to charge per billing cycle"
            />
            <TextField
              label="Maximum Amount (USD) - Optional"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.maxAmount}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, maxAmount: e.target.value }))}
              placeholder="99.99"
              inputProps={{ min: 0, step: 0.01 }}
              helperText="Maximum amount that can be charged (defaults to subscription amount)"
            />
            <TextField
              label="Billing Frequency (Days)"
              type="number"
              fullWidth
              variant="outlined"
              value={subscriptionData.frequencyDays}
              onChange={(e) => setSubscriptionData(prev => ({ ...prev, frequencyDays: parseInt(e.target.value) || 30 }))}
              inputProps={{ min: 1, max: 365 }}
              helperText="How often to charge (1-365 days). 30 = monthly, 7 = weekly"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 3 }}>
          <ThemedButton
            onClick={() => setSubscriptionDialog(false)}
            variant="outlined"
          >
            Cancel
          </ThemedButton>
          <ThemedButton
            onClick={handleCreateSubscription}
            variant="primary"
            disabled={!subscriptionData.customerId.trim() || !subscriptionData.amount || creatingSubscription}
            startIcon={creatingSubscription ? <CircularProgress size={20} /> : <Add />}
            size="large"
            sx={{ minWidth: 200 }}
          >
            {creatingSubscription ? 'Creating...' : 'Create Subscription'}
          </ThemedButton>
        </DialogActions>
      </Dialog>
    </GradientBackground>
  );
};