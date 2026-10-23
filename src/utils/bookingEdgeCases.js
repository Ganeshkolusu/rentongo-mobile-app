/**
 * Booking Edge Cases Handler
 * Handles special scenarios in booking flow
 *
 * Edge cases covered:
 * 1. Customer cancels before owner responds (pending booking)
 * 2. Owner cancels after ride has started
 * 3. Network failure with retry logic
 * 4. Booking timeout/expiry
 * 5. Concurrent modification detection
 */

import { bookingService } from '../api/services/bookingService';
import {
  handleOwnerCancelBooking,
  handleCustomerCancelBooking,
  BOOKING_STATUS,
  CANCEL_REASON
} from './bookingFlowHelper';

/**
 * Edge Case 1: Customer cancels a pending booking (before owner responds)
 * No availability to clear since booking wasn't confirmed
 *
 * @param {Object} booking - Booking object
 * @returns {Promise<Object>} Result
 */
export const handlePendingCancellation = async (booking) => {
  // Verify booking is still pending
  if (booking.status !== BOOKING_STATUS.PENDING) {
    return {
      success: false,
      message: `Cannot cancel: Booking is no longer pending (current status: ${booking.status})`
    };
  }

  try {
    // Simple status update - no availability to clear
    const result = await bookingService.updateBooking(booking._id || booking.id, {
      status: BOOKING_STATUS.CANCELLED,
      cancelledBy: 'customer',
      cancelReason: CANCEL_REASON.CUSTOMER_REQUEST,
      cancelledAt: new Date().toISOString()
    });

    return {
      success: true,
      message: 'Pending booking cancelled successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to cancel pending booking'
    };
  }
};

/**
 * Edge Case 2: Check if ride has started (for cancellation validation)
 *
 * @param {Object} booking - Booking object with FromDate, FromTime, ToDate, ToTime
 * @returns {Object} Status object
 */
export const checkRideStatus = (booking) => {
  const now = new Date();

  // Parse booking dates and times
  const fromDateTime = parseBookingDateTime(booking.FromDate, booking.FromTime);
  const toDateTime = parseBookingDateTime(booking.ToDate, booking.ToTime);

  if (!fromDateTime || !toDateTime) {
    return {
      status: 'unknown',
      canCancel: true,
      message: 'Unable to determine ride timing'
    };
  }

  // Before ride starts
  if (now < fromDateTime) {
    const hoursUntilStart = (fromDateTime - now) / (1000 * 60 * 60);
    return {
      status: 'not_started',
      canCancel: true,
      hoursUntilStart: Math.round(hoursUntilStart * 10) / 10,
      message: `Ride starts in ${Math.round(hoursUntilStart)} hours`
    };
  }

  // During ride
  if (now >= fromDateTime && now <= toDateTime) {
    const hoursInProgress = (now - fromDateTime) / (1000 * 60 * 60);
    return {
      status: 'in_progress',
      canCancel: false,
      requiresSupport: true,
      hoursInProgress: Math.round(hoursInProgress * 10) / 10,
      message: 'Ride is currently in progress. Contact support for emergency cancellation.'
    };
  }

  // After ride ends
  return {
    status: 'completed',
    canCancel: false,
    message: 'Ride has already ended. Cannot cancel completed bookings.'
  };
};

/**
 * Edge Case 2b: Handle mid-ride cancellation attempt
 *
 * @param {Object} booking - Booking object
 * @returns {Object} Validation result
 */
export const handleMidRideCancellation = async (booking) => {
  const rideStatus = checkRideStatus(booking);

  if (rideStatus.status === 'in_progress') {
    return {
      success: false,
      requiresSupport: true,
      message: rideStatus.message,
      supportAction: 'emergency_cancel',
      bookingId: booking._id || booking.id
    };
  }

  if (rideStatus.status === 'completed') {
    return {
      success: false,
      message: rideStatus.message
    };
  }

  // Can proceed with normal cancellation
  return {
    success: true,
    canProceed: true,
    rideStatus
  };
};

/**
 * Edge Case 3: Network failure with retry
 * Retries the operation with exponential backoff
 *
 * @param {Function} operation - Async function to retry
 * @param {Object} params - Parameters for the operation
 * @param {number} maxRetries - Maximum retry attempts (default: 3)
 * @returns {Promise<Object>} Result
 */
export const withRetry = async (operation, params, maxRetries = 3) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(params);

      // If we got a result (even if success:false), return it
      if (result) {
        return result;
      }
    } catch (error) {
      lastError = error;

      // Check if it's a network error
      const isNetworkError =
        error.message?.includes('Network') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch') ||
        error.name === 'NetworkError';

      // Only retry on network errors
      if (isNetworkError && attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Non-network error or max retries reached
      break;
    }
  }

  return {
    success: false,
    message: lastError?.message || 'Operation failed after multiple attempts',
    error: lastError,
    requiresManualRetry: true
  };
};

/**
 * Edge Case 3b: Cancel booking with automatic retry on network failure
 *
 * @param {Object} params - Cancellation parameters
 * @param {boolean} isOwner - True if owner is cancelling
 * @returns {Promise<Object>} Result
 */
export const cancelBookingWithRetry = async (params, isOwner = false) => {
  const operation = isOwner ? handleOwnerCancelBooking : handleCustomerCancelBooking;
  return withRetry(operation, params);
};

/**
 * Edge Case 4: Check if booking has expired/timed out
 *
 * @param {Object} booking - Booking object
 * @param {number} expiryHours - Hours after which pending booking expires (default: 24)
 * @returns {Object} Expiry status
 */
