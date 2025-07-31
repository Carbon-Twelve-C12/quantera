/**
 * Shortens an Ethereum address for display
 * @param {string} address - The Ethereum address to shorten
 * @param {number} chars - Number of characters to keep at start and end
 * @returns {string} Shortened address with ellipsis
 */
export const shortenAddress = (address, chars = 4) => {
  if (!address) return '';
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

/**
 * Formats a date from Unix timestamp
 * @param {number} timestamp - Unix timestamp in seconds
 * @param {boolean} includeTime - Whether to include time in the format
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp, includeTime = false) => {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp * 1000);
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Formats a monetary value to USD format
 * @param {string|number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted value with $ sign
 */
export const formatCurrency = (value, decimals = 2) => {
  if (value === undefined || value === null) return '$0.00';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numValue);
};

/**
 * Formats a percentage value
 * @param {string|number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  if (value === undefined || value === null) return '0.00%';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Formats a large number with appropriate suffix (K, M, B)
 * @param {string|number} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number with suffix
 */
export const formatLargeNumber = (value, decimals = 1) => {
  if (value === undefined || value === null) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (numValue >= 1000000000) {
    return `${(numValue / 1000000000).toFixed(decimals)}B`;
  } else if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(decimals)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(decimals)}K`;
  }
  
  return numValue.toString();
};

/**
 * Gets color class based on treasury status
 * @param {string} status - Treasury status (ACTIVE, MATURED, REDEEMED)
 * @returns {string} Bootstrap color class
 */
export const getStatusColorClass = (status) => {
  const statusMap = {
    ACTIVE: 'success',
    MATURED: 'warning',
    REDEEMED: 'secondary'
  };
  
  return statusMap[status] || 'light';
};

/**
 * Calculates time remaining until maturity
 * @param {number} maturityTimestamp - Unix timestamp of maturity date
 * @returns {string} Formatted time remaining
 */
export const getTimeRemaining = (maturityTimestamp) => {
  if (!maturityTimestamp) return 'N/A';
  
  const now = Math.floor(Date.now() / 1000);
  if (maturityTimestamp <= now) return 'Matured';
  
  const secondsRemaining = maturityTimestamp - now;
  const days = Math.floor(secondsRemaining / 86400);
  
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    return `${years}y ${remainingDays}d`;
  } else if (days > 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return `${months}m ${remainingDays}d`;
  } else if (days > 0) {
    return `${days}d`;
  } else {
    const hours = Math.floor(secondsRemaining / 3600);
    return `${hours}h`;
  }
};

/**
 * Calculates yield amount based on investment amount, yield rate, and time period
 * @param {number} amount - Investment amount
 * @param {number} yieldRate - Annual yield rate (percentage)
 * @param {number} daysHeld - Number of days held
 * @returns {number} Calculated yield amount
 */
export const calculateYield = (amount, yieldRate, daysHeld) => {
  if (!amount || !yieldRate || !daysHeld) return 0;
  
  // Convert annual yield to daily and calculate based on days held
  const dailyYield = yieldRate / 365 / 100;
  return amount * dailyYield * daysHeld;
}; 