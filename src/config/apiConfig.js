import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Environment detection
const __DEV__ = process.env.NODE_ENV === 'development';

/**
 * Auth header for every request — reads the app-issued JWT saved at login.
 * Mirrors src/api/apiClient.js's getAuthHeaders(); this older client needs
 * its own copy since the two aren't otherwise connected.
 */
const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    return {};
  }
};

// Debug builds hit the local backend (port 5000) on the same machine running Metro.
// hostUri is "<dev-pc-ip>:8081" over Wi-Fi, or "localhost:8081" over USB with `adb reverse`.
const DEV_HOST = (Constants.expoConfig?.hostUri || 'localhost').split(':')[0];
// No trailing slash: endpoints already start with "/", and Express doesn't
// collapse "//auth/..." into "/auth/...".
const BASE_URL = __DEV__ ? `http://${DEV_HOST}:5000` : 'https://api.rentongovehicle.com';

// API Configuration
export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000, // 30 seconds - reasonable timeout for mobile
  RETRY_ATTEMPTS: 2, // Reduced retries to avoid hanging
  RETRY_DELAY: 500, // Faster retry
};

// API Endpoints
export const API_ENDPOINTS = {
  // ==================== AUTH ====================
  LOGIN: '/auth/login',
  REGISTER: '/register',
  LOGOUT: '/auth/logout',
  
  // ==================== USER ====================
  GET_ALL_USERS: '/getAllUsers',
  GET_USER_BY_ID: (userId) => `/getUserById/${userId}`,
  UPDATE_USER: (userId) => `/updateUser/${userId}`,
  DELETE_USER: (userId) => `/deleteUser/${userId}`,
  MY_BOOKINGS: (userId) => `/myBookings/${userId}`,
  MY_VEHICLES: (userId) => `/myVehicles/${userId}`,
  MY_VEHICLE_BOOKINGS: (userId) => `/myVehicleBookings/${userId}`,
  
  // ==================== CAR ====================
  CREATE_CAR: '/createCar',
  UPDATE_CAR: (carId) => `/updateCar/${carId}`,
  DELETE_CAR: (carId) => `/deleteCar/${carId}`,
  GET_NEARBY_CARS: '/getNearbyCars',
  GET_CAR_BY_ID: (carId) => `/getCarById/${carId}`,
  
  // ==================== BIKE ====================
  CREATE_BIKE: '/createBike',
  UPDATE_BIKE: (bikeId) => `/updateBike/${bikeId}`,
  DELETE_BIKE: (bikeId) => `/deleteBike/${bikeId}`,
  GET_NEARBY_BIKES: '/getNearbyBikes',
  GET_BIKE_BY_ID: (bikeId) => `/getBikeById/${bikeId}`,
  
  // ==================== AUTO ====================
  CREATE_AUTO: '/createAuto',
  UPDATE_AUTO: (autoId) => `/updateAuto/${autoId}`,
  DELETE_AUTO: (autoId) => `/deleteAuto/${autoId}`,
  GET_NEARBY_AUTOS: '/getNearbyAutos',
  GET_AUTO_BY_ID: (autoId) => `/getAutoby/${autoId}`,
  
  // ==================== BOOKINGS ====================
  CREATE_BOOKING: '/createBooking',
  UPDATE_BOOKING: (bookingId) => `/updateBooking/${bookingId}`,
  DELETE_BOOKING: '/deleteBooking',
  GET_BOOKING_BY_ID: (bookingId) => `/getBookingById/${bookingId}`,
  GET_ALL_BOOKINGS: '/getAllBookings',
  CONFIRM_BOOKING: (bookingId, action) => `/confirmBooking/${bookingId}/${action}`,
  GET_PENDING_BOOKINGS_OF_OWNER: (userId) => `/getPendingBookingsOfOwner/${userId}`,
  
  // ==================== REVIEWS ====================
  ADD_REVIEW: '/addReview',
  GET_REVIEW: '/getReviews',
  UPDATE_REVIEW: (reviewId) => `/updateReview/${reviewId}`,
  DELETE_REVIEW: (reviewId) => `/deleteReview/${reviewId}`,
  GET_REVIEW_BY_ID: '/getReviewById',
  GET_AVERAGE_RATING: '/getAverageRating',
  CREATE_USER_RATING: '/createUserRating',
  
  // ==================== NOT AVAILABILITY ====================
  CREATE_NOT_AVAILABILITY: '/createNotAvailability',
  UPDATE_NOT_AVAILABILITY: (id) => `/updateNotAvailability/${id}`,
  DELETE_NOT_AVAILABILITY: (id) => `/deleteNotAvailability/${id}`,
  GET_NOT_AVAILABILITY_BY_ID: (id) => `/getNotAvailabilityById/${id}`,
  GET_ALL_NOT_AVAILABILITY: '/getAllNotAvailability',
  GET_VEHICLE_AVAILABILITY: '/getVehicleAvailability',

  // ==================== CHAT ====================
  SEND_MESSAGE: '/sendMessage',
  GET_MESSAGES: (bookingId) => `/getMessages/${bookingId}`,
  GET_USER_CHATS: (userId) => `/getUserChats/${userId}`,

  // ==================== CALLING ====================
  START_CALL: '/start',
  ANSWER_CALL: '/save-answer',
  END_CALL: '/end',
  REJECT_CALL: '/rejectCall',
  GET_CALL_HISTORY: (userId) => `/history/${userId}`,
  GET_ACTIVE_CALL: (userId) => `/active/${userId}`,
  UPDATE_CALL_STATUS: '/update-status',

  // ==================== NOTIFICATIONS ====================
  GET_NOTIFICATIONS: (userId) => `/notifications/${userId}`,
  MARK_NOTIFICATION_READ: (id) => `/markNotificationRead/${id}`,
  MARK_ALL_NOTIFICATIONS_READ: (userId) => `/markAllNotificationsRead/${userId}`,
  DELETE_NOTIFICATION: (id) => `/deleteNotification/${id}`,
  CLEAR_ALL_NOTIFICATIONS: (userId) => `/clearAllNotifications/${userId}`,

  // ==================== SUPPORT ====================
  CREATE_TICKET: '/createTicket',
  GET_ALL_TICKETS: '/getAllTickets',
  GET_TICKETS_BY_USER: (userId) => `/getTicketsByUser/${userId}`,
  UPDATE_TICKET: (ticketId) => `/updateTicket/${ticketId}`,
  DELETE_TICKET: (ticketId) => `/deleteTicket/${ticketId}`,
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

// API Response Status
export const API_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
};

