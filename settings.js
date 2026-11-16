export const DEFAULT_INTERVAL_MINUTES = 10;
export const MIN_INTERVAL_MINUTES = 1;
export const MAX_INTERVAL_MINUTES = 1440;

// Keep the existing alarm name so an in-place upgrade has one schedule.
export const ALARM_NAME = "clear-all-website-cookies";

export function isValidInterval(value) {
  return Number.isInteger(value)
    && value >= MIN_INTERVAL_MINUTES
    && value <= MAX_INTERVAL_MINUTES;
}

export function validateInterval(value) {
  if (!isValidInterval(value)) {
    throw new RangeError("Choose a whole number from 1 to 1,440 minutes.");
  }
  return value;
}
