// Comprehensive error handling utilities for transaction operations

export interface TransactionError {
  type: 'network' | 'validation' | 'pin' | 'balance' | 'authorization' | 'timeout' | 'unknown';
  message: string;
  userMessage: string;
  originalError?: any;
}

export const parseTransactionError = (error: any, operation?: string): TransactionError => {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const normalizedMessage = errorMessage.toLowerCase();
  
  // PIN-related errors
  if (normalizedMessage.includes('pin') || normalizedMessage.includes('incorrect') || 
      normalizedMessage.includes('authentication') || normalizedMessage.includes('unauthorized')) {
    return {
      type: 'pin',
      message: errorMessage,
      userMessage: 'Invalid PIN. Please check your PIN and try again.',
      originalError: error
    };
  }
  
  // Balance/amount-related errors
  if (normalizedMessage.includes('insufficient') || normalizedMessage.includes('balance') ||
      normalizedMessage.includes('amount') || normalizedMessage.includes('funds')) {
    return {
      type: 'balance',
      message: errorMessage,
      userMessage: 'Insufficient funds or invalid amount. Please check your balance and try again.',
      originalError: error
    };
  }
  
  // Authorization-related errors
  if (normalizedMessage.includes('authorization') || normalizedMessage.includes('permission') ||
      normalizedMessage.includes('not authorized') || normalizedMessage.includes('access denied')) {
    return {
      type: 'authorization',
      message: errorMessage,
      userMessage: 'You do not have permission for this operation. Please check your authorizations.',
      originalError: error
    };
  }
  
  // Network/connection errors
  if (normalizedMessage.includes('network') || normalizedMessage.includes('connection') ||
      normalizedMessage.includes('timeout') || normalizedMessage.includes('fetch')) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: 'Network connection error. Please check your internet connection and try again.',
      originalError: error
    };
  }
  
  // Validation errors
  if (normalizedMessage.includes('invalid') || normalizedMessage.includes('validation') ||
      normalizedMessage.includes('format') || normalizedMessage.includes('required')) {
    return {
      type: 'validation',
      message: errorMessage,
      userMessage: 'Invalid input. Please check your data and try again.',
      originalError: error
    };
  }
  
  // Timeout errors
  if (normalizedMessage.includes('timeout') || normalizedMessage.includes('took too long')) {
    return {
      type: 'timeout',
      message: errorMessage,
      userMessage: 'Transaction timed out. Please try again in a moment.',
      originalError: error
    };
  }
  
  // Default case
  const operationText = operation ? ` during ${operation}` : '';
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: `An unexpected error occurred${operationText}: ${errorMessage}`,
    originalError: error
  };
};

export const formatTransactionError = (error: any, operation?: string): string => {
  const parsedError = parseTransactionError(error, operation);
  return parsedError.userMessage;
};

export const formatSuccessMessage = (operation: string, details?: string): string => {
  const messages: Record<string, string> = {
    'deposit': `✅ Deposit successful${details ? `: ${details}` : ''}`,
    'withdraw': `✅ Withdrawal successful${details ? `: ${details}` : ''}`,
    'transfer': `✅ Transfer successful${details ? `: ${details}` : ''}`,
    'authorization': `✅ Authorization ${details || 'successful'}`,
    'permission': `✅ Permission ${details || 'granted successfully'}`,
    'verification': `✅ Verification ${details || 'successful'}`,
    'balance': `✅ Balance ${details || 'retrieved successfully'}`
  };
  
  return messages[operation] || `✅ ${operation} successful${details ? `: ${details}` : ''}`;
};

// Enhanced transaction operation wrapper with loading state management
export const handleTransactionOperation = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  handlers: {
    setLoading?: (loading: boolean) => void;
    setError?: (error: string | null) => void;
    setSuccess?: (message: string | null) => void;
    onSuccess?: (result: T, message: string) => void;
    onError?: (error: TransactionError) => void;
    onFinally?: () => void;
    setTransactionLoading?: (loading: boolean, operationType?: string) => void;
  } = {}
): Promise<T | null> => {
  const { setLoading, setError, setSuccess, onSuccess, onError, onFinally, setTransactionLoading } = handlers;
  
  try {
    // Clear previous states
    setLoading?.(true);
    setError?.(null);
    setSuccess?.(null);
    setTransactionLoading?.(true, operationName);
    
    const result = await operation();
    
    // Generate success message
    const successMessage = formatSuccessMessage(operationName);
    setSuccess?.(successMessage);
    onSuccess?.(result, successMessage);
    
    return result;
  } catch (error) {
    // Parse and handle error
    const parsedError = parseTransactionError(error, operationName);
    console.error(`[${operationName}] Transaction failed:`, {
      type: parsedError.type,
      message: parsedError.message,
      userMessage: parsedError.userMessage,
      originalError: parsedError.originalError
    });
    
    setError?.(parsedError.userMessage);
    onError?.(parsedError);
    return null;
  } finally {
    setLoading?.(false);
    setTransactionLoading?.(false);
    onFinally?.();
  }
};

// Simplified hook for transaction handling
export const useTransactionHandler = (
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  setSuccess: (message: string | null) => void,
  setTransactionLoading?: (loading: boolean, operationType?: string) => void
) => {
  return {
    execute: async <T>(
      operation: () => Promise<T>,
      operationName: string,
      customHandlers?: {
        onSuccess?: (result: T, message: string) => void;
        onError?: (error: TransactionError) => void;
        onFinally?: () => void;
      }
    ): Promise<T | null> => {
      return handleTransactionOperation(operation, operationName, {
        setLoading,
        setError,
        setSuccess,
        setTransactionLoading,
        ...customHandlers
      });
    }
  };
};

// Specialized hook for modal/dialog transaction handling
export const useModalTransactionHandler = (
  setLoading: (loading: boolean) => void,
  setModalError: (error: string | null) => void,
  setModalSuccess: (message: string | null) => void,
  options?: {
    useGlobalError?: (error: string) => void;
    useGlobalSuccess?: (message: string) => void;
  },
  setTransactionLoading?: (loading: boolean, operationType?: string) => void
) => {
  return {
    execute: async <T>(
      operation: () => Promise<T>,
      operationName: string,
      customHandlers?: {
        onSuccess?: (result: T, message: string) => void;
        onError?: (error: TransactionError) => void;
        onFinally?: () => void;
        useGlobalNotifications?: boolean; // Override to use global notifications
      }
    ): Promise<T | null> => {
      const useGlobal = customHandlers?.useGlobalNotifications ?? false;
      
      return handleTransactionOperation(operation, operationName, {
        setLoading,
        setError: useGlobal 
          ? (error) => error && options?.useGlobalError?.(error)
          : setModalError,
        setSuccess: useGlobal 
          ? (message) => message && options?.useGlobalSuccess?.(message)
          : setModalSuccess,
        setTransactionLoading,
        onSuccess: (result, message) => {
          // Always call custom success handler
          customHandlers?.onSuccess?.(result, message);
          
          // If using global notifications, also send to global
          if (useGlobal) {
            options?.useGlobalSuccess?.(message);
          }
        },
        onError: (error) => {
          // Always call custom error handler  
          customHandlers?.onError?.(error);
          
          // If using global notifications, also send to global
          if (useGlobal) {
            options?.useGlobalError?.(error.userMessage);
          }
        },
        onFinally: customHandlers?.onFinally
      });
    }
  };
};