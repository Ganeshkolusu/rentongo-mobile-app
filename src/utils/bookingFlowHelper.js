/**
 * Booking Flow Helper
 * Handles complex booking state transitions with availability sync
 *
 * Flow:
 * 1. Customer creates booking -> PENDING
 * 2. Owner accepts -> CONFIRMED + Auto-block availability
 * 3. Owner/Customer cancels -> CANCELLED + Remove blocked availability
 */

import { bookingService } from '../api/services/bookingService';
import {
  createNotAvailability,
  deleteNotAvailability
} from '../api/services/availabilityService';
import { BOOKING_NOTIFICATIONS } from '../constants/NotificationTemplates';
import { acquireBookingLock, releaseBookingLock } from './bookingLock';

// Booking status constants
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  AUTO_CANCELLED: 'AutoCancelled'
};

// Cancellation reason constants
export const CANCEL_REASON = {
  OWNER_UNAVAILABLE: 'owner_unavailable',
  CUSTOMER_REQUEST: 'customer_request',
  OWNER_REQUEST: 'owner_request',
  VEHICLE_ISSUE: 'vehicle_issue',
  TIMEOUT: 'timeout'
};

/**
 * Helper to send push notification via backend
 * @param {Object} params - Notification parameters
 */
const sendPushNotification = async ({ userId, title, body, data }) => {
  try {
    const { API_CONFIG } = require('../config/apiConfig');

    const response = await fetch(`${API_CONFIG.BASE_URL}/sendNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data: {
          ...data,
          notificationType: data.type || 'general'
        }
      }),
    });

    return response.ok;
  } catch (error) {
    return false;
  }
};

/**
 * Owner accepts a booking request
 * - Updates booking status to Confirmed
 * - Creates blocked availability for the booked dates
 * - Sends notification to customer
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.vehicleId - Vehicle ID
 * @param {string} params.vehicleType - Vehicle type (Car/Bike/Auto)
 * @param {string} params.ownerId - Owner user ID
 * @param {string} params.customerId - Customer user ID
 * @param {string} params.fromDate - Start date (YYYY-MM-DD)
 * @param {string} params.toDate - End date (YYYY-MM-DD)
 * @param {string} params.fromTime - Start time (HH:MM)
 * @param {string} params.toTime - End time (HH:MM)
 * @param {string} params.vehicleName - Vehicle name for notification
 * @returns {Promise<Object>} Result with success status
 */
export const handleOwnerAcceptBooking = async ({
  bookingId,
  vehicleId,
  vehicleType,
  ownerId,
  customerId,
  fromDate,
  toDate,
  fromTime,
  toTime,
  vehicleName = 'vehicle'
}) => {
  let lockAcquired = false;

  try {
    // Acquire lock to prevent race conditions
    await acquireBookingLock(bookingId);
    lockAcquired = true;

    // Step 1: Confirm the booking via API
    const confirmResult = await bookingService.confirmBooking(bookingId, 'conform');

    if (!confirmResult?.success && !confirmResult?.booking) {
      throw new Error(confirmResult?.message || 'Failed to confirm booking');
    }

    // Step 2: Auto-block availability for booked dates
    // This prevents double-booking
    let availabilityId = null;
    try {
      const availabilityData = {
        userId: ownerId,
        vechileType: vehicleType,
        VechileId: vehicleId,
        fromDate,
        toDate,
        fromTime: fromTime || '00:00',
        toTime: toTime || '23:59',
        isNotAvailable: true,
        reason: 'Booked by customer',
        bookingId: bookingId,
        type: 'Booking'
      };

      const availabilityResult = await createNotAvailability(availabilityData);
      availabilityId = availabilityResult?.data?._id || availabilityResult?._id;
    } catch (availError) {
      // Log but don't fail - availability blocking is secondary
      console.warn('Failed to create availability block:', availError);
    }

    // Step 3: Send notification to customer
    const notification = BOOKING_NOTIFICATIONS.BOOKING_CONFIRMED;
    await sendPushNotification({
      userId: customerId,
      title: notification.title,
      body: typeof notification.body === 'function'
        ? notification.body({ vehicleName, fromDate, fromTime })
        : notification.body,
      data: {
        type: 'booking',
        notificationType: 'booking',
        bookingId,
        vehicleId,
        status: 'Confirmed',
        action: 'view_booking'
      }
    });

    return {
      success: true,
      booking: confirmResult.booking || confirmResult,
      availabilityId
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to accept booking'
    };
  } finally {
    if (lockAcquired) {
      releaseBookingLock(bookingId);
    }
  }
};

/**
 * Owner cancels a confirmed booking
 * - Updates booking status to Cancelled
 * - Removes the blocked availability (frees up dates)
 * - Sends notification to customer
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.vehicleId - Vehicle ID
 * @param {string} params.customerId - Customer user ID
 * @param {string} params.availabilityId - The blocked availability slot ID (optional)
 * @param {string} params.reason - Cancellation reason
 * @param {string} params.fromDate - Booking start date (for notification)
 * @returns {Promise<Object>} Result with success status
 */
export const handleOwnerCancelBooking = async ({
  bookingId,
  vehicleId,
  customerId,
  availabilityId = null,
  reason = CANCEL_REASON.OWNER_UNAVAILABLE,
  fromDate = ''
}) => {
  let lockAcquired = false;

  try {
    // Acquire lock to prevent race conditions
    await acquireBookingLock(bookingId);
    lockAcquired = true;

    // Step 1: Update booking status to cancelled
    const cancelResult = await bookingService.updateBooking(bookingId, {
      status: BOOKING_STATUS.CANCELLED,
      cancelledBy: 'owner',
      cancelReason: reason,
      cancelledAt: new Date().toISOString()
    });

    if (!cancelResult?.success && !cancelResult?.booking) {
      throw new Error(cancelResult?.message || 'Failed to cancel booking');
    }

    // Step 2: Remove the blocked availability (free up the dates)
    if (availabilityId) {
      try {
        await deleteNotAvailability(availabilityId);
      } catch (availError) {
        // Log but don't fail - manual cleanup may be needed
        console.warn('Failed to delete availability block:', availError);
      }
    }

    // Step 3: Send notification to customer
    const notification = BOOKING_NOTIFICATIONS.BOOKING_CANCELLED_BY_OWNER;
    await sendPushNotification({
      userId: customerId,
      title: notification.title,
      body: typeof notification.body === 'function'
        ? notification.body({ reason })
        : notification.body,
      data: {
        type: 'reject',
        notificationType: 'reject',
        bookingId,
        vehicleId,
        status: 'Cancelled',
        cancelledBy: 'owner',
        reason,
        action: 'view_cancellation'
      }
    });

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to cancel booking'
    };
  } finally {
    if (lockAcquired) {
      releaseBookingLock(bookingId);
    }
  }
};

/**
 * Customer cancels a booking
 * - Updates booking status to Cancelled
 * - If confirmed, removes blocked availability
 * - Sends notification to owner
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.vehicleId - Vehicle ID
 * @param {string} params.ownerId - Owner user ID
 * @param {string} params.availabilityId - The blocked availability slot ID (if confirmed)
 * @param {string} params.bookingStatus - Current booking status
 * @param {string} params.fromDate - Booking start date (for notification)
 * @returns {Promise<Object>} Result with success status
 */
export const handleCustomerCancelBooking = async ({
  bookingId,
  vehicleId,
  ownerId,
  availabilityId = null,
  bookingStatus = BOOKING_STATUS.PENDING,
  fromDate = ''
}) => {
  let lockAcquired = false;

  try {
    // Acquire lock to prevent race conditions
    await acquireBookingLock(bookingId);
    lockAcquired = true;

    // Step 1: Update booking status
    const cancelResult = await bookingService.updateBooking(bookingId, {
      status: BOOKING_STATUS.CANCELLED,
      cancelledBy: 'customer',
      cancelReason: CANCEL_REASON.CUSTOMER_REQUEST,
      cancelledAt: new Date().toISOString()
    });

    if (!cancelResult?.success && !cancelResult?.booking) {
      throw new Error(cancelResult?.message || 'Failed to cancel booking');
    }

    // Step 2: If booking was confirmed, free up availability
    if (bookingStatus === BOOKING_STATUS.CONFIRMED && availabilityId) {
      try {
        await deleteNotAvailability(availabilityId);
      } catch (availError) {
        console.warn('Failed to delete availability block:', availError);
      }
    }

    // Step 3: Notify owner
    const notification = BOOKING_NOTIFICATIONS.BOOKING_CANCELLED_BY_CUSTOMER;
    await sendPushNotification({
      userId: ownerId,
      title: notification.title,
      body: typeof notification.body === 'function'
        ? notification.body({ fromDate })
        : notification.body,
      data: {
        type: 'booking',
        notificationType: 'booking',
        bookingId,
        vehicleId,
        status: 'Cancelled',
        cancelledBy: 'customer',
        action: 'view_cancellation'
      }
    });

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to cancel booking'
    };
  } finally {
    if (lockAcquired) {
      releaseBookingLock(bookingId);
    }
  }
};

/**
 * Owner rejects a pending booking request
 * - Updates booking status to Rejected
 * - Sends notification to customer
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.vehicleId - Vehicle ID
 * @param {string} params.customerId - Customer user ID
 * @param {string} params.reason - Rejection reason (optional)
 * @returns {Promise<Object>} Result with success status
 */
export const handleOwnerRejectBooking = async ({
  bookingId,
  vehicleId,
  customerId,
  reason = ''
}) => {
  let lockAcquired = false;

  try {
    await acquireBookingLock(bookingId);
    lockAcquired = true;

    // Step 1: Reject the booking via API
    const rejectResult = await bookingService.confirmBooking(bookingId, 'reject');

    if (!rejectResult?.success && !rejectResult?.booking) {
      throw new Error(rejectResult?.message || 'Failed to reject booking');
    }

    // Step 2: Send notification to customer
    const notification = BOOKING_NOTIFICATIONS.BOOKING_REJECTED;
    await sendPushNotification({
      userId: customerId,
      title: notification.title,
      body: notification.body,
      data: {
        type: 'reject',
        notificationType: 'reject',
        bookingId,
        vehicleId,
        status: 'Rejected',
        action: 'view_rejection'
      }
    });

    return {
      success: true,
      booking: rejectResult.booking || rejectResult
    };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to reject booking'
    };
  } finally {
    if (lockAcquired) {
      releaseBookingLock(bookingId);
    }
  }
};

/**
 * Handle booking completion - sends notification to customer with default sound
 * Called when booking status is automatically updated to Completed
 *
 * @param {Object} params
 * @param {string} params.bookingId - Booking ID
 * @param {string} params.customerId - Customer user ID
 * @param {string} params.vehicleName - Vehicle name for notification
 * @returns {Promise<Object>} Result with success status
 */
export const handleBookingCompleted = async ({
  bookingId,
  customerId,
  vehicleName = 'vehicle'
}) => {
  try {
    if (!customerId) {
      return { success: false, message: 'Customer ID is required' };
    }

    // Send notification to customer with default sound (type: 'completed')
    const notification = BOOKING_NOTIFICATIONS.BOOKING_COMPLETED;
    await sendPushNotification({
      userId: customerId,
      title: notification.title,
      body: typeof notification.body === 'function'
        ? notification.body({ vehicleName, askReview: true })
        : notification.body,
      data: {
        type: 'completed',
        notificationType: 'completed',
        bookingId,
        status: 'Completed',
        action: 'view_booking'
      }
    });

    return { success: true };

  } catch (error) {
    return {
      success: false,
      message: error.message || 'Failed to send completion notification'
    };
  }
};

export default {
  handleOwnerAcceptBooking,
  handleOwnerCancelBooking,
  handleCustomerCancelBooking,
  handleOwnerRejectBooking,
  handleBookingCompleted,
  BOOKING_STATUS,
  CANCEL_REASON
};