// Booking Status
export const BOOKING_STATUS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

// Vehicle Types
export const VEHICLE_TYPES = {
  CAR: 'Car',
  BIKE: 'Bike',
  AUTO: 'Auto',
};

/**
 * Helper function to build full URL with query parameters
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @returns {string} Full URL with query parameters
 */
export const buildUrl = (endpoint, params = {}) => {
  // If endpoint is a function, call it first
  const resolvedEndpoint = typeof endpoint === 'function' ? endpoint() : endpoint;
  
  let url = `${API_CONFIG.BASE_URL}${resolvedEndpoint}`;
  
  const queryParams = Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  if (queryParams) {
    url += `?${queryParams}`;
  }
  
  return url;
};

/**
 * Check if the endpoint requires authentication (contains userId)
 * @param {string} url - Full URL
 * @returns {boolean} True if endpoint requires auth
 */
const isAuthRequiredEndpoint = (url) => {
  // Endpoints that require user authentication
  const authPatterns = [
    '/myBookings/',
    '/myVehicles/',
    '/myVehicleBookings/',
    '/getUserById/',
    '/updateUser/',
    '/getMessages/',
    '/sendMessage/',
    '/getFcm/',
    '/saveFcm/',
  ];
  return authPatterns.some(pattern => url.includes(pattern));
};

/**
 * Reusable fetch function with error handling and retry logic
 * Uses XMLHttpRequest for better mobile timeout handling
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @param {object} options - Fetch options (method, headers, body)
 * @returns {Promise} API response data
 */
