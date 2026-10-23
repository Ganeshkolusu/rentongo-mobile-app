/**
 * Notification Templates
 * Centralized notification message templates for booking flow
 *
 * Usage:
 * - title: Static string or dynamic function
 * - body: Static string or function that receives data object
 *
 * Example:
 * const msg = BOOKING_NOTIFICATIONS.BOOKING_CONFIRMED;
 * const body = typeof msg.body === 'function'
 *   ? msg.body({ vehicleName: 'Honda City', fromDate: '2025-12-10', fromTime: '09:00' })
 *   : msg.body;
 */

// ============ BOOKING NOTIFICATIONS ============

export const BOOKING_NOTIFICATIONS = {
  // ---------- For Customer ----------

  /**
   * Sent to customer when owner confirms their booking
   */
  BOOKING_CONFIRMED: {
    title: 'Booking Confirmed! 🎉',
    body: (data) =>
      `Your booking for ${data.vehicleName || 'the vehicle'} has been confirmed. ` +
      `Pickup: ${data.fromDate || 'scheduled date'}${data.fromTime ? ` at ${data.fromTime}` : ''}`
  },

  /**
   * Sent to customer when owner rejects their booking request
   */
  BOOKING_REJECTED: {
    title: 'Booking Declined',
    body: 'Unfortunately, the owner has declined your booking request. You can try booking another vehicle.'
  },

  /**
   * Sent to customer when owner cancels a confirmed booking
   */
  BOOKING_CANCELLED_BY_OWNER: {
    title: 'Booking Cancelled ❌',
    body: (data) => {
      const reasons = {
        owner_unavailable: 'The owner is no longer available for the selected dates.',
        vehicle_issue: 'The vehicle has encountered an issue and is unavailable.',
        owner_request: 'The owner has cancelled the booking.'
      };
      return reasons[data?.reason] || 'Your booking has been cancelled by the owner.';
    }
  },

  /**
   * Sent to customer when their booking is auto-cancelled due to timeout
   */
  BOOKING_AUTO_CANCELLED: {
    title: 'Booking Auto-Cancelled',
    body: (data) =>
      `Your booking request has been automatically cancelled as the owner did not respond within ${data?.hours || 24} hours.`
  },

  /**
   * Confirmation sent to customer after they submit a booking
   */
  BOOKING_SUBMITTED: {
    title: 'Booking Request Sent ✓',
    body: (data) =>
      `Your booking request for ${data.vehicleName || 'the vehicle'} has been sent to the owner. ` +
      `You will be notified once they respond.`
  },

  // ---------- For Owner ----------

  /**
   * Sent to owner when a customer requests to book their vehicle
   */
  NEW_BOOKING_REQUEST: {
    title: 'New Booking Request 📩',
    body: (data) =>
      `${data.customerName || 'A customer'} wants to book your ${data.vehicleName || 'vehicle'} ` +
      `from ${data.fromDate || 'selected dates'}${data.toDate && data.toDate !== data.fromDate ? ` to ${data.toDate}` : ''}.`
  },

  /**
   * Sent to owner when customer cancels their booking
   */
  BOOKING_CANCELLED_BY_CUSTOMER: {
    title: 'Booking Cancelled',
    body: (data) =>
      `The customer has cancelled their booking${data?.fromDate ? ` for ${data.fromDate}` : ''}.` +
      (data?.vehicleName ? ` Vehicle: ${data.vehicleName}` : '')
  },

  // ---------- Reminders ----------

  /**
   * Reminder sent 24 hours before booking starts
   */
  BOOKING_REMINDER_24H: {
    title: 'Upcoming Booking Tomorrow 🚗',
    body: (data) =>
      `Reminder: Your booking starts tomorrow at ${data.fromTime || 'scheduled time'}. ` +
      `Vehicle: ${data.vehicleName || 'your booked vehicle'}`
  },

  /**
   * Reminder sent 1 hour before booking starts
   */
  BOOKING_REMINDER_1H: {
    title: 'Booking Starting Soon!',
    body: (data) =>
      `Your booking starts in 1 hour at ${data.fromTime || 'soon'}. ` +
      `Get ready for pickup!`
  },

  /**
   * Reminder for owner about pending booking request
   */
  PENDING_BOOKING_REMINDER: {
    title: 'Pending Booking Request',
    body: (data) =>
      `You have a pending booking request${data?.hoursOld ? ` (${data.hoursOld}h old)` : ''}. ` +
      `Please respond to avoid auto-cancellation.`
  },

  // ---------- Completion ----------

  /**
   * Sent when booking/ride is completed
   */
  BOOKING_COMPLETED: {
    title: 'Ride Completed! ⭐',
    body: (data) =>
      `Your ride has been completed. ${data?.askReview ? 'Please rate your experience!' : 'Thank you for using our service!'}`
  },

  /**
   * Sent to owner when customer completes their booking
   */
  BOOKING_COMPLETED_OWNER: {
    title: 'Booking Completed',
    body: (data) =>
      `The booking for your ${data.vehicleName || 'vehicle'} has been completed. ` +
      `Your vehicle is now available for new bookings.`
  }
};

