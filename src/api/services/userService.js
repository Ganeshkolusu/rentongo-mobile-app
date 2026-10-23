/**
 * User API Service
 * All user-related API calls
 */

import { Platform } from 'react-native';
import { del, get, post, putFormData, putUrlEncoded } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Request an email OTP for login/signup (no password, no Google Sign-In)
 * @param {string} email
 * @returns {Promise}
 */
export const requestOtp = async (email) => {
  return post(API_ENDPOINTS.AUTH.REQUEST_OTP, { email });
};

/**
 * Verify an email OTP — creates the account on first verify, logs in otherwise
 * @param {object} data
 * @param {string} data.email
 * @param {string} data.otp
 * @param {string} [data.name] - Used only if this is a new account
 * @param {string} [data.fcmToken]
 * @param {string} [data.platform]
 * @returns {Promise} { user, token }
 */
export const verifyOtp = async (data) => {
  return post(API_ENDPOINTS.AUTH.VERIFY_OTP, data);
};

/**
 * Get all users
 * @returns {Promise} Array of users
 */
export const getAllUsers = async () => {
  return get(API_ENDPOINTS.USER.GET_ALL);
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise} User data
 */
export const getUserById = async (userId) => {
  if (!userId) {
    return null;
  }
  return get(API_ENDPOINTS.USER.GET_BY_ID(userId));
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {object} updateData - Data to update
 * @param {string} updateData.mobilenumber - Mobile number
 * @param {string} updateData.latitude - Latitude
 * @param {string} updateData.longitude - Longitude
 * @returns {Promise} Updated user data
 */
export const updateUser = async (userId, updateData) => {
  return putUrlEncoded(API_ENDPOINTS.USER.UPDATE(userId), updateData);
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteUser = async (userId) => {
  return del(API_ENDPOINTS.USER.DELETE(userId));
};

/**
 * Get user's bookings
 * @param {string} userId - User ID
 * @returns {Promise} Array of user bookings
 */
export const getMyBookings = async (userId) => {
  if (!userId) {
    return { bookings: [] };
  }
  return get(API_ENDPOINTS.USER.MY_BOOKINGS(userId));
};

/**
 * Get user's listed vehicles
 * @param {string} userId - User ID
 * @returns {Promise} Array of user's vehicles
 */
export const getMyVehicles = async (userId) => {
  if (!userId) {
    return { vehicles: [] };
  }
  return get(API_ENDPOINTS.USER.MY_VEHICLES(userId));
};

/**
 * Get bookings for user's vehicles
 * @param {string} userId - User ID
 * @param {object} params - Query parameters
 * @param {string} params.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} params.VechileId - Vehicle ID
 * @returns {Promise} Array of vehicle bookings
 */
export const getMyVehicleBookings = async (userId, params = {}) => {
  if (!userId) {
    return { bookings: [] };
  }
  return get(API_ENDPOINTS.USER.MY_VEHICLE_BOOKINGS(userId), params);
};

/**
 * Upload profile image
 * @param {string} userId - User ID
 * @param {string} imageUri - Local image URI
 * @returns {Promise} Updated user data with profileImage URL
 */
export const uploadProfileImage = async (userId, imageUri) => {
  const formData = new FormData();

  // Get file extension from URI
  const uriParts = imageUri.split('.');
  const fileType = uriParts[uriParts.length - 1];

  formData.append('profileImage', {
    uri: Platform.OS === 'android' ? imageUri : imageUri.replace('file://', ''),
    type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
    name: `profile_${userId}.${fileType}`,
  });

  return putFormData(API_ENDPOINTS.USER.UPLOAD_PROFILE_IMAGE(userId), formData);
};

export default {
  requestOtp,
  verifyOtp,
  getAllUsers,
  getUserById,
  updateUser,
  uploadProfileImage,
  deleteUser,
  getMyBookings,
  getMyVehicles,
  getMyVehicleBookings,
};
