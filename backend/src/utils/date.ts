/**
 * Date utility functions for Saudi Arabia timezone (Asia/Riyadh, UTC+3)
 */

const SA_TIMEZONE = 'Asia/Riyadh';

/**
 * Format a date in Saudi Arabia timezone
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDateSA = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: SA_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Format a time in Saudi Arabia timezone
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted time string
 */
export const formatTimeSA = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: SA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
};

/**
 * Format both date and time in Saudi Arabia timezone
 * @param date - Date object or ISO string
 * @returns Object with formatted date and time
 */
export const formatDateTimeSA = (date: Date | string): { date: string; time: string; dateTime: string } => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const dateStr = formatDateSA(dateObj, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const timeStr = formatTimeSA(dateObj, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  const dateTimeStr = formatDateSA(dateObj, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  
  return {
    date: dateStr,
    time: timeStr,
    dateTime: dateTimeStr,
  };
};

/**
 * Get current date/time in Saudi Arabia timezone
 * @returns Date object adjusted to SA timezone
 */
export const getCurrentDateSA = (): Date => {
  const now = new Date();
  // Convert to SA timezone string and back to Date
  const saTimeString = now.toLocaleString('en-US', { timeZone: SA_TIMEZONE });
  return new Date(saTimeString);
};

