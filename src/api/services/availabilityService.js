/**
 * Availability API Service
 * Vehicle availability and scheduling-related API calls
 */

import { del, get, postUrlEncoded, putUrlEncoded } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Create a not-available period for a vehicle
 * @param {object} availabilityData - Availability data
 * @param {string} availabilityData.userId - User ID
 * @param {string} availabilityData.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} availabilityData.VechileId - Vehicle ID
 * @param {string} availabilityData.fromDate - From date (YYYY-MM-DD)
 * @param {string} availabilityData.toDate - To date (YYYY-MM-DD)
 * @param {string} availabilityData.fromTime - From time (HH:MM)
 * @param {string} availabilityData.toTime - To time (HH:MM)
 * @param {boolean} availabilityData.isNotAvailable - Is not available flag
 * @returns {Promise} Created availability record
 */
export const createNotAvailability = async (availabilityData) => {
  return postUrlEncoded(API_ENDPOINTS.AVAILABILITY.CREATE_NOT_AVAILABLE, availabilityData);
};
/**
 * Update a not-available period
 * @param {string} availabilityId - Availability record ID
 * @param {object} updateData - Data to update
 * @param {string} [updateData.vechileType] - Vehicle type
 * @param {string} [updateData.VechileId] - Vehicle ID
 * @param {string} [updateData.fromDate] - From date (YYYY-MM-DD)
 * @param {string} [updateData.toDate] - To date (YYYY-MM-DD)
 * @param {string} [updateData.fromTime] - From time (HH:MM)
 * @param {string} [updateData.toTime] - To time (HH:MM)
 * @param {boolean} [updateData.isNotAvailable] - Is not available flag
 * @returns {Promise} Updated availability record
 */
export const updateNotAvailability = async (availabilityId, updateData) => {
  return putUrlEncoded(API_ENDPOINTS.AVAILABILITY.UPDATE_NOT_AVAILABLE(availabilityId), updateData);
};

/**
 * Delete a not-available period
 * @param {string} availabilityId - Availability record ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteNotAvailability = async (availabilityId) => {
  return del(API_ENDPOINTS.AVAILABILITY.DELETE_NOT_AVAILABLE(availabilityId));
};

/**
 * Get not-available period by ID
 * @param {string} availabilityId - Availability record ID
 * @returns {Promise} Availability record details
 */
export const getNotAvailabilityById = async (availabilityId) => {
  return get(API_ENDPOINTS.AVAILABILITY.GET_NOT_AVAILABLE_BY_ID(availabilityId));
};

/**
 * Get vehicle availability for a date range
 * @param {object} params - Query parameters
 * @param {string} params.VechileId - Vehicle ID
 * @param {string} params.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} params.startDate - Start date (YYYY-MM-DD)
 * @param {string} params.endDate - End date (YYYY-MM-DD)
 * @returns {Promise} Vehicle availability data
 */
export const getVehicleAvailability = async (params) => {
  return get(API_ENDPOINTS.AVAILABILITY.GET_VEHICLE_AVAILABILITY, params);
};

export default {
  createNotAvailability,
  updateNotAvailability,
  deleteNotAvailability,
  getNotAvailabilityById,
  getVehicleAvailability,
};