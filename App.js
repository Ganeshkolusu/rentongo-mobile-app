 import notifee, { AndroidImportance } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import React, { useEffect, useState } from 'react';
import { BackHandler, Platform, StatusBar, Text, View } from 'react-native';
import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import InAppNotification from './src/components/InAppNotification';
import { AuthProvider } from './src/context/AuthContext';
import { DataCacheProvider } from './src/context/DataCacheContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { SocketProvider, useSocket } from './src/context/SocketContext';
import { ToastProvider } from './src/context/ToastContext';
import Navigation from './src/navigations/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';
import { navigationRef } from './src/services/NavigationService';

// Wrapper component to use socket context for in-app notifications
const AppContent = () => {
  const { inAppNotification, clearInAppNotification, setNotificationCountValue } = useSocket();

  // Fetch pending bookings count on app open and when app comes to foreground
  useEffect(() => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const { AppState } = require('react-native');
    const { getNotifications } = require('./src/api/notificationApi');

    const fetchNotificationsCount = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');

        if (!userId) {

          return;
        }


        // Fetch notifications and count unseen booking notifications
        const notifResult = await getNotifications(userId);

        let pendingCount = 0;
        if (notifResult?.success && notifResult?.data?.length > 0) {
          // Count unseen booking notifications
          pendingCount = notifResult.data.filter(n =>
            (n.type || '').toLowerCase() === 'booking' && !n.seen
          ).length;
        }


        if (setNotificationCountValue) {
          setNotificationCountValue(pendingCount);
        }
      } catch (err) {

      }
    };

    // Fetch on mount
    const timer = setTimeout(fetchNotificationsCount, 1000); // Delay to ensure auth is ready

    // Fetch when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {

        fetchNotificationsCount();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription?.remove();
    };
  }, [setNotificationCountValue]);

  const handleNotificationPress = () => {
    if (inAppNotification?.data) {
      const { type, data } = inAppNotification;
      if (type === 'message' && data.bookingId) {
        navigationRef.current?.navigate('ChatScreen', {
          bookingId: data.bookingId,
          ownerId: data.senderId,
          customerId: data.receiverId,
        });
      } else if (type === 'booking') {
        navigationRef.current?.navigate('NotificationScreen');
      }
    }
    clearInAppNotification();
  };

  return (
    <>
      <Navigation />
      <InAppNotification
        visible={!!inAppNotification}
        type={inAppNotification?.type || 'message'}
        title={inAppNotification?.title || ''}
        message={inAppNotification?.message || ''}
        onPress={handleNotificationPress}
        onDismiss={clearInAppNotification}
      />
    </>
  );
};

// Create notification channels (must be done before background handler)
// This ensures channels exist even when app is in quit state
// IMPORTANT: Android channels are IMMUTABLE - once created, sound cannot be changed
// To apply new sounds, user must: uninstall app OR clear app data OR we delete and recreate channel
if (Platform.OS === 'android') {
  const createChannels = async () => {
    try {
      // Delete existing channels to ensure sound settings are applied
      // This is necessary because Android channels are immutable after creation
      const channelsToRecreate = ['bookings', 'autocancel', 'reject'];
      for (const channelId of channelsToRecreate) {
        try {
          await notifee.deleteChannel(channelId);
        } catch (e) {
          // Channel might not exist, ignore
        }
      }

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

    } catch (error) {
      console.error('Error creating notification channels:', error);
    }
  };

  createChannels();
}

// Register background handler must be called outside of App component
// This handles notifications when the app is in BACKGROUND or QUIT state
messaging().setBackgroundMessageHandler(async remoteMessage => {

  // Display notification using Notifee when app is closed
  try {
    const { notification, data } = remoteMessage;

    // PRIMARY: Use notificationType field from payload for sound mapping
    // Expected values: "booking" | "autoCancel" | "reject" | "message" | "call"
    const notificationType = data?.notificationType || data?.type || 'general';

    // Sound mapping based on notificationType
    // booking → booking_notification.mp3
    // autoCancel → autocancel_notification.mp3
    // reject → reject_notification.mp3
    const soundMap = {
      booking: { channelId: 'bookings', sound: 'booking_notification' },
      autoCancel: { channelId: 'autocancel', sound: 'autocancel_notification' },
      reject: { channelId: 'reject', sound: 'reject_notification' },
      call: { channelId: 'calls', sound: 'ringtone' },
      message: { channelId: 'messages', sound: 'default' },
    };

    // Get channel and sound from map, fallback to general
    let { channelId, sound } = soundMap[notificationType] || { channelId: 'general', sound: 'default' };

    // FALLBACK: If notificationType not provided, detect from title/body keywords
    if (!soundMap[notificationType]) {
      const title = (notification?.title || '').toLowerCase();
      const body = (notification?.body || '').toLowerCase();

      if (body.includes('wants to book') || body.includes('new booking') || body.includes('booking request') || title.includes('new booking')) {
        channelId = 'bookings';
        sound = 'booking_notification';
      } else if (body.includes('auto-cancel') || body.includes('autocancelled') || body.includes('auto cancelled')) {
        channelId = 'autocancel';
        sound = 'autocancel_notification';
      } else if (body.includes('rejected') || body.includes('cancelled') || body.includes('declined')) {
        channelId = 'reject';
        sound = 'reject_notification';
      }
    }

    // Display notification with platform-specific sound configuration
    await notifee.displayNotification({
      title: notification?.title || data?.title || 'New Notification',
      body: notification?.body || data?.body || '',
      data: data || {},
      android: {
        channelId,
        importance: AndroidImportance.HIGH,
        pressAction: {
          id: 'default',
        },
        // Android: sound is defined in channel, but we set it here too for explicit control
        sound,
        vibrationPattern: [300, 500, 300, 500],
        smallIcon: 'ic_launcher',
      },
      ios: {
        // iOS: sound file must be in app bundle (add via Xcode)
        // Format: filename.mp3 (must be < 30 seconds)
        sound: sound === 'default' ? 'default' : `${sound}.mp3`,
      },
    });

  } catch (error) {
    console.error('Background notification error:', error);
  }
});

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

  // Request notification permissions function
  const requestUserPermission = async () => {
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {

      } else {

      }
    } else {
      // Android doesn't need explicit permission request for FCM

    }
  };

  useEffect(() => {

    // Request notification permissions on app start
    requestUserPermission();
  }, []);

  // Handle Android hardware back button to show exit confirmation at root
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      try {
        const canGoBack = navigationRef.current?.canGoBack?.();
        if (canGoBack) {
          navigationRef.current.goBack();
          return true; // handled
        }
      } catch (err) {
        // ignore
      }

      // At root - exit app
      BackHandler.exitApp();
      return true; // prevent default
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // Hide splash screen callback
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  try {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent={true}
          />
          <AuthProvider>
            {/* DataCacheProvider for caching API data */}
            <DataCacheProvider>
              {/* NotificationProvider for push notifications (background) */}
              <NotificationProvider navigationRef={navigationRef}>
                {/* SocketProvider for real-time features (chat, calls, orders) */}
                <SocketProvider navigationRef={navigationRef}>
                  <ToastProvider>
                    <AppContent />
                  </ToastProvider>
                </SocketProvider>
              </NotificationProvider>
            </DataCacheProvider>
          </AuthProvider>
        </View>
      </SafeAreaProvider>
    );
  } catch (error) {

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <Text style={{ color: '#FF0000', fontSize: 16 }}>Error: {error.message}</Text>
      </View>
    );
  }
};

export default App;