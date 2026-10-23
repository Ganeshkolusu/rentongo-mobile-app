/**
 * Booking Lock Utility
 * Prevents race conditions during booking operations
 *
 * Use this to ensure only one operation can run on a booking at a time.
 * This prevents issues like:
 * - Double acceptance/rejection
 * - Simultaneous cancellation attempts
 * - Conflicting availability updates
 */

// In-memory lock storage
const activeLocks = new Map();

// Lock timeout in milliseconds (30 seconds)
const LOCK_TIMEOUT = 30000;

/**
 * Acquire a lock for a booking operation
 * Throws an error if the booking is already locked
 *
 * @param {string} bookingId - The booking ID to lock
 * @returns {Promise<boolean>} True if lock acquired
 * @throws {Error} If booking is already locked
 */
export const acquireBookingLock = async (bookingId) => {
  if (!bookingId) {
    throw new Error('Booking ID is required for locking');
  }

  // Check if already locked
  if (activeLocks.has(bookingId)) {
    const existingLock = activeLocks.get(bookingId);
    const lockAge = Date.now() - existingLock.timestamp;

    // If lock is expired, remove it
    if (lockAge > LOCK_TIMEOUT) {
      clearTimeout(existingLock.timeout);
      activeLocks.delete(bookingId);
    } else {
      throw new Error('Operation already in progress for this booking. Please wait and try again.');
    }
  }

  // Create new lock
  const lock = {
    timestamp: Date.now(),
    timeout: setTimeout(() => {
      // Auto-release lock after timeout
      activeLocks.delete(bookingId);
      console.warn(`Lock auto-released for booking: ${bookingId}`);
    }, LOCK_TIMEOUT)
  };

  activeLocks.set(bookingId, lock);
  return true;
};

/**
 * Release a lock for a booking
 *
 * @param {string} bookingId - The booking ID to unlock
 */
export const releaseBookingLock = (bookingId) => {
  if (!bookingId) return;

  const lock = activeLocks.get(bookingId);
  if (lock) {
    clearTimeout(lock.timeout);
    activeLocks.delete(bookingId);
  }
};

/**
 * Check if a booking is currently locked
 *
 * @param {string} bookingId - The booking ID to check
 * @returns {boolean} True if locked
 */
export const isBookingLocked = (bookingId) => {
  if (!bookingId) return false;

  const lock = activeLocks.get(bookingId);
  if (!lock) return false;

  // Check if lock is expired
  const lockAge = Date.now() - lock.timestamp;
  if (lockAge > LOCK_TIMEOUT) {
    clearTimeout(lock.timeout);
    activeLocks.delete(bookingId);
    return false;
  }

  return true;
};

/**
 * Execute a function with automatic lock management
 * Acquires lock before execution, releases after (success or failure)
 *
 * @param {string} bookingId - The booking ID to lock
 * @param {Function} fn - The async function to execute
 * @returns {Promise<any>} Result of the function
 */
export const withBookingLock = async (bookingId, fn) => {
  await acquireBookingLock(bookingId);

  try {
    return await fn();
  } finally {
    releaseBookingLock(bookingId);
  }
};

/**
 * Get current lock status (for debugging)
 *
 * @returns {Object} Lock status info
 */
export const getLockStatus = () => {
  const locks = {};
  activeLocks.forEach((lock, bookingId) => {
    locks[bookingId] = {
      timestamp: lock.timestamp,
      age: Date.now() - lock.timestamp,
      expired: (Date.now() - lock.timestamp) > LOCK_TIMEOUT
    };
  });
  return locks;
};

/**
 * Clear all locks (use with caution - for cleanup/testing)
 */
export const clearAllLocks = () => {
  activeLocks.forEach((lock) => {
    clearTimeout(lock.timeout);
  });
  activeLocks.clear();
};

export default {
  acquireBookingLock,
  releaseBookingLock,
  isBookingLocked,
  withBookingLock,
  getLockStatus,
  clearAllLocks
};
