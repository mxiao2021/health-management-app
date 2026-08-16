export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Monday 00:00 UTC of the week containing `date`. */
export function weekStart(date: Date = new Date()): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayIndex = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayIndex);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** 0 = Monday ... 6 = Sunday */
export function dayIndexOf(date: Date = new Date()): number {
  return (date.getUTCDay() + 6) % 7;
}

export function isSunday(date: Date = new Date()): boolean {
  return dayIndexOf(date) === 6;
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
