import { Platform, PermissionsAndroid, Alert } from 'react-native';
import * as ExpoLocation from 'expo-location';
import * as ExpoMediaLibrary from 'expo-image-picker';
import * as ExpoCamera from 'expo-image-picker';
import { getCurrentLocationWithAddress } from './location';

/**
 * Permissions Utility
 * Handles runtime permission requests for Android and iOS
 */

/**
 * Request Location Permission
 * @param {Function} onLocationReceived - Optional callback function that receives the location address when permission is granted
 */
export const requestLocationPermission = async (onLocationReceived = null) => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);

      const fineLocationGranted = granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseLocationGranted = granted['android.permission.ACCESS_COARSE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED;

      if (fineLocationGranted || coarseLocationGranted) {

        // Fetch current location if callback is provided
        if (onLocationReceived) {
          try {
            const locationAddress = await getCurrentLocationWithAddress();
            if (locationAddress) {
              onLocationReceived(locationAddress);
            }
          } catch (locationError) {
            // Silently fail location fetch - permission was granted successfully
          }
        }

        return true;
      } else {

        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby vehicles and provide better service.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } else {
      // iOS - use Expo Location
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status === 'granted') {

        // Fetch current location if callback is provided
        if (onLocationReceived) {
          try {
            // Add a small delay to ensure permission dialog is fully dismissed
            await new Promise(resolve => setTimeout(resolve, 500));
            const locationAddress = await getCurrentLocationWithAddress();
            if (locationAddress) {
              onLocationReceived(locationAddress);
            }
          } catch (locationError) {
            // Silently fail location fetch - permission was granted successfully
          }
        }

        return true;
      } else {

        Alert.alert(
          'Location Permission Required',
          'This app needs location access to show nearby vehicles.',
          [{ text: 'OK' }]
        );
        return false;
      }
    }
  } catch (error) {

    return false;
  }
};

/**
 * Request Camera Permission
 */
export const requestCameraPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs camera access to take photos of your vehicle.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        return true;
      } else {

        return false;
      }
    } else {
      // iOS - use Expo Camera
      const { status } = await ExpoCamera.requestCameraPermissionsAsync();
      if (status === 'granted') {

        return true;
      } else {

        return false;
      }
    }
  } catch (error) {

    return false;
  }
};

/**
 * Request Media Library Permission
 * Note: On Android 13+ (API 33+), Photo Picker is used which doesn't require permissions
 */
export const requestMediaLibraryPermission = async () => {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ uses Photo Picker which doesn't require permissions
      if (Platform.Version >= 33) {
        return true;
      } else {
        // Android 12 and below
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Media Library Permission',
            message: 'This app needs access to your photos to upload vehicle images.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {

          return true;
        } else {

          return false;
        }
      }
    } else {
      // iOS - use Expo Media Library
      const { status } = await ExpoMediaLibrary.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {

        return true;
      } else {

        return false;
      }
    }
  } catch (error) {

    return false;
  }
};

/**
 * Request Microphone Permission
 */
export const requestMicrophonePermission = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs microphone access for voice calls.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        return true;
      } else {

        return false;
      }
    } else {
      // iOS handles audio permissions automatically when using audio features
      return true;
    }
  } catch (error) {

    return false;
  }
};

/**
 * Request Notification Permission (Android 13+)
 */
export const requestNotificationPermission = async () => {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs notification access to alert you about bookings and messages.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {

        return true;
      } else {

        return false;
      }
    } else {
      // iOS or Android < 13 - notifications enabled by default
      return true;
    }
  } catch (error) {

    return false;
  }
};

/**
 * Request All Permissions at Once
 * @param {Function} onLocationReceived - Optional callback function that receives the location address when location permission is granted
 */
export const requestAllPermissions = async (onLocationReceived = null) => {
  try {

    const results = {
      location: await requestLocationPermission(onLocationReceived),
      camera: await requestCameraPermission(),
      mediaLibrary: await requestMediaLibraryPermission(),
      microphone: await requestMicrophonePermission(),
      notifications: await requestNotificationPermission(),
    };

    const allGranted = Object.values(results).every(granted => granted);

    if (allGranted) {

    } else {

    }

    return results;
  } catch (error) {

    return {
      location: false,
      camera: false,
      mediaLibrary: false,
      microphone: false,
    };
  }
};

/**
 * Check if permission is granted
 */
export const checkPermission = async (permission) => {
  try {
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.check(permission);
      return result;
    }
    return true; // iOS handles permissions differently
  } catch (error) {

    return false;
  }
};