// ============ PAYMENT NOTIFICATIONS ============

export const PAYMENT_NOTIFICATIONS = {
  PAYMENT_RECEIVED: {
    title: 'Payment Received 💰',
    body: (data) => `Payment of ₹${data.amount || ''} received for booking.`
  },

  PAYMENT_FAILED: {
    title: 'Payment Failed',
    body: 'Your payment could not be processed. Please try again or use a different payment method.'
  },

  REFUND_INITIATED: {
    title: 'Refund Initiated',
    body: (data) =>
      `A refund of ₹${data.amount || ''} has been initiated. ` +
      `It will be credited within ${data.days || '5-7'} business days.`
  },

  REFUND_COMPLETED: {
    title: 'Refund Completed ✓',
    body: (data) => `Your refund of ₹${data.amount || ''} has been credited to your account.`
  }
};

// ============ SYSTEM NOTIFICATIONS ============

export const SYSTEM_NOTIFICATIONS = {
  ACCOUNT_VERIFIED: {
    title: 'Account Verified ✓',
    body: 'Your account has been verified. You can now start booking vehicles!'
  },

  DOCUMENT_APPROVED: {
    title: 'Document Approved',
    body: (data) => `Your ${data.documentType || 'document'} has been approved.`
  },

  DOCUMENT_REJECTED: {
    title: 'Document Rejected',
    body: (data) =>
      `Your ${data.documentType || 'document'} was rejected. ` +
      `Reason: ${data.reason || 'Please upload a clearer image.'}`
  },

  VEHICLE_APPROVED: {
    title: 'Vehicle Listed! 🎉',
    body: (data) =>
      `Your ${data.vehicleName || 'vehicle'} has been approved and is now visible to customers.`
  },

  VEHICLE_REJECTED: {
    title: 'Vehicle Listing Rejected',
    body: (data) =>
      `Your vehicle listing was rejected. Reason: ${data.reason || 'Please check the requirements and try again.'}`
  }
};

// ============ HELPER FUNCTIONS ============

/**
 * Get formatted notification body
 * @param {Object} template - Notification template
 * @param {Object} data - Data for dynamic body
 * @returns {string} Formatted body text
 */
export const getNotificationBody = (template, data = {}) => {
  if (typeof template.body === 'function') {
    return template.body(data);
  }
  return template.body;
};

/**
 * Get complete notification object ready to send
 * @param {Object} template - Notification template
 * @param {Object} data - Data for dynamic content
 * @returns {Object} Complete notification object
 */
export const buildNotification = (template, data = {}) => {
  return {
    title: template.title,
    body: getNotificationBody(template, data)
  };
};

export default {
  BOOKING_NOTIFICATIONS,
  PAYMENT_NOTIFICATIONS,
  SYSTEM_NOTIFICATIONS,
  getNotificationBody,
  buildNotification
};
