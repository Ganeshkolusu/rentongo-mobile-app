/**
 * Bike API Service
 * All bike-related API calls
 */

import { get, postFormData, putFormData, del } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Create a new bike listing
 * @param {FormData} bikeData - Bike data as FormData
 * @returns {Promise} Created bike data
 */
export const createBike = async (bikeData) => {
  return postFormData(API_ENDPOINTS.BIKE.CREATE, bikeData);
};

/**
 * Update an existing bike listing
 * @param {string} bikeId - Bike ID
 * @param {FormData} bikeData - Bike data to update as FormData
 * @returns {Promise} Updated bike data
 */
export const updateBike = async (bikeId, bikeData) => {
  return putFormData(API_ENDPOINTS.BIKE.UPDATE(bikeId), bikeData);
};

/**
 * Delete a bike listing
 * @param {string} bikeId - Bike ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteBike = async (bikeId) => {
  return del(API_ENDPOINTS.BIKE.DELETE(bikeId));
};

/**
 * Get nearby bikes based on location and filters
 * @param {object} params - Query parameters
 * @param {number} params.latitude - Current latitude
 * @param {number} params.longitude - Current longitude
 * @param {number} [params.range] - Search range in kilometers
 * @param {string} [params.bikeName] - Bike name filter
 * @param {string} [params.bikeModel] - Bike model filter
 * @param {number} [params.priceMin] - Minimum price
 * @param {number} [params.priceMax] - Maximum price
 * @param {string} [params.fromDate] - From date (YYYY-MM-DD)
 * @param {string} [params.toDate] - To date (YYYY-MM-DD)
 * @param {string} [params.fromTime] - From time (HH:MM)
 * @param {string} [params.toTime] - To time (HH:MM)
 * @returns {Promise} Array of nearby bikes
 */
export const getNearbyBikes = async (params) => {
  return get(API_ENDPOINTS.BIKE.GET_NEARBY, params);
};

/**
 * Get bike details by ID
 * @param {string} bikeId - Bike ID
 * @returns {Promise} Bike details
 */
export const getBikeById = async (bikeId) => {
  return get(API_ENDPOINTS.BIKE.GET_BY_ID(bikeId));
};

export default {
  createBike,
  updateBike,
  deleteBike,
  getNearbyBikes,
  getBikeById,
};
