import { API_ENDPOINTS, HTTP_METHODS, fetchData } from '../config/apiConfig';

/**
 * User API
 * Handles all user-related operations
 */

// Account creation/login happens via email OTP now — see src/api/services/userService.js

/**
 * Get all users
 * @returns {Promise} Array of all users
 */
export const getAllUsers = async () => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.GET_ALL_USERS,
      {},
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise} User data
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.GET_USER_BY_ID(userId),
      {},
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Update user information
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} updateData.mobilenumber - Mobile number
 * @param {number} updateData.latitude - Latitude
 * @param {number} updateData.longitude - Longitude
 * @returns {Promise} Updated user data
 */
export const updateUser = async (userId, updateData) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.UPDATE_USER(userId),
      {}, // No query params
      {
        method: HTTP_METHODS.PUT,
        body: JSON.stringify(updateData)
      }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Delete a user
 * @param {string} userId - User ID
 * @returns {Promise} Response from API
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.DELETE_USER(userId),
      {},
      { method: HTTP_METHODS.DELETE }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get user's bookings
 * @param {string} userId - User ID
 * @returns {Promise} Array of user's bookings
 */
export const getMyBookings = async (userId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.MY_BOOKINGS(userId),
      {},
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get user's vehicles
 * @param {string} userId - User ID
 * @returns {Promise} Array of user's vehicles
 */
export const getMyVehicles = async (userId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.MY_VEHICLES(userId),
      {},
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get bookings for user's vehicle
 * @param {string} userId - User ID
 * @param {string} vehicleType - Vehicle type (Car/Bike/Auto)
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise} Array of vehicle bookings
 */
export const getMyVehicleBookings = async (userId, vehicleType, vehicleId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.MY_VEHICLE_BOOKINGS(userId),
      { vechileType: vehicleType, VechileId: vehicleId },
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};
