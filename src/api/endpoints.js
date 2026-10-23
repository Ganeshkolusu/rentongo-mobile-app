/**
 * API Endpoints Configuration
 * All API endpoint URLs organized by resource
 */

export const API_ENDPOINTS = {
  // ==================== AUTH ====================
  AUTH: {
    REQUEST_OTP: '/auth/request-otp',
    VERIFY_OTP: '/auth/verify-otp',
  },

  // ==================== SUBSCRIPTION ====================
  SUBSCRIPTION: {
    GET_MY_STATUS: '/subscriptions/me',
    CREATE_ORDER: '/subscriptions/create-order',
  },

  // ==================== USER ====================
  USER: {
    GET_ALL: '/getAllUsers',
    GET_BY_ID: (userId) => `/getUserById/${userId}`,
    UPDATE: (userId) => `/updateUser/${userId}`,
    UPLOAD_PROFILE_IMAGE: (userId) => `/uploadProfileImage/${userId}`,
    DELETE: (userId) => `/deleteUser/${userId}`,
    MY_BOOKINGS: (userId) => `/myBookings/${userId}`,
    MY_VEHICLES: (userId) => `/myVehicles/${userId}`,
    MY_VEHICLE_BOOKINGS: (userId) => `/myVehicleBookings/${userId}`,
  },

  // ==================== CAR ====================
  CAR: {
    CREATE: '/createCar',
    UPDATE: (carId) => `/updateCar/${carId}`,
    DELETE: (carId) => `/deleteCar/${carId}`,
    GET_NEARBY: '/getNearbyCars',
    GET_BY_ID: (carId) => `/getCarById/${carId}`,
  },

  // ==================== BIKE ====================
  BIKE: {
    CREATE: '/createBike',
    UPDATE: (bikeId) => `/updateBike/${bikeId}`,
    DELETE: (bikeId) => `/deleteBike/${bikeId}`,
    GET_NEARBY: '/getNearbyBikes',
    GET_BY_ID: (bikeId) => `/getBikeById/${bikeId}`,
  },

  // ==================== AUTO ====================
  AUTO: {
    CREATE: '/createAuto',
    UPDATE: (autoId) => `/updateAuto/${autoId}`,
    DELETE: (autoId) => `/deleteAuto/${autoId}`,
    GET_NEARBY: '/getNearbyAutos',
    GET_BY_ID: (autoId) => `/getAutoby/${autoId}`,
  },

  // ==================== BOOKINGS ====================
  BOOKING: {
    CREATE: '/createBooking',
    UPDATE: (bookingId) => `/updateBooking/${bookingId}`,
    DELETE: '/deleteBooking',
    GET_BY_ID: (bookingId) => `/getBookingById/${bookingId}`,
    GET_ALL: '/getAllBookings',
    CONFIRM: (bookingId, action) => `/confirmBooking/${bookingId}/${action}`,
  },

  // ==================== REVIEWS ====================
  REVIEW: {
    ADD: '/addReview',
    GET: '/getReviews',
    UPDATE: (reviewId) => `/updateReview/${reviewId}`,
    DELETE: (reviewId) => `/deleteReview/${reviewId}`,
    GET_BY_ID: '/getReviewById',
    GET_AVERAGE_RATING: '/getAverageRating',
    CREATE_USER_RATING: '/createUserRating',
  },

  // ==================== AVAILABILITY ====================
  AVAILABILITY: {
    CREATE_NOT_AVAILABLE: '/createNotAvailability',
    UPDATE_NOT_AVAILABLE: (id) => `/updateNotAvailability/${id}`,
    DELETE_NOT_AVAILABLE: (id) => `/deleteNotAvailability/${id}`,
    GET_NOT_AVAILABLE_BY_ID: (id) => `/getNotAvailabilityById/${id}`,
    GET_VEHICLE_AVAILABILITY: '/getVehicleAvailability',
  },
};

