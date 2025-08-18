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
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  Alert,
  Skeleton,
  Divider,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  History,
  AccountBalance,
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  Security,
  Verified,
  PersonAdd,
  Search,
  FilterList,
  ExpandMore,
  ExpandLess,
  CalendarToday,
} from '@mui/icons-material';
import { useTheme } from '../theme/ThemeProvider';
import { usePinSession } from '../contexts/PinSessionContext';
import type { BankAPI } from '@midnight-bank/bank-api';
import { ThemedButton } from './ThemedButton';

// Define the transaction type locally since it's not exported
type DetailedTransaction = {
  readonly type: 'create' | 'deposit' | 'withdraw' | 'auth' | 'verify' | 'transfer_out' | 'transfer_in' | 'auth_request' | 'auth_approve' | 'auth_transfer' | 'claim_transfer';
  readonly amount?: bigint;
  readonly balanceAfter: bigint;
  readonly timestamp: Date;
  readonly counterparty?: string;
  readonly maxAmount?: bigint;
};

interface TransactionHistoryProps {
  bankAPI: BankAPI | null;
  className?: string;
}

type TransactionType = DetailedTransaction['type'];
type FilterType = TransactionType | 'all';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

interface TransactionItemProps {
  transaction: DetailedTransaction;
  index: number;
}

