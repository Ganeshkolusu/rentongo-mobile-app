import * as ExpoLocation from 'expo-location';
import SocketService from './SocketService';

/**
 * Live Location Tracking Service
 * Streams the owner's device GPS position to the backend/socket room
 * for a confirmed booking, so the customer can watch them approach
 * (Swiggy/Zomato-style live tracking).
 */
class LocationTrackingService {
  constructor() {
    this.subscription = null;
    this.bookingId = null;
  }

  isSharing() {
    return this.subscription !== null;
  }

  /**
   * Start streaming this device's location for a booking.
   * @param {string} bookingId
   * @param {string} userId
   * @param {'renterApp'|'driverApp'} source
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  async startSharing(bookingId, userId, source = 'renterApp') {
    if (this.subscription) {
      await this.stopSharing();
    }

    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Location permission was not granted' };
    }

    SocketService.joinBookingTracking(bookingId);
    this.bookingId = bookingId;

    this.subscription = await ExpoLocation.watchPositionAsync(
      {
        accuracy: ExpoLocation.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (position) => {
        SocketService.emitLocationUpdate({
          bookingId,
          userId,
          source,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      }
    );

    return { success: true };
  }

  async stopSharing() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
    this.bookingId = null;
  }
}

export default new LocationTrackingService();
