import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import { navigationRef } from './NavigationService';

/**
 * Call Notification Service
 * Handles push notifications for incoming calls using FCM
 * This is a fallback when Socket.io call forwarding is not available
 */

class CallNotificationService {
  constructor() {
    this.setupNotificationHandlers();
  }

  /**
   * Setup notification handlers for foreground and background
   */
  setupNotificationHandlers() {

    // Handle foreground notifications (when app is open)
    messaging().onMessage(async remoteMessage => {

      if (remoteMessage.data?.type === 'incoming_call') {

        await this.handleIncomingCallNotification(remoteMessage.data);
      }
    });

    // Handle notification interactions (when user taps notification)
    notifee.onForegroundEvent(async ({ type, detail }) => {

      if (type === EventType.PRESS && detail.notification?.data?.type === 'incoming_call') {

        await this.navigateToIncomingCall(detail.notification.data);
      }
    });

    notifee.onBackgroundEvent(async ({ type, detail }) => {

      if (type === EventType.PRESS && detail.notification?.data?.type === 'incoming_call') {

        await this.navigateToIncomingCall(detail.notification.data);
      }
    });

  }

  /**
   * Handle incoming call notification
   * @param {Object} data - Notification data
   */
  async handleIncomingCallNotification(data) {

    // Display full-screen notification with ringtone
    await this.displayIncomingCallNotification(data);

    // Navigate to IncomingCallScreen
    await this.navigateToIncomingCall(data);
  }

  /**
   * Display incoming call notification
   * @param {Object} data - Call data
   */
  async displayIncomingCallNotification(data) {

    try {
      await notifee.displayNotification({
        title: `${data.callerName || 'Unknown'} is calling`,
        body: `${data.callType === 'video' ? 'Video' : 'Audio'} call`,
        data: {
          type: 'incoming_call',
          callId: data.callId,
          callerId: data.callerId,
          callerName: data.callerName,
          callerSocketId: data.callerSocketId,
          callType: data.callType,
        },
        android: {
          channelId: 'calls',
          importance: AndroidImportance.HIGH,
          category: 'call',
          fullScreenAction: {
            id: 'default',
          },
          pressAction: {
            id: 'default',
            launchActivity: 'default',
          },
          sound: 'ringtone',
          vibrationPattern: [300, 500, 300, 500],
          smallIcon: 'ic_launcher',
          ongoing: true,
          autoCancel: false,
          actions: [
            {
              title: 'Answer',
              pressAction: { id: 'answer' },
            },
            {
              title: 'Decline',
              pressAction: { id: 'decline' },
            },
          ],
        },
        ios: {
          sound: 'ringtone.mp3',
          categoryId: 'call',
          interruptionLevel: 'critical',
        },
      });

    } catch (error) {

    }
  }

  /**
   * Navigate to IncomingCallScreen
   * @param {Object} data - Call data
   */
  async navigateToIncomingCall(data) {

    if (navigationRef?.isReady?.()) {
      navigationRef.navigate('IncomingCallScreen', {
        callId: data.callId,
        callerId: data.callerId,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        callType: data.callType || 'audio',
        offer: data.offer,
      });

    } else {

      // Retry after a delay
      setTimeout(() => {
        if (navigationRef?.isReady?.()) {
          navigationRef.navigate('IncomingCallScreen', {
            callId: data.callId,
            callerId: data.callerId,
            callerName: data.callerName,
            callerAvatar: data.callerAvatar,
            callType: data.callType || 'audio',
            offer: data.offer,
          });
        }
      }, 1000);
    }
  }

  /**
   * Send push notification for incoming call
   * This should be called from backend when Socket.io fails
   * @param {Object} callData - Call data
   */
  async sendCallNotification(callData) {

    // Note: Actually sending FCM notifications must be done from backend
    // This is just a placeholder to show what data should be sent

  }
}

// Export singleton instance
export default new CallNotificationService();
