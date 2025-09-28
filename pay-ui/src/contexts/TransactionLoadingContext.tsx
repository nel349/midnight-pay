import React, { createContext, useContext, useState, ReactNode } from 'react';
import TransactionLoadingModal from '../components/TransactionLoadingModal';

interface TransactionLoadingContextType {
  setTransactionLoading: (loading: boolean, operationType?: string) => void;
  isTransactionLoading: boolean;
  currentOperationType: string;
}

const TransactionLoadingContext = createContext<TransactionLoadingContextType | undefined>(undefined);

interface TransactionLoadingProviderProps {
  children: ReactNode;
}

export const TransactionLoadingProvider: React.FC<TransactionLoadingProviderProps> = ({ children }) => {
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [currentOperationType, setCurrentOperationType] = useState('Processing Transaction');

  const setTransactionLoading = (loading: boolean, operationType?: string) => {
    setIsTransactionLoading(loading);
    if (operationType) {
      // Format operation type for display
      const formattedType = operationType
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      setCurrentOperationType(formattedType);
    }
  };

  return (
    <TransactionLoadingContext.Provider 
      value={{
        setTransactionLoading,
        isTransactionLoading,
        currentOperationType
      }}
    >
      {children}
      <TransactionLoadingModal
        isOpen={isTransactionLoading}
        operationType={currentOperationType}
        statusMessage="Processing your transaction securely..."
      />
    </TransactionLoadingContext.Provider>
  );
};

export const useTransactionLoading = (): TransactionLoadingContextType => {
  const context = useContext(TransactionLoadingContext);
  if (!context) {
    throw new Error('useTransactionLoading must be used within a TransactionLoadingProvider');
  }
  return context;
};