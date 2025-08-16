import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { AccountBalance } from '@mui/icons-material';
import { ThemedButton, ThemedCard, ThemedCardContent } from './index';
import { useTheme } from '../theme/ThemeProvider';

interface BankCardProps {
  bank: {
    contractAddress: string;
    label?: string;
    createdAt: string;
  };
  accounts: Array<{
    userId: string;
    label?: string;
    bankContractAddress: string;
  }>;
  onOpenBank: (bankAddress: string, userId?: string) => void;
  isConnected: boolean;
}

export const BankCard: React.FC<BankCardProps> = ({ 
  bank, 
  accounts, 
  onOpenBank, 
  isConnected 
}) => {
  const { theme, mode } = useTheme();
  
  const handleBankCardClick = () => {
    onOpenBank(bank.contractAddress);
  };
  
  const handleAccountClick = (e: React.MouseEvent, accountUserId: string) => {
    e.stopPropagation(); // Prevent bank card click
    onOpenBank(bank.contractAddress, accountUserId);
  };
  
  const handleCreateAccountClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bank card click
    onOpenBank(bank.contractAddress);
  };
  
  return (
    <Box
      sx={{
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: mode === 'dark' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
          borderRadius: theme.borderRadius.lg,
          backdropFilter: 'blur(10px)',
          border: mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.3)',
          pointerEvents: 'none',
        }
      }}
    >
      <ThemedCard 
        onClick={handleBankCardClick}
        sx={{ 
          width: '100%', 
          maxWidth: 500,
          backgroundColor: 'transparent',
          backdropFilter: 'blur(20px)',
          border: 'none',
          boxShadow: mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.3)'
            : '0 8px 32px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 1,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.4)'
              : '0 20px 40px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        <ThemedCardContent sx={{ p: theme.spacing[6] }}>
          {/* Bank Header */}
          <Box display="flex" alignItems="center" gap={3} mb={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: theme.borderRadius.md,
                background: mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.colors.secondary[600]}33 0%, ${theme.colors.secondary[500]}33 100%)`
                  : `linear-gradient(135deg, ${theme.colors.secondary[500]}1A 0%, ${theme.colors.secondary[600]}1A 100%)`,
              }}
            >
              <AccountBalance 
                sx={{ 
                  fontSize: '1.5rem',
                  color: theme.colors.text.primary,
                }} 
              />
            </Box>
            
            <Box flexGrow={1}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.colors.text.primary,
                  fontWeight: theme.typography.fontWeight.bold,
                  mb: 1,
                }}
              >
                {bank.label || `Bank ${bank.contractAddress.slice(0, 8)}...`}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.colors.text.secondary,
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  wordBreak: 'break-all',
                }}
              >
                {bank.contractAddress}
              </Typography>
            </Box>
            
            <Chip 
              label={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`} 
              size="small" 
              sx={{
                backgroundColor: mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)',
                color: theme.colors.text.primary,
                border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                fontSize: '0.75rem',
                height: '24px',
                '& .MuiChip-label': {
                  padding: '0 8px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }
              }}
            />
          </Box>
          
          {/* Accounts Section */}
          {accounts.length === 0 ? (
            <Box 
              textAlign="center" 
              py={4}
              sx={{
                borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
              }}
            >
              <Typography 
                color="text.secondary" 
                gutterBottom
                sx={{ mb: 3 }}
              >
                No accounts in this bank yet
              </Typography>
              <ThemedButton 
                variant="primary"
                onClick={handleCreateAccountClick}
                disabled={!isConnected}
              >
                Create Account
              </ThemedButton>
            </Box>
          ) : (
            <Box 
              sx={{
                borderTop: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                pt: 3,
              }}
            >
              <Box display="flex" flexDirection="column" gap={2}>
                {accounts.map((account) => (
                  <ThemedButton
                    key={`${account.bankContractAddress}-${account.userId}`}
                    variant="outlined"
                    onClick={(e) => handleAccountClick(e, account.userId)}
                    sx={{ 
                      justifyContent: 'flex-start', 
                      textTransform: 'none',
                      backgroundColor: mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                      border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                      '&:hover': {
                        backgroundColor: mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.1)'
                          : 'rgba(0, 0, 0, 0.05)',
                        transform: 'translateX(4px)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: theme.colors.text.primary }}>
                      {account.label || account.userId}
                    </Typography>
                  </ThemedButton>
                ))}
                
                <ThemedButton 
                  size="small" 
                  variant="outlined"
                  onClick={handleCreateAccountClick}
                  disabled={!isConnected}
                  sx={{ 
                    alignSelf: 'flex-start', 
                    mt: 1,
                    backgroundColor: 'transparent',
                    border: `1px dashed ${mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                    '&:hover': {
                      backgroundColor: mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'rgba(0, 0, 0, 0.02)',
                    }
                  }}
                >
                  + Create New Account
                </ThemedButton>
              </Box>
            </Box>
          )}
        </ThemedCardContent>
      </ThemedCard>
    </Box>
  );
};
