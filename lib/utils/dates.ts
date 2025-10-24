/**
 * Date Utility Functions
 *
 * Helper utilities for working with date strings from the database.
 * All database timestamps are stored as ISO 8601 strings.
 */

/**
 * Parse a date string to a Date object
 *
 * @param dateString - ISO date string from database
 * @returns Date object or null if input is null/undefined
 *
 * @example
 * const date = parseDate(task.created_at); // Date object
 * const nullDate = parseDate(task.deleted_at); // null
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  return dateString ? new Date(dateString) : null;
}

/**
 * Check if a date string represents a past date
 *
 * @param dateString - ISO date string
 * @returns true if the date is in the past
 *
 * @example
 * const isOverdue = isPast(task.due_date);
 */
export function isPast(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

/**
 * Check if a date string represents a future date
 *
 * @param dateString - ISO date string
 * @returns true if the date is in the future
 *
 * @example
 * const upcoming = isFuture(event.date);
 */
export function isFuture(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  return new Date(dateString) > new Date();
}

/**
 * Check if a task/item is overdue (has a due date in the past)
 *
 * @param dueDateString - ISO date string
 * @returns true if overdue
 *
 * @example
 * const overdue = isOverdue(task.due_date);
 */
export function isOverdue(dueDateString: string | null | undefined): boolean {
  return isPast(dueDateString);
}

/**
 * Check if a date is within a certain number of days from now
 *
 * @param dateString - ISO date string
 * @param days - Number of days to check
 * @returns true if the date is within the specified days
 *
 * @example
 * const dueSoon = isWithinDays(task.due_date, 7); // Due within a week
 */
export function isWithinDays(
  dateString: string | null | undefined,
  days: number
): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return date >= now && date <= future;
}

/**
 * Check if a date is between two other dates
 *
 * @param dateString - ISO date string to check
 * @param startString - Start of range
 * @param endString - End of range
 * @returns true if date is within range (inclusive)
 *
 * @example
 * const inRange = isBetween(event.date, '2025-06-01', '2025-06-30');
 */
export function isBetween(
  dateString: string | null | undefined,
  startString: string,
  endString: string
): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const start = new Date(startString);
  const end = new Date(endString);
  return date >= start && date <= end;
}

/**
 * Format a date string for display
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 *
 * @example
 * formatDate(event.date) // "6/15/2025"
 * formatDate(event.date, { dateStyle: 'long' }) // "June 15, 2025"
 */
export function formatDate(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, options);
}

/**
 * Format a date string with time
 *
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date and time string
 *
 * @example
 * formatDateTime(task.created_at) // "6/15/2025, 2:30 PM"
 */
export function formatDateTime(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString(undefined, options);
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 *
 * @param dateString - ISO date string
 * @returns Relative time string
 *
 * @example
 * getRelativeTime(task.created_at) // "2 hours ago"
 * getRelativeTime(task.due_date) // "in 3 days"
 */
export function getRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.floor(Math.abs(diffMs) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const isPastDate = diffMs < 0;
  const suffix = isPastDate ? 'ago' : 'from now';

  if (diffSec < 60) return `${diffSec} second${diffSec !== 1 ? 's' : ''} ${suffix}`;
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ${suffix}`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ${suffix}`;
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ${suffix}`;
}

/**
 * Add days to a date string
 *
 * @param dateString - ISO date string
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string
 *
 * @example
 * const tomorrow = addDays(new Date().toISOString(), 1);
 * const weekAgo = addDays(new Date().toISOString(), -7);
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Compare two date strings
 *
 * @param dateString1 - First ISO date string
 * @param dateString2 - Second ISO date string
 * @returns Negative if date1 < date2, 0 if equal, positive if date1 > date2
 *
 * @example
 * const sorted = dates.sort((a, b) => compareDates(a.created_at, b.created_at));
 */
export function compareDates(
  dateString1: string | null | undefined,
  dateString2: string | null | undefined
): number {
  if (!dateString1 && !dateString2) return 0;
  if (!dateString1) return -1;
  if (!dateString2) return 1;
  return new Date(dateString1).getTime() - new Date(dateString2).getTime();
}

/**
 * Get current timestamp as ISO string
 *
 * @returns Current date/time as ISO string
 *
 * @example
 * const now = now(); // "2025-06-15T14:30:00.000Z"
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Create an ISO date string from components
 *
 * @param year - Year
 * @param month - Month (1-12)
 * @param day - Day of month
 * @param hour - Hour (0-23, optional)
 * @param minute - Minute (0-59, optional)
 * @returns ISO date string
 *
 * @example
 * const date = createISODate(2025, 6, 15); // "2025-06-15T00:00:00.000Z"
 * const dateTime = createISODate(2025, 6, 15, 14, 30); // "2025-06-15T14:30:00.000Z"
 */
export function createISODate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): string {
  return new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString();
}
