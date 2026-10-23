import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import SoundService from './SoundService';

/**
 * Notification Service - React Native Only (No Expo)
 * Handles all push notification operations using Firebase Cloud Messaging and Notifee
 *
 * Sound Management:
 * - Booking notifications for owner: Plays booking_notification.mp3 via SoundService
 * - Other notifications: Use default system sound
 */

class NotificationService {
  constructor() {
    this.fcmToken = null;
    this.unsubscribeOnMessage = null;
    this.unsubscribeOnNotificationOpen = null;
    this.navigationRef = null;
    this.pendingNotification = null;
    this.lastProcessedNotificationId = null;
    this.isProcessingNotification = false;
    this.isWaitingForResponse = false;
    this.currentUserId = null;
    // Track displayed notifications to prevent duplicates
    this.displayedNotificationIds = new Set();
    this.lastNavigatedScreen = null;
    this.lastNavigationTime = 0;
    // Callback for when booking is confirmed - used to close waiting popup
    this.onBookingConfirmedCallback = null;
  }

  setCurrentUserId(userId) {
    this.currentUserId = userId;
  }

  setWaitingForResponse(waiting) {
    this.isWaitingForResponse = waiting;
  }

  // Register callback to be called when booking is confirmed (to close waiting popup)
  setOnBookingConfirmedCallback(callback) {
    this.onBookingConfirmedCallback = callback;
  }

  // Clear the callback when no longer needed
  clearOnBookingConfirmedCallback() {
    this.onBookingConfirmedCallback = null;
  }

  // Helper to prevent duplicate navigation to same screen within short time
  canNavigateTo(screenName, bookingId) {
    const now = Date.now();
    const key = `${screenName}_${bookingId || ''}`;

    // Prevent navigation to same screen within 3 seconds
    if (this.lastNavigatedScreen === key && (now - this.lastNavigationTime) < 3000) {
      return false;
    }

    this.lastNavigatedScreen = key;
    this.lastNavigationTime = now;
    return true;
  }

