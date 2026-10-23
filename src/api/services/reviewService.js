/**
 * Review API Service
 * All review and rating-related API calls
 */

import { get, postUrlEncoded, put, del } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Add a new review
 * @param {object} reviewData - Review data
 * @param {string} reviewData.userId - User ID
 * @param {string} reviewData.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} reviewData.VechileId - Vehicle ID
 * @param {string} reviewData.BookingId - Booking ID
 * @param {string} reviewData.review - Review text
 * @param {number} reviewData.rating - Rating (1-5)
 * @returns {Promise} Created review data
 */
export const addReview = async (reviewData) => {
  return postUrlEncoded(API_ENDPOINTS.REVIEW.ADD, reviewData);
};

/**
 * Get reviews
 * @param {object} params - Query parameters
 * @param {string} [params.vechileType] - Vehicle type
 * @param {string} [params.VechileId] - Vehicle ID
 * @returns {Promise} Array of reviews
 */
export const getReviews = async (params = {}) => {
  const response = await get(API_ENDPOINTS.REVIEW.GET, params);
  return response;
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {object} updateData - Data to update
 * @param {string} [updateData.reviewText] - Review text
 * @param {number} [updateData.rating] - Rating (1-5)
 * @returns {Promise} Updated review data
 */
export const updateReview = async (reviewId, updateData) => {
  return put(API_ENDPOINTS.REVIEW.UPDATE(reviewId), updateData);
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteReview = async (reviewId) => {
  return del(API_ENDPOINTS.REVIEW.DELETE(reviewId));
};

/**
 * Get review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise} Review details
 */
export const getReviewById = async (reviewId) => {
  return get(API_ENDPOINTS.REVIEW.GET_BY_ID, { id: reviewId });
};

/**
 * Get average rating for a vehicle
 * @param {object} params - Query parameters
 * @param {string} params.vechileType - Vehicle type (Car/Bike/Auto)
 * @param {string} params.vechileId - Vehicle ID
 * @returns {Promise} Average rating data
 */
export const getAverageRating = async (params) => {
  return get(API_ENDPOINTS.REVIEW.GET_AVERAGE_RATING, params);
};

/**
 * Create a user rating
 * @param {object} ratingData - Rating data
 * @param {string} ratingData.userId - User ID
 * @param {string} ratingData.BookingId - Booking ID
 * @param {string} ratingData.review - Review text
 * @param {number} ratingData.rating - Rating (1-5)
 * @returns {Promise} Created rating data
 */
export const createUserRating = async (ratingData) => {
  return postUrlEncoded(API_ENDPOINTS.REVIEW.CREATE_USER_RATING, ratingData);
};

export default {
  addReview,
  getReviews,
  updateReview,
  deleteReview,
  getReviewById,
  getAverageRating,
  createUserRating,
};
