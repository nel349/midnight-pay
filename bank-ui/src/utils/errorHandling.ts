/**
 * Utility functions for handling and formatting errors in a user-friendly way
 */

export interface ParsedError {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Parse an error and return user-friendly information
 */
export function parseError(error: any): ParsedError {
  if (!error) {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error'
    };
  }

  const errorString = error.toString?.() || String(error);
  const message = error.message || '';
  const code = error.code || '';
  const reason = error.reason || '';

  // User rejected the transaction
  if (
    code === 'Rejected' ||
    reason === 'User rejects transaction' ||
    message.includes('User reject') ||
    message.includes('user reject') ||
    message.includes('User denied') ||
    message.includes('user denied') ||
    message.includes('Transaction rejected') ||
    message.includes('transaction rejected') ||
    errorString.includes('User reject') ||
    errorString.includes('user reject')
  ) {
    return {
      title: 'Transaction Cancelled',
      message: 'You cancelled the transaction in your wallet. No charges were applied.',
      action: 'You can try again when you\'re ready to proceed.',
      severity: 'warning'
    };
  }

  // Insufficient balance
  if (
    reason?.includes('Insufficient balance') ||
    message?.includes('Insufficient balance') ||
    errorString?.includes('Insufficient balance') ||
    (code === 'InvalidRequest' && reason?.includes('Insufficient balance'))
  ) {
    return {
      title: 'Insufficient Balance',
      message: 'Your wallet doesn\'t have enough tokens to complete this transaction.',
      action: 'Please add more tokens to your Lace wallet and try again.',
      severity: 'error'
    };
  }

  // Network or connection issues
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    message.includes('fetch') ||
    code === 'NETWORK_ERROR' ||
    code === 'TIMEOUT'
  ) {
    return {
      title: 'Network Error',
      message: 'There was a problem connecting to the blockchain network.',
      action: 'Please check your internet connection and try again.',
      severity: 'error'
    };
  }

  // Wallet not connected
  if (
    message.includes('wallet') ||
    message.includes('not connected') ||
    code === 'WALLET_NOT_CONNECTED'
  ) {
    return {
      title: 'Wallet Not Connected',
      message: 'Your wallet is not properly connected.',
      action: 'Please connect your Lace wallet and try again.',
      severity: 'error'
    };
  }

  // Generic API errors
  if (code === 'InvalidRequest') {
    return {
      title: 'Invalid Request',
      message: reason || message || 'The transaction request is invalid.',
      action: 'Please check your inputs and try again.',
      severity: 'error'
    };
  }

  // Contract deployment specific errors
  if (
    message.includes('deploy') ||
    message.includes('contract') ||
    errorString.includes('deploy')
  ) {
    return {
      title: 'Deployment Failed',
      message: message || 'Failed to deploy the bank contract.',
      action: 'This might be a temporary issue. Please try again in a few moments.',
      severity: 'error'
    };
  }

  // Fallback for any other error
  return {
    title: 'Error Occurred',
    message: message || reason || errorString || 'An unexpected error occurred.',
    action: 'Please try again. If the problem persists, check your wallet connection.',
    severity: 'error'
  };
}

/**
 * Format a parsed error for display
 */
export function formatErrorMessage(parsedError: ParsedError): string {
  let formatted = parsedError.message;
  
  if (parsedError.action) {
    formatted += '\n\n' + parsedError.action;
  }
  
  return formatted;
}

/**
 * Get a short error summary for logging
 */
export function getErrorSummary(error: any): string {
  const parsed = parseError(error);
  return `${parsed.title}: ${parsed.message}`;
}