export const checkBookingExpiry = (booking, expiryHours = 24) => {
  if (booking.status !== BOOKING_STATUS.PENDING) {
    return {
      expired: false,
      message: 'Only pending bookings can expire'
    };
  }

  const createdAt = new Date(booking.createdAt || booking.created_at);
  const now = new Date();
  const hoursElapsed = (now - createdAt) / (1000 * 60 * 60);

  if (hoursElapsed >= expiryHours) {
    return {
      expired: true,
      hoursElapsed: Math.round(hoursElapsed),
      message: `Booking has expired (${Math.round(hoursElapsed)} hours old)`
    };
  }

  return {
    expired: false,
    hoursUntilExpiry: Math.round((expiryHours - hoursElapsed) * 10) / 10,
    message: `Booking expires in ${Math.round(expiryHours - hoursElapsed)} hours`
  };
};

/**
 * Edge Case 5: Concurrent modification detection
 * Checks if booking was modified since last fetch
 *
 * @param {Object} booking - Current booking object
 * @param {string} expectedStatus - Expected status
 * @param {Date} lastFetchTime - When the booking was last fetched
 * @returns {Promise<Object>} Validation result
 */
export const validateBookingState = async (booking, expectedStatus, lastFetchTime) => {
  try {
    // Fetch fresh booking data
    const freshBooking = await bookingService.getBookingById(booking._id || booking.id);

    if (!freshBooking || !freshBooking.booking) {
      return {
        valid: false,
        message: 'Booking not found'
      };
    }

    const currentStatus = freshBooking.booking.status || freshBooking.status;

    // Check if status changed
    if (currentStatus !== expectedStatus) {
      return {
        valid: false,
        stale: true,
        currentStatus,
        expectedStatus,
        message: `Booking status has changed from "${expectedStatus}" to "${currentStatus}". Please refresh and try again.`
      };
    }

    // Check if updated after our last fetch (optional, if updatedAt is available)
    const updatedAt = freshBooking.booking.updatedAt || freshBooking.booking.updated_at;
    if (updatedAt && lastFetchTime) {
      const serverUpdateTime = new Date(updatedAt);
      if (serverUpdateTime > lastFetchTime) {
        return {
          valid: false,
          stale: true,
          message: 'Booking was modified by another user. Please refresh and try again.'
        };
      }
    }

    return {
      valid: true,
      booking: freshBooking.booking || freshBooking
    };
  } catch (error) {
    return {
      valid: false,
      message: error.message || 'Failed to validate booking state'
    };
  }
};

/**
 * Helper: Parse booking date and time into Date object
 *
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @param {string} timeStr - Time string (HH:MM or HH:MM AM/PM)
 * @returns {Date|null} Parsed date or null
 */
const parseBookingDateTime = (dateStr, timeStr) => {
  if (!dateStr) return null;

  try {
    let hours = 0;
    let minutes = 0;

    if (timeStr) {
      // Handle "HH:MM AM/PM" format
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        hours = parseInt(timeMatch[1], 10);
        minutes = parseInt(timeMatch[2], 10);

        // Handle AM/PM
        if (timeMatch[3]) {
          if (timeMatch[3].toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (timeMatch[3].toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
      }
    }

    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch (error) {
    return null;
  }
};

/**
 * Safe cancel with all validations
 * Combines all edge case checks before cancellation
 *
 * @param {Object} booking - Booking object
 * @param {boolean} isOwner - True if owner is cancelling
 * @param {Object} additionalParams - Additional parameters for cancellation
 * @returns {Promise<Object>} Result
 */
export const safeCancelBooking = async (booking, isOwner, additionalParams = {}) => {
  // Step 1: Check ride status
  const rideCheck = await handleMidRideCancellation(booking);
  if (!rideCheck.success && !rideCheck.canProceed) {
    return rideCheck;
  }

  // Step 2: Check booking expiry (for pending bookings)
  if (booking.status === BOOKING_STATUS.PENDING) {
    const expiryCheck = checkBookingExpiry(booking);
    if (expiryCheck.expired) {
      // Auto-cancel expired booking
      return await bookingService.updateBooking(booking._id || booking.id, {
        status: BOOKING_STATUS.AUTO_CANCELLED,
        cancelReason: CANCEL_REASON.TIMEOUT,
        cancelledAt: new Date().toISOString()
      });
    }
  }

  // Step 3: Validate current state
  const stateCheck = await validateBookingState(
    booking,
    booking.status,
    new Date(Date.now() - 60000) // Allow 1 minute staleness
  );
  if (!stateCheck.valid) {
    return {
      success: false,
      stale: stateCheck.stale,
      message: stateCheck.message
    };
  }

  // Step 4: Proceed with cancellation (with retry)
  const cancelParams = {
    bookingId: booking._id || booking.id,
    vehicleId: booking.VechileId || booking.vehicleId,
    ...(isOwner
      ? {
          customerId: booking.userId || booking.customerId,
          availabilityId: booking.availabilityId,
          reason: additionalParams.reason || CANCEL_REASON.OWNER_REQUEST
        }
      : {
          ownerId: booking.ownerId || booking.owner_id,
          availabilityId: booking.availabilityId,
          bookingStatus: booking.status
        }),
    fromDate: booking.FromDate,
    ...additionalParams
  };

  return cancelBookingWithRetry(cancelParams, isOwner);
};

export default {
  handlePendingCancellation,
  checkRideStatus,
  handleMidRideCancellation,
  withRetry,
  cancelBookingWithRetry,
  checkBookingExpiry,
  validateBookingState,
  safeCancelBooking
};
