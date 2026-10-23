import { 
  API_ENDPOINTS, 
  fetchData, 
  HTTP_METHODS,
  buildUrl 
} from '../config/apiConfig';
import { checkVehicleAvailability } from './notAvailabilityApi';

/**
 * Get nearby cars with availability filter
 * @param {object} params - Query parameters
 * @returns {Promise<object>} API response with filtered cars
 */
export const getNearbyCars = async (params) => {
  try {
    const {
      latitude,
      longitude,
      range,
      priceMin,
      priceMax,
      carName,
      fuelType,
      transmissionType,
      fromDate,
      toDate,
      fromTime,
      toTime,
    } = params;

    // Build query params
    const queryParams = {
      latitude,
      longitude,
    };

    if (range) queryParams.range = range;
    if (priceMin) queryParams.priceMin = priceMin;
    if (priceMax) queryParams.priceMax = priceMax;
    if (carName) queryParams.carName = carName;
    if (fuelType) queryParams.fuelType = fuelType;
    if (transmissionType) queryParams.transmissionType = transmissionType;

    // Fetch all nearby cars
    const response = await fetchData(
      API_ENDPOINTS.GET_NEARBY_CARS,
      queryParams,
      { method: HTTP_METHODS.GET }
    );

    let cars = response?.data || response || [];

    // Filter by availability if dates provided
    if (fromDate && toDate && Array.isArray(cars)) {
      const availableCars = await filterAvailableVehicles(
        cars,
        'Car',
        fromDate,
        toDate
      );
      cars = availableCars;
    }

    return {
      success: true,
      data: cars,
      count: cars.length,
    };
  } catch (error) {

    return {
      success: false,
      message: error.message || 'Failed to fetch nearby cars',
      data: [],
    };
  }
};

/**
 * Get nearby bikes with availability filter
 * @param {object} params - Query parameters
 * @returns {Promise<object>} API response with filtered bikes
 */
export const getNearbyBikes = async (params) => {
  try {
    const {
      latitude,
      longitude,
      range,
      bikeModel,
      bikeName,
      priceMin,
      priceMax,
      fromDate,
      toDate,
      fromTime,
      toTime,
    } = params;

    const queryParams = {
      latitude,
      longitude,
    };

    if (range) queryParams.range = range;
    if (bikeModel) queryParams.bikeModel = bikeModel;
    if (bikeName) queryParams.bikeName = bikeName;
    if (priceMin) queryParams.priceMin = priceMin;
    if (priceMax) queryParams.priceMax = priceMax;

    const response = await fetchData(
      API_ENDPOINTS.GET_NEARBY_BIKES,
      queryParams,
      { method: HTTP_METHODS.GET }
    );

    let bikes = response?.data || response || [];

    // Filter by availability if dates provided
    if (fromDate && toDate && Array.isArray(bikes)) {
      const availableBikes = await filterAvailableVehicles(
        bikes,
        'Bike',
        fromDate,
        toDate
      );
      bikes = availableBikes;
    }

    return {
      success: true,
      data: bikes,
      count: bikes.length,
    };
  } catch (error) {

    return {
      success: false,
      message: error.message || 'Failed to fetch nearby bikes',
      data: [],
    };
  }
};

/**
 * Get nearby autos with availability filter
 * @param {object} params - Query parameters
 * @returns {Promise<object>} API response with filtered autos
 */
export const getNearbyAutos = async (params) => {
  try {
    const {
      latitude,
      longitude,
      range,
      fromDate,
      toDate,
    } = params;

    const queryParams = {
      latitude,
      longitude,
    };

    if (range) queryParams.range = range;

    const response = await fetchData(
      API_ENDPOINTS.GET_NEARBY_AUTOS,
      queryParams,
      { method: HTTP_METHODS.GET }
    );

    let autos = response?.data || response || [];

    // Filter by availability if dates provided
    if (fromDate && toDate && Array.isArray(autos)) {
      const availableAutos = await filterAvailableVehicles(
        autos,
        'Auto',
        fromDate,
        toDate
      );
      autos = availableAutos;
    }

    return {
      success: true,
      data: autos,
      count: autos.length,
    };
  } catch (error) {

    return {
      success: false,
      message: error.message || 'Failed to fetch nearby autos',
      data: [],
    };
  }
};

/**
 * Filter out unavailable vehicles from results
 * @param {array} vehicles - Array of vehicles
 * @param {string} vehicleType - Type of vehicle (Car, Bike, Auto)
 * @param {string} fromDate - Start date (YYYY-MM-DD)
 * @param {string} toDate - End date (YYYY-MM-DD)
 * @returns {Promise<array>} Filtered available vehicles
 */
const filterAvailableVehicles = async (vehicles, vehicleType, fromDate, toDate) => {
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return vehicles;
  }

  try {
    // Check availability for all vehicles in parallel
    const availabilityChecks = vehicles.map(async (vehicle) => {
      try {
        const vehicleId = vehicle._id || vehicle.id;
        
        // Skip if vehicle is marked as not available
        if (vehicle.Available === false) {
          return {
            vehicle,
            isAvailable: false,
          };
        }

        const result = await checkVehicleAvailability(
          vehicleId,
          vehicleType,
          fromDate,
          toDate
        );
        
        return {
          vehicle,
          isAvailable: result.isAvailable,
        };
      } catch (error) {

        // On error, check the Available field
        return {
          vehicle,
          isAvailable: vehicle.Available !== false,
        };
      }
    });

    const results = await Promise.all(availabilityChecks);
    
    // Filter out unavailable vehicles
    const availableVehicles = results
      .filter(result => result.isAvailable)
      .map(result => result.vehicle);
    

    return availableVehicles;
  } catch (error) {

    return vehicles; // Return original list on error
  }
};

/**
 * Get vehicle by ID with availability check
 * @param {string} vehicleId - Vehicle ID
 * @param {string} vehicleType - Vehicle type (Car, Bike, Auto)
 * @param {string} fromDate - Optional: Start date for availability check
 * @param {string} toDate - Optional: End date for availability check
 * @returns {Promise<object>} Vehicle details with availability status
 */
export const getVehicleById = async (vehicleId, vehicleType, fromDate, toDate) => {
  try {
    let endpoint;
    switch (vehicleType) {
      case 'Car':
        endpoint = API_ENDPOINTS.GET_CAR_BY_ID(vehicleId);
        break;
      case 'Bike':
        endpoint = API_ENDPOINTS.GET_BIKE_BY_ID(vehicleId);
        break;
      case 'Auto':
        endpoint = API_ENDPOINTS.GET_AUTO_BY_ID(vehicleId);
        break;
      default:
        throw new Error('Invalid vehicle type');
    }

    const response = await fetchData(endpoint, {}, { method: HTTP_METHODS.GET });
    
    let vehicle = response?.data || response;

    // Check availability if dates provided
    if (fromDate && toDate && vehicle) {
      const availabilityResult = await checkVehicleAvailability(
        vehicleId,
        vehicleType,
        fromDate,
        toDate
      );
      
      vehicle.isAvailable = availabilityResult.isAvailable;
      vehicle.blockedSlots = availabilityResult.blockedSlots;
    }

    return {
      success: true,
      data: vehicle,
    };
  } catch (error) {

    return {
      success: false,
      message: error.message || 'Failed to fetch vehicle details',
    };
  }
};