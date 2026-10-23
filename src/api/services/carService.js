/**
 * Car API Service
 * All car-related API calls
 */

import { get, postFormData, putFormData, del } from '../apiClient';
import { API_ENDPOINTS } from '../endpoints';

/**
 * Create a new car listing
 * @param {FormData} carData - Car data as FormData
 * @param {string} carData.userId - User ID
 * @param {string} carData.CarName - Car name
 * @param {string} carData.CarModel - Car model
 * @param {string} carData.fuelType - Fuel type (petrol/diesel/electric)
 * @param {string} carData.transmissionType - Transmission type (auto/manual)
 * @param {string} carData.kmDriven - Kilometers driven
 * @param {boolean} carData.Ac_available - AC availability
 * @param {string} carData.description - Description
 * @param {string} carData.RentPerHour - Rent per hour
 * @param {string} carData.RentPerDay - Rent per day
 * @param {string} carData.contactNumber - Contact number
 * @param {string} carData.contactName - Contact name
 * @param {boolean} carData.drivingLicenseRequired - Driving license required
 * @param {boolean} carData.AadharCardRequired - Aadhar card required
 * @param {string} carData.DepositAmount - Deposit amount
 * @param {boolean} carData.DepositVehicle - Deposit vehicle required
 * @param {string} carData.pickupLatitude - Pickup latitude
 * @param {string} carData.pickupLongitude - Pickup longitude
 * @param {string} carData.pickupCity - Pickup city
 * @param {string} carData.pickupCityPinCode - Pickup city pin code
 * @param {string} carData.pickupCityState - Pickup city state
 * @param {string} carData.pickupCityCountry - Pickup city country
 * @param {string} carData.CarNumber - Car registration number
 * @param {string} carData.Carseater - Car seating capacity
 * @param {boolean} carData.gps - GPS availability
 * @param {File[]} carData.carImages - Car images (multiple files)
 * @returns {Promise} Created car data
 */
export const createCar = async (carData) => {
  return postFormData(API_ENDPOINTS.CAR.CREATE, carData);
};

/**
 * Update an existing car listing
 * @param {string} carId - Car ID
 * @param {FormData} carData - Car data to update as FormData
 * @returns {Promise} Updated car data
 */
export const updateCar = async (carId, carData) => {
  return putFormData(API_ENDPOINTS.CAR.UPDATE(carId), carData);
};

/**
 * Delete a car listing
 * @param {string} carId - Car ID
 * @returns {Promise} Deletion confirmation
 */
export const deleteCar = async (carId) => {
  return del(API_ENDPOINTS.CAR.DELETE(carId));
};

/**
 * Get nearby cars based on location and filters
 * @param {object} params - Query parameters
 * @param {number} params.latitude - Current latitude
 * @param {number} params.longitude - Current longitude
 * @param {number} [params.range] - Search range in kilometers
 * @param {number} [params.priceMin] - Minimum price
 * @param {number} [params.priceMax] - Maximum price
 * @param {string} [params.carName] - Car name filter
 * @param {string} [params.fuelType] - Fuel type filter
 * @param {string} [params.transmissionType] - Transmission type filter
 * @param {string} [params.fromDate] - From date (YYYY-MM-DD)
 * @param {string} [params.toDate] - To date (YYYY-MM-DD)
 * @param {string} [params.fromTime] - From time (HH:MM)
 * @param {string} [params.toTime] - To time (HH:MM)
 * @returns {Promise} Array of nearby cars
 */
export const getNearbyCars = async (params) => {
  return get(API_ENDPOINTS.CAR.GET_NEARBY, params);
};

/**
 * Get car details by ID
 * @param {string} carId - Car ID
 * @returns {Promise} Car details
 */
export const getCarById = async (carId) => {
  return get(API_ENDPOINTS.CAR.GET_BY_ID(carId));
};

export default {
  createCar,
  updateCar,
  deleteCar,
  getNearbyCars,
  getCarById,
};
