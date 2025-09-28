import React from 'react';
import {
  Container,
  Typography,
  Stack,
  Box,
  Chip,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { ThemedButton } from '../components/ThemedButton';
import { ThemedCard } from '../components/ThemedCard';
import PaymentIcon from '@mui/icons-material/Payment';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface LandingProps {
  onGetStarted: () => void;
}

export const Landing: React.FC<LandingProps> = ({
  onGetStarted
}) => {
  const theme = useTheme();

  const features = [
    {
      icon: <VisibilityOffIcon sx={{ fontSize: 40 }} />,
      title: 'Zero-Knowledge Privacy',
      description: 'Transactions are private by default using Midnight Network\'s ZK technology'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Decentralized Security',
      description: 'No central authority controls your funds or payment data'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Instant Settlement',
      description: 'Real-time payments with automated subscription processing'
    },
    {
      icon: <PaymentIcon sx={{ fontSize: 40 }} />,
      title: 'Subscription Management',
      description: 'Set up recurring payments with customer consent and spending limits'
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
        <Box textAlign="center" sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontWeight: 'bold',
              mb: 3,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            MidnightPay
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            color="textPrimary"
            sx={{ mb: 3, fontWeight: 300 }}
          >
            Privacy-First Payment Gateway on Midnight Network
          </Typography>

          <Typography
            variant="h6"
            color="textSecondary"
            sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}
          >
            Enable secure, private payments and subscriptions with zero-knowledge proofs.
            Accept payments without compromising your customers' financial privacy.
          </Typography>

          {/* Get Started CTA */}
          <Box sx={{ justifyContent: 'center', mb: 4 }}>
            <ThemedButton
              variant="primary"
              size="large"
              onClick={onGetStarted}
              sx={{ px: 6, py: 2.5, fontSize: '1.1rem' }}
            >
              Get Started
            </ThemedButton>
          </Box>

          <Chip
            label="Built on Midnight Network"
            color="primary"
            variant="outlined"
            sx={{
              fontSize: '0.9rem',
              fontWeight: 500,
              px: 2,
              py: 0.5,
              height: 'auto'
            }}
          />
        </Box>

        {/* Features Section */}
        <Typography
          variant="h4"
          component="h3"
          textAlign="center"
          sx={{ mb: 6, fontWeight: 500 }}
        >
          Why Choose MidnightPay?
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, mb: 8, justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{ flex: { xs: '1 1 100%', md: '1 1 45%' }, maxWidth: 500 }}>
              <ThemedCard sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Box sx={{ color: 'primary.main', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  {feature.description}
                </Typography>
              </ThemedCard>
            </Box>
          ))}
        </Box>

        {/* How It Works Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="h4"
            component="h3"
            sx={{ mb: 6, fontWeight: 500 }}
          >
            How It Works
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' }, maxWidth: 400 }}>
              <ThemedCard sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  1. Setup Payment Gateway
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Connect your Lace wallet and either create a new payment gateway or join an existing one
                </Typography>
              </ThemedCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' }, maxWidth: 400 }}>
              <ThemedCard sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  2. Choose Your Role
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Register as a merchant to accept payments or as a customer to make private payments and subscriptions
                </Typography>
              </ThemedCard>
            </Box>

            <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' }, maxWidth: 400 }}>
              <ThemedCard sx={{ height: '100%', textAlign: 'center', p: 3 }}>
                <Typography variant="h6" component="h4" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  3. Start Transacting
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Process payments, manage subscriptions, or make private purchases - all with zero-knowledge privacy
                </Typography>
              </ThemedCard>
            </Box>
          </Box>
        </Box>

        {/* Get Started Section */}
        <ThemedCard sx={{ textAlign: 'center', p: 6, mt: 8 }}>
          <Typography variant="h5" component="h3" sx={{ mb: 3, fontWeight: 600 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
            Join the privacy-first payment revolution on Midnight Network
          </Typography>
          <ThemedButton
            variant="primary"
            size="large"
            onClick={onGetStarted}
            sx={{ px: 6, py: 2.5 }}
          >
            Setup Payment Gateway
          </ThemedButton>
        </ThemedCard>
      </Container>
    </Box>
  );
};