// Helper function to trigger file download
const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportToCsv = (data: DetailedTransaction[]): string => {
  if (data.length === 0) return '';

  const headers = [
    'Type',
    'Amount',
    'Balance After',
    'Timestamp',
    'Counterparty',
    'Max Amount',
  ];

  const csvRows = [];
  csvRows.push(headers.join(',')); // Add header row

  for (const item of data) {
    const values = [
      item.type,
      item.amount !== undefined ? (Number(item.amount) / 100).toFixed(2) : '',
      (Number(item.balanceAfter) / 100).toFixed(2),
      item.timestamp.toISOString(),
      item.counterparty || '',
      item.maxAmount !== undefined ? (Number(item.maxAmount) / 100).toFixed(2) : '',
    ].map(value => {
      const stringValue = String(value);
      return `"${stringValue.replace(/"/g, '')}"`; // Escape double quotes and wrap in quotes
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

const exportToJson = (data: DetailedTransaction[]): string => {
  return JSON.stringify(data.map(tx => ({
    ...tx,
    amount: tx.amount !== undefined ? Number(tx.amount) : undefined,
    balanceAfter: Number(tx.balanceAfter),
    timestamp: tx.timestamp.toISOString(),
    maxAmount: tx.maxAmount !== undefined ? Number(tx.maxAmount) : undefined,
  })), null, 2);
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, index }) => {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const getTransactionIcon = (type: TransactionType) => {
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
        return <AccountBalance sx={{ color: theme.colors.text.secondary }} />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
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
        return 'Authorization Request';
      case 'auth_approve':
        return 'Authorization Approved';
      case 'auth':
        return 'Balance Authentication';
      case 'verify':
        return 'Account Verification';
      default:
        return 'Transaction';
    }
  };

  const getAmountColor = (type: TransactionType) => {
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

  const getAmountPrefix = (type: TransactionType) => {
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
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card 
      sx={{ 
        mb: theme.spacing[2],
        border: `1px solid ${theme.colors.border.light}`,
        '&:hover': {
          borderColor: theme.colors.border.strong,
          boxShadow: theme.shadows.sm,
        }
      }}
    >
      <ListItem
        sx={{ 
          cursor: 'pointer',
          py: theme.spacing[3],
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <ListItemIcon sx={{ minWidth: 56 }}>
          {getTransactionIcon(transaction.type)}
        </ListItemIcon>
        
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.text.primary,
                }}
              >
                {getTransactionLabel(transaction.type)}
              </Typography>
              
              {transaction.counterparty && (
                <Chip 
                  label={transaction.counterparty}
                  size="small"
                  sx={{ 
                    backgroundColor: '#3b82f6', // Blue-500
                    color: '#ffffff',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.2)',
                    minHeight: '28px',
                    '& .MuiChip-label': {
                      px: theme.spacing[2],
                      fontSize: '0.8rem',
                    }
                  }}
                />
              )}
            </Box>
          }
          secondary={
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.colors.text.secondary,
                mt: theme.spacing[1],
              }}
            >
              {formatDate(transaction.timestamp)}
            </Typography>
          }
        />
        
        <Box sx={{ textAlign: 'right', mr: theme.spacing[2] }}>
          {transaction.amount !== undefined && (
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: theme.typography.fontWeight.bold,
                color: getAmountColor(transaction.type),
                fontFamily: theme.typography.fontFamily.mono,
              }}
            >
              {getAmountPrefix(transaction.type)}{formatAmount(transaction.amount)} MBT
            </Typography>
          )}
          
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.colors.text.secondary,
              fontFamily: theme.typography.fontFamily.mono,
            }}
          >
            Balance: {formatAmount(transaction.balanceAfter)} MBT
          </Typography>
        </Box>
        
        <IconButton size="small">
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </ListItem>
      
      <Collapse in={expanded}>
        <Divider />
        <CardContent sx={{ pt: theme.spacing[3] }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing[3] }}>
            <Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                Transaction Type
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeight.medium }}>
                {getTransactionLabel(transaction.type)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                Date & Time
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeight.medium }}>
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }).format(transaction.timestamp)}
              </Typography>
            </Box>
            
            {transaction.amount !== undefined && (
              <Box>
                <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                  Amount
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: theme.typography.fontWeight.bold,
                    color: getAmountColor(transaction.type),
                    fontFamily: theme.typography.fontFamily.mono,
                  }}
                >
                  {getAmountPrefix(transaction.type)}{formatAmount(transaction.amount)} MBT
                </Typography>
              </Box>
            )}
            
            <Box>
              <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                Balance After
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: theme.typography.fontWeight.medium,
                  fontFamily: theme.typography.fontFamily.mono,
                }}
              >
                {formatAmount(transaction.balanceAfter)} MBT
              </Typography>
            </Box>
            
            {transaction.counterparty && (
              <Box>
                <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                  Counterparty
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: theme.typography.fontWeight.medium }}>
                  {transaction.counterparty}
                </Typography>
              </Box>
            )}
            
            {transaction.maxAmount !== undefined && (
              <Box>
                <Typography variant="body2" sx={{ color: theme.colors.text.secondary, mb: theme.spacing[1] }}>
                  Maximum Amount
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: theme.typography.fontWeight.medium,
                    fontFamily: theme.typography.fontFamily.mono,
                  }}
                >
                  {formatAmount(transaction.maxAmount)} MBT
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ bankAPI, className }) => {
  const { theme } = useTheme();
  const { getPin, isSessionActive } = usePinSession();
  
  const [transactions, setTransactions] = useState<DetailedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);

  const loadTransactionHistory = async () => {
    if (!bankAPI) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Ensure PIN is available
      await getPin('Enter your PIN to view transaction history', bankAPI);
      
      // Get transaction history from API
      const history = await bankAPI.getDetailedTransactionHistory();
      
      // Sort by timestamp (newest first)
      const sortedHistory = [...history].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setTransactions(sortedHistory);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load transaction history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle export action
  const handleExport = (format: 'csv' | 'json') => {
    const filename = `transactions-${new Date().toISOString().split('T')[0]}.${format}`;
    if (format === 'csv') {
      const csvContent = exportToCsv(filteredTransactions);
      downloadFile(csvContent, filename, 'text/csv');
    } else {
      const jsonContent = exportToJson(filteredTransactions);
      downloadFile(jsonContent, filename, 'application/json');
    }
  };

  useEffect(() => {
    if (bankAPI && isSessionActive()) {
      loadTransactionHistory();
    }
  }, [bankAPI, isSessionActive]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filtered = filtered.filter(tx => new Date(tx.timestamp) >= filterDate);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.type.toLowerCase().includes(term) ||
        tx.counterparty?.toLowerCase().includes(term) ||
        (tx.amount && formatAmount(tx.amount).includes(term))
      );
    }

    return filtered;
  }, [transactions, typeFilter, dateFilter, searchTerm]);

  const formatAmount = (amount?: bigint) => {
    if (amount === undefined) return '';
    return (Number(amount) / 100).toFixed(2);
  };

  if (!bankAPI) {
    return (
      <Alert severity="info" sx={{ mb: theme.spacing[4] }}>
        Bank API not available. Please ensure you're connected to a bank.
      </Alert>
    );
  }

  return (
    <Box className={className}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        mb: theme.spacing[4],
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
          <History sx={{ fontSize: '1.5rem', color: theme.colors.text.primary }} />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.text.primary,
            }}
          >
            Transaction History
          </Typography>
          
          {transactions.length > 0 && (
            <Chip 
              label={`${filteredTransactions.length} of ${transactions.length}`}
              size="small"
              sx={{ 
                backgroundColor: '#8b5cf6', // Purple-500
                color: '#ffffff',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.2)',
                minHeight: '32px',
                '& .MuiChip-label': {
                  px: theme.spacing[3],
                  fontSize: '0.875rem',
                }
              }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: theme.spacing[2] }}>
          <ThemedButton
            onClick={() => handleExport('csv')}
            variant="primary"
            size="small"
            disabled={filteredTransactions.length === 0}
          >
            Export CSV
          </ThemedButton>
          <ThemedButton
            onClick={() => handleExport('json')}
            variant="outlined"
            size="small"
            disabled={filteredTransactions.length === 0}
          >
            Export JSON
          </ThemedButton>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ 
        display: 'flex', 
        gap: theme.spacing[2], 
        mb: theme.spacing[4],
        flexWrap: 'wrap',
      }}>
        {/* Search */}
        <TextField
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ minWidth: 200, flexGrow: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: theme.colors.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />

        {/* Type Filter */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value as FilterType)}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="create">Account Created</MenuItem>
            <MenuItem value="deposit">Deposits</MenuItem>
            <MenuItem value="withdraw">Withdrawals</MenuItem>
            <MenuItem value="auth_transfer">Sent Transfers</MenuItem>
            <MenuItem value="claim_transfer">Received Transfers</MenuItem>
            <MenuItem value="auth_request">Auth Requests</MenuItem>
            <MenuItem value="auth_approve">Auth Approvals</MenuItem>
            <MenuItem value="auth">Authentication</MenuItem>
            <MenuItem value="verify">Verification</MenuItem>
          </Select>
        </FormControl>

        {/* Date Filter */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date</InputLabel>
          <Select
            value={dateFilter}
            label="Date"
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">Past Week</MenuItem>
            <MenuItem value="month">Past Month</MenuItem>
            <MenuItem value="year">Past Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box>
          {[...Array(3)].map((_, i) => (
            <Card key={i} sx={{ mb: theme.spacing[2] }}>
              <ListItem>
                <ListItemIcon>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="60%" />}
                  secondary={<Skeleton variant="text" width="40%" />}
                />
                <Box sx={{ textAlign: 'right', minWidth: 100 }}>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </Box>
              </ListItem>
            </Card>
          ))}
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: theme.spacing[4] }}
          action={
            <IconButton color="inherit" size="small" onClick={loadTransactionHistory}>
              <History />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}

      {/* Transaction List */}
      {!loading && !error && (
        <>
          {filteredTransactions.length === 0 ? (
            <Alert severity="info">
              {transactions.length === 0 
                ? 'No transactions found. Start by making a deposit or transfer.'
                : 'No transactions match your current filters.'
              }
            </Alert>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredTransactions.map((transaction, index) => (
                <TransactionItem 
                  key={`${transaction.timestamp.getTime()}-${index}`}
                  transaction={transaction} 
                  index={index}
                />
              ))}
            </List>
          )}
        </>
      )}
    </Box>
  );
};

export default TransactionHistory;