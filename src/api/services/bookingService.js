/**
 * Booking API Service
 * All booking-related API calls
 */

import { get, postUrlEncoded, put, del } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Create a new booking
 * @param {object} bookingData - Booking data
 * @param {string} bookingData.userId - User ID
 * @param {string} bookingData.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} bookingData.VechileId - Vehicle ID
 * @param {string} bookingData.pricePerKm - Price per km
 * @param {string} bookingData.pricePerHour - Price per hour
 * @param {string} bookingData.pricePerDay - Price per day
 * @param {string} bookingData.contactNumber - Contact number
 * @param {string} bookingData.contactName - Contact name
 * @param {string} bookingData.latitude - Latitude
 * @param {string} bookingData.longitude - Longitude
 * @param {string} bookingData.FromDate - From date (YYYY-MM-DD)
 * @param {string} bookingData.ToDate - To date (YYYY-MM-DD)
 * @param {string} bookingData.FromTime - From time (HH:MM)
 * @param {string} bookingData.ToTime - To time (HH:MM)
 * @param {string} bookingData.totalHours - Total hours
 * @param {string} bookingData.totalPrice - Total price
 * @returns {Promise} Created booking data
 */
export const createBooking = async (bookingData) => {
  return postUrlEncoded(API_ENDPOINTS.BOOKING.CREATE, bookingData);
};

/**
 * Update an existing booking
 * @param {string} bookingId - Booking ID
 * @param {object} updateData - Data to update
 * @returns {Promise} Updated booking data
 */
export const updateBooking = async (bookingId, updateData = {}) => {
  return put(API_ENDPOINTS.BOOKING.UPDATE(bookingId), updateData);
};

/**
 * Delete a booking
 * @param {string} bookingId - Booking ID (optional, can be in query)
 * @returns {Promise} Deletion confirmation
 */
export const deleteBooking = async (bookingId) => {
  return del(API_ENDPOINTS.BOOKING.DELETE, bookingId ? { bookingId } : {});
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Booking details
 */
export const getBookingById = async (bookingId) => {
  return get(API_ENDPOINTS.BOOKING.GET_BY_ID(bookingId));
};

/**
 * Get all bookings with filters
 * @param {object} params - Query parameters
 * @param {string} [params.userId] - User ID
 * @param {string} [params.VechileId] - Vehicle ID
 * @param {string} [params.vechileType] - Vehicle type
 * @param {string} [params.startDate] - Start date
 * @param {string} [params.endDate] - End date
 * @param {string} [params.status] - Booking status (Pending/Confirmed/Cancelled/Completed)
 * @returns {Promise} Array of bookings
 */
export const getAllBookings = async (params = {}) => {
  return get(API_ENDPOINTS.BOOKING.GET_ALL, params);
};

/**
 * Confirm or reject a booking
 * @param {string} bookingId - Booking ID
 * @param {string} action - Action to perform ('conform' or 'reject')
 * @returns {Promise} Confirmation response
 */
export const confirmBooking = async (bookingId, action = 'conform') => {
  return postUrlEncoded(API_ENDPOINTS.BOOKING.CONFIRM(bookingId, action), {});
};

export default {
  createBooking,
  updateBooking,
  deleteBooking,
  getBookingById,
  getAllBookings,
  confirmBooking,
};
