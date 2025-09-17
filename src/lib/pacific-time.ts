// Pacific timezone utilities
// Handles both PST (UTC-8) and PDT (UTC-7) automatically

/**
 * Get current date in Pacific timezone
 */
export function getCurrentPacificDate(): Date {
  const now = new Date();
  const pacificTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return new Date(pacificTime.getFullYear(), pacificTime.getMonth(), pacificTime.getDate());
}

/**
 * Convert any date to Pacific timezone date (midnight Pacific time)
 */
export function toPacificDate(date: Date): Date {
  const pacificTime = new Date(date.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  return new Date(pacificTime.getFullYear(), pacificTime.getMonth(), pacificTime.getDate());
}

/**
 * Format date as YYYY-MM-DD in Pacific timezone
 */
export function formatPacificDateString(date: Date): string {
  const pacificDate = toPacificDate(date);
  const year = pacificDate.getFullYear();
  const month = String(pacificDate.getMonth() + 1).padStart(2, "0");
  const day = String(pacificDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a date is today in Pacific timezone
 */
export function isPacificToday(date: Date): boolean {
  const todayPacific = getCurrentPacificDate();
  const datePacific = toPacificDate(date);
  return (
    todayPacific.getFullYear() === datePacific.getFullYear() &&
    todayPacific.getMonth() === datePacific.getMonth() &&
    todayPacific.getDate() === datePacific.getDate()
  );
}

/**
 * Check if a date is in the future relative to Pacific timezone
 */
export function isPacificFutureDate(date: Date): boolean {
  const todayPacific = getCurrentPacificDate();
  const datePacific = toPacificDate(date);
  return datePacific > todayPacific;
}

/**
 * Parse a date string (YYYY-MM-DD) as a Pacific timezone date
 * This prevents timezone shifts when parsing database date strings
 */
export function parsePacificDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get start of next day in Pacific timezone
 */
export function getNextPacificDayStart(date: Date): Date {
  const pacificDate = toPacificDate(date);
  return new Date(pacificDate.getFullYear(), pacificDate.getMonth(), pacificDate.getDate() + 1);
}