// Export legacy flat structure for backward compatibility
export const LEGACY_API_ENDPOINTS = {
  // Auth
  REQUEST_OTP: API_ENDPOINTS.AUTH.REQUEST_OTP,
  VERIFY_OTP: API_ENDPOINTS.AUTH.VERIFY_OTP,

  // User
  GET_ALL_USERS: API_ENDPOINTS.USER.GET_ALL,
  GET_USER_BY_ID: API_ENDPOINTS.USER.GET_BY_ID,
  UPDATE_USER: API_ENDPOINTS.USER.UPDATE,
  DELETE_USER: API_ENDPOINTS.USER.DELETE,
  MY_BOOKINGS: API_ENDPOINTS.USER.MY_BOOKINGS,
  MY_VEHICLES: API_ENDPOINTS.USER.MY_VEHICLES,
  MY_VEHICLE_BOOKINGS: API_ENDPOINTS.USER.MY_VEHICLE_BOOKINGS,

  // Car
  CREATE_CAR: API_ENDPOINTS.CAR.CREATE,
  UPDATE_CAR: API_ENDPOINTS.CAR.UPDATE,
  DELETE_CAR: API_ENDPOINTS.CAR.DELETE,
  GET_NEARBY_CARS: API_ENDPOINTS.CAR.GET_NEARBY,
  GET_CAR_BY_ID: API_ENDPOINTS.CAR.GET_BY_ID,

  // Bike
  CREATE_BIKE: API_ENDPOINTS.BIKE.CREATE,
  UPDATE_BIKE: API_ENDPOINTS.BIKE.UPDATE,
  DELETE_BIKE: API_ENDPOINTS.BIKE.DELETE,
  GET_NEARBY_BIKES: API_ENDPOINTS.BIKE.GET_NEARBY,
  GET_BIKE_BY_ID: API_ENDPOINTS.BIKE.GET_BY_ID,

  // Auto
  CREATE_AUTO: API_ENDPOINTS.AUTO.CREATE,
  UPDATE_AUTO: API_ENDPOINTS.AUTO.UPDATE,
  DELETE_AUTO: API_ENDPOINTS.AUTO.DELETE,
  GET_NEARBY_AUTOS: API_ENDPOINTS.AUTO.GET_NEARBY,
  GET_AUTO_BY_ID: API_ENDPOINTS.AUTO.GET_BY_ID,

  // Bookings
  CREATE_BOOKING: API_ENDPOINTS.BOOKING.CREATE,
  UPDATE_BOOKING: API_ENDPOINTS.BOOKING.UPDATE,
  DELETE_BOOKING: API_ENDPOINTS.BOOKING.DELETE,
  GET_BOOKING_BY_ID: API_ENDPOINTS.BOOKING.GET_BY_ID,
  GET_ALL_BOOKINGS: API_ENDPOINTS.BOOKING.GET_ALL,
  CONFIRM_BOOKING: API_ENDPOINTS.BOOKING.CONFIRM,

  // Reviews
  ADD_REVIEW: API_ENDPOINTS.REVIEW.ADD,
  GET_REVIEW: API_ENDPOINTS.REVIEW.GET,
  UPDATE_REVIEW: API_ENDPOINTS.REVIEW.UPDATE,
  DELETE_REVIEW: API_ENDPOINTS.REVIEW.DELETE,
  GET_REVIEW_BY_ID: API_ENDPOINTS.REVIEW.GET_BY_ID,
  GET_AVERAGE_RATING: API_ENDPOINTS.REVIEW.GET_AVERAGE_RATING,
  CREATE_USER_RATING: API_ENDPOINTS.REVIEW.CREATE_USER_RATING,

  // Availability
  CREATE_NOT_AVAILABILITY: API_ENDPOINTS.AVAILABILITY.CREATE_NOT_AVAILABLE,
  UPDATE_NOT_AVAILABILITY: API_ENDPOINTS.AVAILABILITY.UPDATE_NOT_AVAILABLE,
  DELETE_NOT_AVAILABILITY: API_ENDPOINTS.AVAILABILITY.DELETE_NOT_AVAILABLE,
  GET_NOT_AVAILABILITY_BY_ID: API_ENDPOINTS.AVAILABILITY.GET_NOT_AVAILABLE_BY_ID,
  GET_VEHICLE_AVAILABILITY: API_ENDPOINTS.AVAILABILITY.GET_VEHICLE_AVAILABILITY,
};