  async initialize(navigationRef) {
    try {
      this.navigationRef = navigationRef;
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }
      const token = await this.getFCMToken();
      await this.createNotificationChannels();
      this.setupNotificationListeners();
      this.setupBackgroundMessageHandler();
      return token;
    } catch (error) {
      return null;
    }
  }

  async requestPermissions() {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
        }
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        return enabled;
      } else if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
        if (enabled) {
          await messaging().registerDeviceForRemoteMessages();
        }
        return enabled;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async getFCMToken() {
    try {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        await messaging().registerDeviceForRemoteMessages();
      }
      const token = await messaging().getToken();
      this.fcmToken = token;
      await AsyncStorage.setItem('fcmToken', token);
      messaging().onTokenRefresh(async (newToken) => {
        this.fcmToken = newToken;
        await AsyncStorage.setItem('fcmToken', newToken);
      });
      return token;
    } catch (error) {
      return null;
    }
  }

  async createNotificationChannels() {
    if (Platform.OS === 'android') {
      try {
        // Delete and recreate channels with custom sounds
        // Android channels are immutable - must delete to change sound
        const channelsToRecreate = ['bookings', 'autocancel', 'reject'];
        for (const channelId of channelsToRecreate) {
          try {
            await notifee.deleteChannel(channelId);
          } catch (e) {
            // Channel might not exist
          }
        }

        await notifee.createChannel({
          id: 'default',
          name: 'Default Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        await notifee.createChannel({
          id: 'calls',
          name: 'Voice & Video Calls',
          importance: AndroidImportance.HIGH,
          sound: 'ringtone',
          vibration: true,
        });

        await notifee.createChannel({
          id: 'messages',
          name: 'Messages',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        // Booking notifications - plays booking_notification.mp3
        await notifee.createChannel({
          id: 'bookings',
          name: 'Booking Requests',
          importance: AndroidImportance.HIGH,
          sound: 'booking_notification',
          vibration: true,
        });

        // Auto-cancel notifications - plays autocancel_notification.mp3
        await notifee.createChannel({
          id: 'autocancel',
          name: 'Auto Cancel Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'autocancel_notification',
          vibration: true,
        });

        // Reject notifications - plays reject_notification.mp3
        await notifee.createChannel({
          id: 'reject',
          name: 'Rejection Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'reject_notification',
          vibration: true,
        });

        await notifee.createChannel({
          id: 'general',
          name: 'General Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });

        // Ride completed notifications - uses default system sound
        await notifee.createChannel({
          id: 'completed',
          name: 'Ride Completed Notifications',
          importance: AndroidImportance.HIGH,
          sound: 'default',
          vibration: true,
        });
      } catch (error) {
        // Silent catch
      }
    }
  }

  setupNotificationListeners() {
    this.unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      const { data } = remoteMessage;
      const notificationType = data?.type || '';
      const title = remoteMessage.notification?.title || '';
      const body = remoteMessage.notification?.body || '';
      const titleLower = title.toLowerCase();
      const bodyLower = body.toLowerCase();

      const isBookingConfirmedForCustomer =
        bodyLower.includes('confirmed') ||
        bodyLower.includes('accepted') ||
        bodyLower.includes('approved') ||
        titleLower.includes('confirmed') ||
        titleLower.includes('accepted') ||
        titleLower.includes('approved');

      // Check if this is a cancellation notification for the OWNER (customer cancelled their booking)
      const isBookingCancelledByCustomer =
        data?.type === 'booking_cancelled' ||
        (titleLower.includes('booking cancelled') && bodyLower.includes('customer'));

      const isBookingCancelledForCustomer =
        !isBookingCancelledByCustomer && (
          bodyLower.includes('cancelled') ||
          bodyLower.includes('rejected') ||
          bodyLower.includes('declined') ||
          titleLower.includes('cancelled') ||
          titleLower.includes('rejected') ||
          titleLower.includes('declined')
        );

      // Check if this is a ride completed notification
      const isRideCompleted =
        bodyLower.includes('completed') ||
        bodyLower.includes('ride completed') ||
        bodyLower.includes('trip completed') ||
        bodyLower.includes('journey completed') ||
        titleLower.includes('completed') ||
        titleLower.includes('ride completed') ||
        titleLower.includes('trip completed') ||
        data?.status?.toLowerCase() === 'completed' ||
        notificationType === 'completed';

      const isCustomerSubmissionNotification =
        bodyLower.includes('sent') ||
        bodyLower.includes('submitted') ||
        bodyLower.includes('placed') ||
        bodyLower.includes('your request') ||
        bodyLower.includes('your booking') ||
        bodyLower.includes('you have booked') ||
        bodyLower.includes('booking request sent') ||
        bodyLower.includes('successfully booked') ||
        bodyLower.includes('booking successful') ||
        bodyLower.includes('booked successfully') ||
        bodyLower.includes('request has been') ||
        bodyLower.includes('has been sent') ||
        bodyLower.includes('has been submitted') ||
        bodyLower.includes('has been placed') ||
        titleLower.includes('request sent') ||
        titleLower.includes('booking sent') ||
        titleLower.includes('booking submitted') ||
        titleLower.includes('booking successful') ||
        titleLower.includes('successfully booked');

      // Check if current user is the customer who made the booking (not the owner)
      const notificationCustomerId = data?.customerId || data?.customer_id || data?.userId || data?.user_id;
      const notificationOwnerId = data?.ownerId || data?.owner_id || data?.vehicleOwnerId;
      const isCurrentUserTheCustomer = this.currentUserId &&
        (this.currentUserId === notificationCustomerId ||
         (notificationOwnerId && this.currentUserId !== notificationOwnerId));

      const isOwnerReceivingBookingRequest =
        bodyLower.includes('wants to book') ||
        bodyLower.includes('wants to rent') ||
        bodyLower.includes('requested your') ||
        bodyLower.includes('new booking request') ||
        bodyLower.includes('someone wants') ||
        bodyLower.includes('customer wants') ||
        bodyLower.includes('has requested') ||
        titleLower.includes('new booking') ||
        titleLower.includes('booking request');

      const hasBookingKeywords =
        titleLower.includes('booking') ||
        bodyLower.includes('booking') ||
        bodyLower.includes('book your') ||
        bodyLower.includes('wants to book') ||
        bodyLower.includes('requested') ||
        notificationType === 'booking';

      // Only consider it a new booking request for owner if:
      // 1. Has owner-specific keywords OR booking keywords
      // 2. NOT a customer submission notification
      // 3. NOT a confirmation/cancellation notification
      // 4. Current user is NOT the customer who made the booking
      const isNewBookingRequestForOwner =
        (isOwnerReceivingBookingRequest || hasBookingKeywords) &&
        !isCustomerSubmissionNotification &&
        !isBookingConfirmedForCustomer &&
        !isBookingCancelledForCustomer &&
        !isCurrentUserTheCustomer;

      const isMessageNotification =
        notificationType === 'message' ||
        notificationType === 'chat' ||
        titleLower.includes('message') ||
        titleLower.includes('new message') ||
        bodyLower.includes('sent you a message');

      // IMPORTANT: Only display notification here, navigation happens when user taps
      // This prevents duplicate popups/screens throughout the app

      if (isBookingCancelledByCustomer) {
        // Customer cancelled - close RequestStatusScreen and show cancelled popup for owner
        SoundService.stopAllSounds();
        await this.displayNotification(remoteMessage);

        const bookingId = data?.bookingId || data?.booking_id || data?.id;
        if (this.navigationRef?.isReady()) {
          this.navigationRef.navigate('BookingRejectScreen', {
            status: 'cancelled',
            bookingId: bookingId
          });
        }
      } else if (isBookingConfirmedForCustomer) {
        // Show notification and auto-navigate to close waiting popup for customer
        await this.displayNotification(remoteMessage);

        // Trigger callback to close waiting popup if registered
        if (this.onBookingConfirmedCallback) {
          this.onBookingConfirmedCallback();
        }

        // Auto-navigate to BookingRejectScreen to close waiting popup immediately
        // Skip canNavigateTo check - always navigate for booking confirmation
        const bookingId = data?.bookingId || data?.booking_id || data?.id;
        if (this.navigationRef?.isReady()) {
          this.navigationRef.navigate('BookingRejectScreen', {
            status: 'accepted',
            bookingId: bookingId
          });
        }
      } else if (isBookingCancelledForCustomer) {
        // Play reject sound and show notification
        SoundService.playRejectSound();
        await this.displayNotification(remoteMessage);

        // Trigger callback to close waiting popup if registered
        if (this.onBookingConfirmedCallback) {
          this.onBookingConfirmedCallback();
        }

        // Auto-navigate to BookingRejectScreen to close waiting popup immediately
        const bookingId = data?.bookingId || data?.booking_id || data?.id;
        if (this.navigationRef?.isReady()) {
          this.navigationRef.navigate('BookingRejectScreen', {
            status: 'rejected',
            bookingId: bookingId
          });
        }
      } else if (isRideCompleted) {
        // Ride completed - play default sound and show notification for both owner and customer
        // Default sound is played automatically by the notification channel
        await this.displayNotification(remoteMessage, 'completed');

        // Navigate to NotificationScreen to show ride completed
        if (this.navigationRef?.isReady() && this.canNavigateTo('NotificationScreen', null)) {
          this.navigationRef.navigate('NotificationScreen');
        }
      } else if (isNewBookingRequestForOwner) {
        // Play booking sound for owner and show notification
        SoundService.playBookingSound();
        await this.displayNotification(remoteMessage);

        // Auto-navigate to RequestStatusScreen immediately when owner receives booking notification
        const bookingId = data?.bookingId || data?.booking_id || data?.id;
        if (this.navigationRef?.isReady() && this.canNavigateTo('RequestStatusScreen', bookingId)) {
          this.navigationRef.navigate('RequestStatusScreen', {
            bookingId: bookingId,
            fromForegroundNotification: true
          });
        }
      } else if (isMessageNotification) {
        // Show notification only - navigation happens via handleNotificationPress when user taps
        await this.displayNotification(remoteMessage);
      } else {
        // General notification - just display
        await this.displayNotification(remoteMessage);
      }
    });

    notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification);
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {
      if (type === EventType.PRESS) {
        this.handleNotificationPress(detail.notification);
      }
    });
  }

  setupBackgroundMessageHandler() {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      await this.displayNotification(remoteMessage);
    });
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          this.handleNotificationPress({
            data: remoteMessage.data,
          });
        }
      });
    messaging().onNotificationOpenedApp((remoteMessage) => {
      this.handleNotificationPress({
        data: remoteMessage.data,
      });
    });
  }

  async displayNotification(remoteMessage, overrideChannel = null) {
    try {
      const { notification, data } = remoteMessage;

      // Generate unique notification ID to prevent duplicates
      const notificationId = data?.notificationId ||
        data?.bookingId ||
        data?.messageId ||
        `${notification?.title || ''}_${notification?.body || ''}_${Date.now()}`;

      // Check if this notification was already displayed (within last 5 seconds)
      if (this.displayedNotificationIds.has(notificationId)) {
        return; // Skip duplicate
      }

      // Mark as displayed and auto-cleanup after 5 seconds
      this.displayedNotificationIds.add(notificationId);
      setTimeout(() => {
        this.displayedNotificationIds.delete(notificationId);
      }, 5000);

      const notificationType = data?.notificationType || data?.type || 'general';

      // Use default channel and sound for all notifications
      // Custom sounds (booking_notification) are handled by SoundService in foreground listener (only for owner)
      let channelId = overrideChannel || 'general';
      let sound = 'default';

      // Only use custom channels for calls and messages (unless overridden)
      if (!overrideChannel) {
        if (notificationType === 'call') {
          channelId = 'calls';
          sound = 'ringtone';
        } else if (notificationType === 'message' || notificationType === 'chat') {
          channelId = 'messages';
        } else if (notificationType === 'completed') {
          channelId = 'completed';
        }
      }

      const notificationConfig = {
        title: notification?.title || 'New Notification',
        body: notification?.body || '',
        data: data || {},
        android: {
          channelId,
          importance: AndroidImportance.HIGH,
          sound,
          pressAction: {
            id: 'default',
          },
          vibrationPattern: [300, 500],
          ...(notificationType === 'call' && {
            fullScreenAction: {
              id: 'default',
            },
            category: 'call',
            actions: [
              {
                title: 'Answer',
                pressAction: {
                  id: 'answer',
                },
              },
              {
                title: 'Decline',
                pressAction: {
                  id: 'decline',
                },
              },
            ],
          }),
        },
        ...(Platform.OS === 'ios' && {
          ios: {
            // iOS: sound file must be in app bundle
            sound: sound === 'default' ? 'default' : `${sound}.mp3`,
            ...(notificationType === 'call' && { categoryId: 'call' }),
          },
        }),
      };

      await notifee.displayNotification(notificationConfig);
    } catch (error) {
      // Silent catch
    }
  }

  async handleNotificationPress(notification) {
    const data = notification?.data || {};
    const title = notification?.title || notification?.notification?.title || '';
    const body = notification?.body || notification?.notification?.body || '';
    const notificationId = notification?.id || notification?.messageId || `${Date.now()}`;

    if (this.isProcessingNotification) {
      return;
    }
    if (this.lastProcessedNotificationId === notificationId) {
      return;
    }

    this.isProcessingNotification = true;
    this.lastProcessedNotificationId = notificationId;

    try {
      if (!this.navigationRef?.isReady()) {
        this.pendingNotification = notification;
        await this.waitForNavigationReady();
      }

      // Check if this is a call notification
      if (data.type === 'call') {
        this.handleCallNotification(data);
        return;
      }

      // Check if this is a message notification
      if (data.type === 'message' || data.type === 'chat') {
        this.handleMessageNotification(data);
        return;
      }

      // For all other notifications, navigate to NotificationScreen
      if (this.navigationRef?.isReady() && this.canNavigateTo('NotificationScreen', null)) {
        this.navigationRef.navigate('NotificationScreen');
      }
    } finally {
      this.pendingNotification = null;
      this.isProcessingNotification = false;
    }
  }

  async waitForNavigationReady(maxRetries = 20, delay = 200) {
    for (let i = 0; i < maxRetries; i++) {
      if (this.navigationRef?.isReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
  }

  handleCallNotification(data) {
    if (this.navigationRef?.isReady() &&
        this.canNavigateTo('IncomingCallScreen', data.callId)) {
      this.navigationRef.navigate('IncomingCallScreen', {
        callId: data.callId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callType: data.callType || 'audio',
      });
    }
  }

  handleMessageNotification(data) {
    const bookingId = data.bookingId || data.booking_id;

    if (this.navigationRef?.isReady() &&
        this.canNavigateTo('ChatScreen', bookingId)) {
      const senderId = data.senderId || data.sender_id;
      const receiverId = data.receiverId || data.receiver_id;
      const senderName = data.senderName || data.sender_name || 'User';
      const customerId = data.customerId || data.customer_id;
      const ownerId = data.ownerId || data.owner_id;

      this.navigationRef.navigate('ChatScreen', {
        bookingId: bookingId,
        receiverId: senderId,
        customerId: customerId || receiverId,
        ownerId: ownerId || senderId,
        customerName: senderName,
        ownerName: senderName,
      });
    }
  }

  async handleBookingNotification(data) {
    const bookingId = data?.bookingId || data?.booking_id || data?.id;

    if (this.navigationRef?.isReady() &&
        this.canNavigateTo('RequestStatusScreen', bookingId)) {
      this.navigationRef.navigate('RequestStatusScreen', {
        bookingId: bookingId,
        fromNotification: true
      });
    }
  }

  async sendTokenToBackend(token, userId) {
    try {
      if (!token || !userId) {
        return { success: false, message: 'Missing token or userId' };
      }

      const { API_CONFIG } = require('../config/apiConfig');
      const checkUserEndpoint = `${API_CONFIG.BASE_URL}/user/${userId}`;

      try {
        const checkResponse = await fetch(checkUserEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!checkResponse.ok) {
          if (checkResponse.status === 404) {
            await AsyncStorage.setItem('pendingFcmToken', JSON.stringify({
              token,
              userId,
              timestamp: Date.now()
            }));
            return { success: false, message: 'User not found, will retry later', retry: true };
          }
        }
      } catch (checkError) {
        // Silent catch
      }

      const endpoint = `${API_CONFIG.BASE_URL}/updateUser/${userId}`;
      const requestBody = {
        fcmTokens: [token],
        platform: Platform.OS,
      };

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 404) {
          await AsyncStorage.setItem('pendingFcmToken', JSON.stringify({
            token,
            userId,
            timestamp: Date.now()
          }));
          return { success: false, message: 'User not found, will retry later', retry: true };
        }

        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      await AsyncStorage.removeItem('pendingFcmToken');
      return result;
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async retryPendingFcmToken() {
    try {
      const pendingData = await AsyncStorage.getItem('pendingFcmToken');
      if (!pendingData) {
        return null;
      }

      const { token, userId, timestamp } = JSON.parse(pendingData);
      const maxAge = 24 * 60 * 60 * 1000;

      if (Date.now() - timestamp > maxAge) {
        await AsyncStorage.removeItem('pendingFcmToken');
        return null;
      }

      return await this.sendTokenToBackend(token, userId);
    } catch (error) {
      return null;
    }
  }

  async getBadgeCount() {
    try {
      return await notifee.getBadgeCount();
    } catch (error) {
      return 0;
    }
  }

  async setBadgeCount(count) {
    try {
      await notifee.setBadgeCount(count);
    } catch (error) {
      // Silent catch
    }
  }

  async incrementBadge() {
    try {
      const current = await this.getBadgeCount();
      await this.setBadgeCount(current + 1);
    } catch (error) {
      // Silent catch
    }
  }

  async clearBadge() {
    try {
      await notifee.setBadgeCount(0);
    } catch (error) {
      // Silent catch
    }
  }

  async cancelAllNotifications() {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      // Silent catch
    }
  }

  cleanup() {
    if (this.unsubscribeOnMessage) {
      this.unsubscribeOnMessage();
    }
    if (this.unsubscribeOnNotificationOpen) {
      this.unsubscribeOnNotificationOpen();
    }
  }
}

export default new NotificationService();