/**
 * Utility functions for formatting numbers and amounts in the bank UI
 */

/**
 * Formats a bigint amount (in cents) to a localized currency string with thousand separators
 * @param amount - The amount in cents (bigint)
 * @returns Formatted string like "1,234.56" or empty string if amount is undefined
 */
export const formatAmount = (amount?: bigint): string => {
  if (amount === undefined) return '';
  const dollars = Number(amount) / 100;
  return dollars.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

/**
 * Formats a bigint amount with currency symbol
 * @param amount - The amount in cents (bigint)
 * @param currency - Currency symbol (default: 'MBT')
 * @returns Formatted string like "1,234.56 MBT"
 */
export const formatAmountWithCurrency = (amount?: bigint, currency: string = 'MBT'): string => {
  const formattedAmount = formatAmount(amount);
  return formattedAmount ? `${formattedAmount} ${currency}` : '';
};
