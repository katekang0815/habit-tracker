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

/**
 * Get the UTC ISO string for the end of a given month in Pacific timezone
 * This is crucial for database queries to properly include all habits created
 * before the end of the month in Pacific time
 */
export function getPacificMonthEndUTC(year: number, month: number): string {
  // Create date for the last day of the month at 23:59:59.999 Pacific time
  const lastDayOfMonth = new Date(year, month + 1, 0); // Gets last day of month
  const endOfMonthPacific = new Date(
    `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDayOfMonth.getDate()).padStart(2, '0')}T23:59:59.999-08:00`
  );
  
  // Use Intl.DateTimeFormat to handle DST correctly
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'America/Los_Angeles'
  });
  
  // Get the parts to reconstruct the date
  const parts = formatter.formatToParts(endOfMonthPacific);
  const dateParts: any = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      dateParts[part.type] = part.value;
    }
  });
  
  // Create the Pacific time date string
  const pacificDateStr = `${dateParts.year}-${dateParts.month}-${dateParts.day}T23:59:59.999`;
  
  // Create a date in Pacific time and convert to UTC
  const pacificDate = new Date(pacificDateStr + '-08:00'); // Assume PST for conservative calculation
  
  // If it's actually PDT, adjust
  const testFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  });
  const timeZoneName = testFormatter.formatToParts(endOfMonthPacific).find(p => p.type === 'timeZoneName')?.value;
  
  if (timeZoneName === 'PDT') {
    // It's PDT (UTC-7), so we need to adjust
    return new Date(pacificDateStr + '-07:00').toISOString();
  }
  
  return pacificDate.toISOString();
}
