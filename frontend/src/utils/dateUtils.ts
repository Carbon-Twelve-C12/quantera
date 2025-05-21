/**
 * Date utility functions for handling date conversions and formatting
 */

/**
 * Converts a Date object to a timestamp in seconds
 */
export const dateToTimestamp = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

/**
 * Converts a timestamp in seconds to a Date object
 */
export const timestampToDate = (timestamp: number): Date => {
  return new Date(timestamp * 1000);
};

/**
 * Gets the number of days between two dates or timestamps
 */
export const getDaysBetween = (startDate: Date | number, endDate: Date | number): number => {
  const start = startDate instanceof Date ? startDate : timestampToDate(startDate);
  const end = endDate instanceof Date ? endDate : timestampToDate(endDate);
  
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

/**
 * Format a date or timestamp to a readable string
 */
export const formatDate = (date: Date | number): string => {
  const dateObj = date instanceof Date ? date : timestampToDate(date);
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Gets the day bucket for a date based on days from now
 */
export const getMaturityBucket = (date: Date | number): string => {
  const now = new Date();
  const days = getDaysBetween(now, date);
  
  if (days <= 30) return '0-30 days';
  if (days <= 90) return '31-90 days';
  if (days <= 180) return '91-180 days';
  if (days <= 365) return '181-365 days';
  return '1+ year';
}; 