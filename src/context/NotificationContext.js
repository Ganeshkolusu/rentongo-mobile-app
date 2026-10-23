 import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import NotificationService from '../services/NotificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children, navigationRef }) => {
  const { user, userId, loading } = useAuth(); // Get userId directly from AuthContext
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const appState = useRef(AppState.currentState);
  const tokenSentRef = useRef(false); // Track if token has been sent

  useEffect(() => {
    // Initialize notifications
    initializeNotifications();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      NotificationService.cleanup();
    };
  }, [navigationRef]);

  useEffect(() => {

    // Send token to backend when BOTH user and fcmToken are available
    // and auth is not loading
    if (!loading && user && fcmToken && userId) {
      // Set current user ID in NotificationService for proper popup targeting
      NotificationService.setCurrentUserId(userId);

      // Only send once per session
      if (!tokenSentRef.current) {
        NotificationService.sendTokenToBackend(fcmToken, userId)
          .then((result) => {
            // Silent handling
          })
          .catch((error) => {
            // Silent handling
          });

        tokenSentRef.current = true;
      }
    }

  }, [user, fcmToken, userId, loading]);

  const initializeNotifications = async () => {
    try {

      const token = await NotificationService.initialize(navigationRef);
      if (token) {
        setFcmToken(token);
      } else {

      }
    } catch (error) {

    }
  };

  const handleAppStateChange = async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to foreground

      await NotificationService.clearBadge();
      setBadgeCount(0);

      // Retry pending FCM token if user is logged in
      if (user && userId) {
        NotificationService.retryPendingFcmToken()
          .then((result) => {
            // Silent handling
          })
          .catch(() => {});
      }
    }
    appState.current = nextAppState;
  };

  const incrementBadge = async () => {
    const newCount = badgeCount + 1;
    setBadgeCount(newCount);
    await NotificationService.setBadgeCount(newCount);
  };

  const clearBadge = async () => {
    setBadgeCount(0);
    await NotificationService.clearBadge();
  };

  const value = {
    fcmToken,
    notification,
    badgeCount,
    clearBadge,
    incrementBadge,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationContext;