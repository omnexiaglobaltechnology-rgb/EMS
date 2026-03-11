/**
 * Time utility functions for Indian Standard Time (IST)
 *
 * MongoDB Date values are always stored in UTC. To make IST explicit and visible,
 * we keep Date fields as UTC (correct for arithmetic/querying) and also store
 * explicit `...IST` string fields where needed.
 */

const IST_OFFSET_MINUTES = 330;
const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000;

const pad = (n, len = 2) => String(n).padStart(len, '0');

/**
 * Current timestamp (UTC Date object)
 */
const getISTTime = () => new Date();

/**
 * Convert a UTC date into an IST ISO string with +05:30 offset.
 * Example: 2026-03-07T20:41:14.147+05:30
 */
const toISTISOString = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const ist = new Date(date.getTime() + IST_OFFSET_MS);

  const yyyy = ist.getUTCFullYear();
  const mm = pad(ist.getUTCMonth() + 1);
  const dd = pad(ist.getUTCDate());
  const hh = pad(ist.getUTCHours());
  const mi = pad(ist.getUTCMinutes());
  const ss = pad(ist.getUTCSeconds());
  const ms = pad(ist.getUTCMilliseconds(), 3);

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}.${ms}+05:30`;
};

/**
 * Friendly IST representation for UI responses.
 */
const formatISTDate = (dateInput) => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Start of IST day as UTC Date (for MongoDB range queries).
 */
const getISTStartOfDay = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);

  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      0,
      0,
      0,
      0
    ) - IST_OFFSET_MS
  );
};

/**
 * End of IST day as UTC Date (for MongoDB range queries).
 */
const getISTEndOfDay = (dateInput = new Date()) => {
  const date = new Date(dateInput);
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);

  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate(),
      23,
      59,
      59,
      999
    ) - IST_OFFSET_MS
  );
};

const getISTOffset = () => '+05:30';

const isToday = (dateInput) => {
  if (!dateInput) return false;
  const todayStart = getISTStartOfDay();
  const todayEnd = getISTEndOfDay();
  const date = new Date(dateInput);
  return date >= todayStart && date <= todayEnd;
};

module.exports = {
  IST_OFFSET_MS,
  getISTTime,
  toISTISOString,
  formatISTDate,
  getISTStartOfDay,
  getISTEndOfDay,
  getISTOffset,
  isToday
};
