/**
 * Utility functions for date formatting
 * Handles UTC timestamps from the database
 */

/**
 * Parse a date string from the database and return a proper Date object
 * Note: The backend incorrectly sends GMT+7 timestamps as if they were UTC
 */
export function parseDbDate(dateString: string): Date {
  // The API sends timestamps with 'Z' suffix, but they're actually GMT+7 times treated as UTC
  // We need to add 7 hours to get the correct time
  const date = new Date(dateString);
  return new Date(date.getTime() + (7 * 60 * 60 * 1000));
}

/**
 * Format a date string from the database for relative display (e.g., "2h ago")
 * Facebook-style relative time formatting
 */
export function formatRelativeTime(dateString: string): string {
  const date = parseDbDate(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);
  
  // Handle future dates
  if (diffInMs < 0) return "now";
  
  // Less than a minute
  if (diffInSeconds < 60) return "now";
  
  // Less than an hour
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  // Less than a day
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  // Less than a week
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  // Less than a month
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  
  // Less than a year
  if (diffInMonths < 12) return `${diffInMonths}mo ago`;
  
  // More than a year
  return `${diffInYears}y ago`;
}

/**
 * Format a date string from the database for display
 */
export function formatDate(dateString: string): string {
  const date = parseDbDate(dateString);
  return date.toLocaleDateString();
}

/**
 * Format a date string from the database for full display with time
 */
export function formatDateTime(dateString: string): string {
  const date = parseDbDate(dateString);
  return date.toLocaleString();
} 