export const fetchData = async (endpoint, params = {}, options = {}) => {
  const url = buildUrl(endpoint, params);
  const timeout = options.timeout || API_CONFIG.TIMEOUT;

  // Skip API calls for auth-required endpoints if they contain invalid/empty userId
  if (isAuthRequiredEndpoint(url)) {
    // Check if URL contains empty, undefined, or null userId patterns
    if (url.includes('/undefined') || url.includes('/null') || url.match(/\/[a-f0-9]{24}$/) === null && url.match(/\/\w+\/[^/]+$/) === null) {
      return null;
    }
  }

  const defaultOptions = {
    method: HTTP_METHODS.GET,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    ...options,
  };

  // Applied after the ...options spread above so a caller-provided `headers`
  // object still gets the auth token merged in, not overwritten.
  defaultOptions.headers = { ...defaultOptions.headers, ...(await getAuthHeaders()) };

  let lastError = null;

  // Retry logic with exponential backoff
  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      if (__DEV__) {

        if (defaultOptions.body) {

        }

      }

      // Use XMLHttpRequest for better mobile timeout handling
      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Set timeout on the XHR object (better mobile support)
        xhr.timeout = timeout;

        xhr.ontimeout = () => {

          reject(new Error('AbortError'));
        };

        xhr.onerror = () => {
          reject(new Error('Network request failed. Please check your internet connection.'));
        };

        xhr.onload = () => {
          if (__DEV__) {

          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              if (__DEV__) {

              }
              resolve(responseData);
            } catch (parseError) {

              reject(new Error(`Failed to parse JSON response: ${parseError.message}`));
            }
          } else {
            // Check if this is expected 404 for getMessages or getMessagesByVehicle (no chat exists yet)
            const is404GetMessages = xhr.status === 404 && (
              url.includes('/getMessages/') ||
              url.includes('/getMessagesByVehicle/')
            );

            if (!is404GetMessages) {
              // Only log non-404 getMessages errors

            } else {
              // 404 for getMessages/getMessagesByVehicle is expected - just debug log
              if (__DEV__) {
              }
            }

            reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
          }
        };

        xhr.open(defaultOptions.method, url);

        // Set headers
        Object.keys(defaultOptions.headers).forEach(key => {
          xhr.setRequestHeader(key, defaultOptions.headers[key]);
        });

        // Send request
        xhr.send(defaultOptions.body || null);
      });

      return data;
      
    } catch (error) {
      lastError = error;

      if (error.message === 'AbortError' || error.message?.includes('timeout')) {

        throw new Error('Request timeout after 5 minutes. Backend is too slow.');
      }

      // Check if this is a 404 "Chat not found" error - this is expected for new chats
      const is404ChatNotFound = error.message?.includes('404') && (
        url.includes('/getMessages/') ||
        url.includes('/getMessagesByVehicle/')
      );

      if (__DEV__ && !is404ChatNotFound) {
        // Only log errors that are NOT expected 404s for chat
      }

      // Don't retry 404 chat errors - they're expected for new chats
      if (is404ChatNotFound) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt < API_CONFIG.RETRY_ATTEMPTS) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  // Provide helpful error message based on error type
  if (lastError?.message?.includes('Network request failed')) {
    throw new Error('Unable to connect to server. Please check your internet connection and try again.');
  } else if (lastError?.message?.includes('timeout')) {
    throw new Error('Request timed out. The server is taking too long to respond.');
  } else {
    throw lastError || new Error('Failed to fetch data. Please try again later.');
  }
};

/**
 * Helper for FormData requests (multipart/form-data)
 * Uses fetch API for React Native file uploads
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - FormData object
 * @param {object} options - Additional fetch options
 * @returns {Promise} API response data
 */
export const fetchFormData = async (endpoint, formData, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${typeof endpoint === 'function' ? endpoint() : endpoint}`;
  // Use longer timeout for file uploads (2 minutes)
  const timeout = options.timeout || 120000;

  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use fetch API - works better for file uploads on React Native
    const response = await fetch(url, {
      method: options.method || 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // DO NOT set Content-Type - fetch will set it automatically with boundary for FormData
        ...(await getAuthHeaders()),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const text = await response.text();

      try {
        const data = text ? JSON.parse(text) : { success: true };
        return data;
      } catch (parseError) {
        return { success: true, message: 'File uploaded' };
      }
    } else {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Upload timeout. Please try again.');
    }
    throw error;
  }
};

/**
 * Validate image URI
 * @param {string} uri - Image URI to validate
 * @returns {boolean} Whether URI is valid
 */
export const isValidImageUri = (uri) => {
  return uri && 
         typeof uri === 'string' && 
         uri.trim().length > 0 &&
         (uri.startsWith('http://') || uri.startsWith('https://'));
};

/**
 * Get safe image source
 * @param {array} images - Array of image URIs
 * @param {object} fallbackImage - Fallback require() image
 * @returns {object} Image source object
 */
export const getSafeImageSource = (images, fallbackImage) => {
  // Handle null, undefined, empty array
  if (!images || (Array.isArray(images) && images.length === 0)) {
    return fallbackImage;
  }

  // Get first image from array or use directly
  const imageUri = Array.isArray(images) ? images[0] : images;

  // Handle null, undefined, empty string, or string "null"/"undefined"
  if (!imageUri ||
      imageUri === '' ||
      imageUri === 'null' ||
      imageUri === 'undefined' ||
      imageUri === null ||
      imageUri === undefined) {
    return fallbackImage;
  }

  // Return fallback if not valid URL
  if (!isValidImageUri(imageUri)) {
    return fallbackImage;
  }

  return { uri: imageUri };
};