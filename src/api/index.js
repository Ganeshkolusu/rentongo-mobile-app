/**
 * API Module - Main Entry Point
 * Central export for all API services and utilities
 */

// API Client (CRUD utilities)
export * from './apiClient';
export { default as apiClient } from './apiClient';

// Endpoints Configuration
export { API_ENDPOINTS, LEGACY_API_ENDPOINTS } from './endpoints';

// Services
export * as availabilityService from './services/availabilityService';
export * as bikeService from './services/bikeService';
export * as bookingService from './services/bookingService';
export * as carService from './services/carService';
export * as reviewService from './services/reviewService';
export * as userService from './services/userService';
export * as subscriptionService from './services/subscriptionService';

// New API Modules
export * as autoApi from './autoApi';
export * as bookingApi from './bookingApi';
export * as callingApi from './callingApi';
export * as chatApi from './chatApi';
export * as filterApi from './filterApi';
export * as notAvailabilityApi from './notAvailabilityApi';
export * as reviewApi from './reviewApi';
export * as supportApi from './supportApi';
export * as userApi from './userApi';
export * as vehicleApi from './vehicleApi';

// Default export with all services
import availabilityService from './services/availabilityService';
import bikeService from './services/bikeService';
import bookingService from './services/bookingService';
import carService from './services/carService';
import reviewService from './services/reviewService';
import userService from './services/userService';
import subscriptionService from './services/subscriptionService';

export default {
  user: userService,
  car: carService,
  bike: bikeService,
  booking: bookingService,
  review: reviewService,
  availability: availabilityService,
  subscription: subscriptionService,
};
