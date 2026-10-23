import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS, HTTP_METHODS } from '../config/apiConfig';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Fetch and filter vehicles (Cars or Bikes) with STRICT matching
 * @param {Object} filters - Filter data from FilterScreen
 * @param {String} type - "car" or "bike"
 * @param {Object} location - Optional { latitude, longitude }
 * @returns {Promise<Object>} Filtered vehicles
 */
export const filterVehicles = async (filters = {}, type = 'car', location = null) => {
  try {

    // Use provided location or default to Hyderabad (same as NearbyCarsScreen)
    const { latitude, longitude } = location || {
      latitude: 17.4417,
      longitude: 78.4416,
    };

    // Use the correct nearby endpoints
    const relativeEndpoint = type === 'bike'
      ? API_ENDPOINTS.GET_NEARBY_BIKES
      : API_ENDPOINTS.GET_NEARBY_CARS;

    // Ensure we have the full URL
    const baseEndpoint = relativeEndpoint.startsWith('http')
      ? relativeEndpoint
      : `${API_CONFIG.BASE_URL}${relativeEndpoint}`;

    // Construct URL with query parameters
    const endpoint = `${baseEndpoint}?latitude=${latitude}&longitude=${longitude}`;

    // Auth token lets the backend leave the user's own vehicles out of the results.
    const token = await AsyncStorage.getItem('authToken');
    const response = await fetch(endpoint, {
      method: HTTP_METHODS.GET,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }
    });


    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to fetch vehicles');
    }

    // Handle different response structures
    const vehicles = data.data || data.cars || data.bikes || [];

    // Maximum distance to consider (same as NearbyCarsScreen)
    const MAX_DISTANCE_KM = filters.distance || 50;

    // STEP 1: First filter by distance and status (same as NearbyCarsScreen)
    const nearbyVehicles = vehicles.filter(item => {
      // Check status - only include verified/approved vehicles
      const status = (item.status || item.Status || '').toLowerCase().trim();
      if (status && status !== 'verified' && status !== 'approved') {
        return false;
      }

      // Get vehicle coordinates
      const vehicleLat = parseFloat(item.pickupLatitude || item.latitude);
      const vehicleLon = parseFloat(item.pickupLongitude || item.longitude);

      if (!vehicleLat || !vehicleLon || isNaN(vehicleLat) || isNaN(vehicleLon)) {
        return false;
      }

      // Calculate distance from user
      const distance = calculateDistance(latitude, longitude, vehicleLat, vehicleLon);

      // Store distance on the item for later use
      item._calculatedDistance = distance;

      return distance <= MAX_DISTANCE_KM;
    });

    // --- Apply additional filters client-side ---
    // Check if any additional filters are applied (beyond distance)

    // Select appropriate filters based on type
    const activeFilters = type === 'bike' ? filters.bikeFilters : filters.carFilters;

    const hasAdditionalFilters =
      (filters.priceRange && filters.priceRange < 10000) ||
      (activeFilters && Object.values(activeFilters).some(val => val && val.length > 0));

    if (!hasAdditionalFilters) {
      return { success: true, data: nearbyVehicles };
    }

    const filtered = nearbyVehicles.filter((item) => {
      // PRIORITY 1: Name filter - FLEXIBLE matching
      const carName = (item.CarName || '').toLowerCase().trim();
      const carModel = (item.CarModel || '').toLowerCase().trim();
      const carFullName = `${carName} ${carModel}`.trim();
      const bikeName = (item.bikeName || item.name || '').toLowerCase().trim();

      // Use the name from the item appropriate for the type
      const vehicleName = type === 'bike' ? bikeName : carFullName;

      // Get the filter name from the active filters
      const filterName = (type === 'bike' ? activeFilters?.bikeName : activeFilters?.carName || '').toLowerCase().trim();

      if (filterName) {
        // Try multiple matching strategies
        const nameMatch =
          (vehicleName && vehicleName === filterName) || // Exact match
          (vehicleName && vehicleName.includes(filterName)) || // Partial match
          (vehicleName && filterName.includes(vehicleName)) || // Reverse partial match (e.g. DB="Classic 350", Filter="Royal Enfield Classic 350")
          (type === 'car' && carName && filterName.includes(carName)) || // Filter includes car name
          (type === 'car' && carModel && filterName.includes(carModel)) || // Filter includes car model
          (type === 'car' && carName && filterName.startsWith(carName)); // Filter starts with car name

        if (!nameMatch) {
          return false;
        }
      }

      // PRIORITY 2: Fuel filter
      const fuelType = (item.fuelType || item.fuel || '').toLowerCase().trim();
      const filterFuel = (activeFilters?.fuel || '').toLowerCase().trim();
      if (filterFuel) {
        const fuelMatch = fuelType.includes(filterFuel) || filterFuel.includes(fuelType);
        if (!fuelMatch) {
          return false;
        }
      }

      // PRIORITY 3: Transmission filter (Cars only)
      if (type === 'car') {
        const transmission = (item.transmissionType || item.transmission || '').toLowerCase().trim();
        const filterTransmission = (activeFilters?.transmission || '').toLowerCase().trim();
        if (filterTransmission) {
          const transmissionMatch = transmission.includes(filterTransmission) || filterTransmission.includes(transmission);
          if (!transmissionMatch) {
            return false;
          }
        }
      }

      // PRIORITY 4: Price filter
      const price = parseFloat(item.RentPerDay || item.RentPerHour || item.pricePerKm || item.price || 0);
      const filterPrice = parseFloat(filters.priceRange || 10000);

      if (filters.priceRange && filters.priceRange < 10000) {
        const priceMatch = price <= filterPrice;
        if (!priceMatch) {
          return false;
        }
      }

      // ALL filters passed
      return true;
    });

    return { success: true, data: filtered };
  } catch (error) {
    return { success: false, message: error.message };
  }
};