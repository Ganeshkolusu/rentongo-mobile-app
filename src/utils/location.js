import * as ExpoLocation from 'expo-location';
import { Platform, PermissionsAndroid } from 'react-native';

/**
 * Location Utility
 * Handles location fetching and reverse geocoding
 */

/**
 * Get current location coordinates
 */
export const getCurrentLocation = async () => {
  try {
    // Add timeout to prevent hanging
    const locationPromise = ExpoLocation.getCurrentPositionAsync({
      accuracy: ExpoLocation.Accuracy.Balanced,
      maximumAge: 10000,
    });

    // Timeout after 10 seconds
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Location timeout')), 10000)
    );

    const location = await Promise.race([locationPromise, timeoutPromise]);

    if (!location || !location.coords) {
      return null;
    }

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    // Return null instead of throwing to prevent crashes
    return null;
  }
};

/**
 * Reverse geocode coordinates to address
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const addresses = await ExpoLocation.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];

      // Format the address object
      const formattedAddress = {
        name: address.name || address.street || address.city || 'Current Location',
        street: address.street,
        area: address.subregion || address.district,
        city: address.city,
        state: address.region,
        country: address.country,
        pincode: address.postalCode,
        latitude,
        longitude,
        fullAddress: [
          address.street,
          address.city,
          address.region,
          address.country,
          address.postalCode,
        ]
          .filter(Boolean)
          .join(', '),
      };

      return formattedAddress;
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Get current location with address
 */
export const getCurrentLocationWithAddress = async () => {
  try {
    // First check if we have permission
    const { status } = await ExpoLocation.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      return null;
    }

    // Get coordinates
    const coords = await getCurrentLocation();

    if (!coords) {
      return null;
    }

    // Get address from coordinates
    const address = await reverseGeocode(coords.latitude, coords.longitude);

    return address;
  } catch (error) {
    return null;
  }
};

/**
 * Check if location permission is granted
 */
export const checkLocationPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const fineLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      const coarseLocation = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
      );
      return fineLocation || coarseLocation;
    } else {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      return status === 'granted';
    }
  } catch (error) {

    return false;
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Returns distance in km
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};
