import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Skeleton,
  Button,
} from '@mui/material';
import {
  History,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Security,
  Verified,
  PersonAdd,
  ViewList,
} from '@mui/icons-material';
import { useTheme } from '../theme/ThemeProvider';
import { usePinSession } from '../contexts/PinSessionContext';
import type { BankAPI } from '@midnight-bank/bank-api';

// Define the transaction type locally since it's not exported
type DetailedTransaction = {
  readonly type: 'create' | 'deposit' | 'withdraw' | 'auth' | 'verify' | 'transfer_out' | 'transfer_in' | 'auth_request' | 'auth_approve' | 'auth_transfer' | 'claim_transfer';
  readonly amount?: bigint;
  readonly balanceAfter: bigint;
  readonly timestamp: Date;
  readonly counterparty?: string;
  readonly maxAmount?: bigint;
};

interface TransactionSummaryProps {
  bankAPI: BankAPI | null;
  onViewAll?: () => void;
  maxItems?: number;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({ 
  bankAPI, 
  onViewAll,
  maxItems = 5 
}) => {
  const { theme } = useTheme();
  const { getPin, isSessionActive } = usePinSession();
  
  const [transactions, setTransactions] = useState<DetailedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecentTransactions = async () => {
    if (!bankAPI) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure PIN is available (silent if already cached)
      await getPin('Enter your PIN to view recent transactions', bankAPI);
      
      // Get transaction history from API
      const history = await bankAPI.getDetailedTransactionHistory();
      
      // Sort by timestamp (newest first) and take only recent ones
      const recentHistory = [...history]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxItems);
      
      setTransactions(recentHistory);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent transactions';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bankAPI && isSessionActive()) {
      loadRecentTransactions();
    }
  }, [bankAPI, isSessionActive, maxItems]);

  const getTransactionIcon = (type: DetailedTransaction['type']) => {
    switch (type) {
      case 'create':
        return <PersonAdd sx={{ color: theme.colors.success[500] }} />;
      case 'deposit':
        return <TrendingUp sx={{ color: theme.colors.success[500] }} />;
      case 'withdraw':
        return <TrendingDown sx={{ color: theme.colors.error[500] }} />;
      case 'auth_transfer':
        return <SwapHoriz sx={{ color: theme.colors.warning[500] }} />;
      case 'claim_transfer':
        return <TrendingUp sx={{ color: theme.colors.success[500] }} />;
      case 'auth_request':
      case 'auth_approve':
        return <Security sx={{ color: theme.colors.primary[500] }} />;
      case 'auth':
        return <Verified sx={{ color: theme.colors.primary[500] }} />;
      case 'verify':
        return <Verified sx={{ color: theme.colors.secondary[500] }} />;
      default:
        return <History sx={{ color: theme.colors.text.secondary }} />;
    }
  };

  const getTransactionLabel = (type: DetailedTransaction['type']) => {
    switch (type) {
      case 'create':
        return 'Account Created';
      case 'deposit':
        return 'Deposit';
      case 'withdraw':
        return 'Withdrawal';
      case 'auth_transfer':
        return 'Sent Transfer';
      case 'claim_transfer':
        return 'Received Transfer';
      case 'auth_request':
        return 'Auth Request';
      case 'auth_approve':
        return 'Auth Approved';
      case 'auth':
        return 'Balance Check';
      case 'verify':
        return 'Verification';
      default:
        return 'Transaction';
    }
  };

  const getAmountColor = (type: DetailedTransaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'claim_transfer':
      case 'create':
        return theme.colors.success[500];
      case 'withdraw':
      case 'auth_transfer':
        return theme.colors.error[500];
      default:
        return theme.colors.text.primary;
    }
  };

  const getAmountPrefix = (type: DetailedTransaction['type']) => {
    switch (type) {
      case 'deposit':
      case 'claim_transfer':
      case 'create':
        return '+';
      case 'withdraw':
      case 'auth_transfer':
        return '-';
      default:
        return '';
    }
  };

  const formatAmount = (amount?: bigint) => {
    if (amount === undefined) return '';
    return (Number(amount) / 100).toFixed(2);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const transactionStats = useMemo(() => {
    const stats = {
      totalTransactions: transactions.length,
      deposits: 0,
      withdrawals: 0,
      transfers: 0,
    };

    transactions.forEach(tx => {
      switch (tx.type) {
        case 'deposit':
        case 'create':
          stats.deposits++;
          break;
        case 'withdraw':
          stats.withdrawals++;
          break;
        case 'auth_transfer':
        case 'claim_transfer':
          stats.transfers++;
          break;
      }
    });

    return stats;
  }, [transactions]);

  if (!bankAPI) {
    return null;
  }

  return (
    <Card>
      <CardContent sx={{ p: theme.spacing[4] }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: theme.spacing[3],
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
            <History sx={{ fontSize: '1.25rem', color: theme.colors.text.primary }} />
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: theme.typography.fontWeight.bold,
                color: theme.colors.text.primary,
              }}
            >
              Recent Activity
            </Typography>
          </Box>
          
          {onViewAll && transactions.length > 0 && (
            <Button
              size="small"
              startIcon={<ViewList />}
              onClick={onViewAll}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          )}
        </Box>

        {/* Quick Stats */}
        {transactions.length > 0 && (
          <Box sx={{ 
            display: 'flex', 
            gap: theme.spacing[2], 
            mb: theme.spacing[3],
            flexWrap: 'wrap',
          }}>
            <Chip 
              label={`${transactionStats.deposits} Deposits`}
              size="small"
              sx={{ 
                backgroundColor: '#22c55e', // Green-500
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
                minHeight: '32px',
                '& .MuiChip-label': {
                  px: theme.spacing[3],
                  py: theme.spacing[1],
                  fontSize: '0.875rem',
                }
              }}
            />
            <Chip 
              label={`${transactionStats.withdrawals} Withdrawals`}
              size="small"
              sx={{ 
                backgroundColor: '#ef4444', // Red-500
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
                minHeight: '32px',
                '& .MuiChip-label': {
                  px: theme.spacing[3],
                  py: theme.spacing[1],
                  fontSize: '0.875rem',
                }
              }}
            />
            <Chip 
              label={`${transactionStats.transfers} Transfers`}
              size="small"
              sx={{ 
                backgroundColor: '#f97316', // Orange-500
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
                minHeight: '32px',
                '& .MuiChip-label': {
                  px: theme.spacing[3],
                  py: theme.spacing[1],
                  fontSize: '0.875rem',
                }
              }}
            />
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box>
            {[...Array(3)].map((_, i) => (
              <ListItem key={i} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={32} height={32} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
                <Skeleton variant="text" width={60} />
              </ListItem>
            ))}
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error">
            {error}
          </Alert>
        )}

        {/* Transaction List */}
        {!loading && !error && (
          <>
            {transactions.length === 0 ? (
              <Alert severity="info">
                No recent transactions. Start by making a deposit or transfer.
              </Alert>
            ) : (
              <List sx={{ p: 0 }}>
                {transactions.map((transaction, index) => (
                  <ListItem 
                    key={`${transaction.timestamp.getTime()}-${index}`}
                    sx={{ 
                      px: 0,
                      py: theme.spacing[2],
                      borderBottom: index < transactions.length - 1 
                        ? `1px solid ${theme.colors.border.light}` 
                        : 'none',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {getTransactionIcon(transaction.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: theme.typography.fontWeight.medium,
                            color: theme.colors.text.primary,
                          }}
                        >
                          {getTransactionLabel(transaction.type)}
                          {transaction.counterparty && (
                            <Typography 
                              component="span" 
                              variant="body2"
                              sx={{ 
                                color: theme.colors.text.secondary,
                                ml: theme.spacing[1],
                              }}
                            >
                              • {transaction.counterparty}
                            </Typography>
                          )}
                        </Typography>
                      }
                      secondary={
                        <Typography 
                          variant="caption" 
                          sx={{ color: theme.colors.text.secondary }}
                        >
                          {formatDate(transaction.timestamp)}
                        </Typography>
                      }
                    />
                    
                    {transaction.amount !== undefined && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: theme.typography.fontWeight.bold,
                          color: getAmountColor(transaction.type),
                          fontFamily: theme.typography.fontFamily.mono,
                          minWidth: 80,
                          textAlign: 'right',
                        }}
                      >
                        {getAmountPrefix(transaction.type)}{formatAmount(transaction.amount)}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionSummary;