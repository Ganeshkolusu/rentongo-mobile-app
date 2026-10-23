import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Sound from 'react-native-sound';
import SocketService from '../services/SocketService';
import SoundService from '../services/SoundService';
import { useAuth } from './AuthContext';

/**
 * Socket Context
 * Provides global Socket.io state management
 */

const SocketContext = createContext();

export const SocketProvider = ({ children, navigationRef }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [newBooking, setNewBooking] = useState(null);
  const [newMessage, setNewMessage] = useState(null);
  const [inAppNotification, setInAppNotification] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [lastReadTimestamp, setLastReadTimestamp] = useState(null);
  const appStateRef = useRef(AppState.currentState);
  const bookingSoundRef = useRef(null);
  const autoCancelSoundRef = useRef(null);
  const rejectSoundRef = useRef(null);
  const messageSoundRef = useRef(null);
  const ringtoneSoundRef = useRef(null);
  const lastRejectSoundTimeRef = useRef(0);
  const lastBookingSoundTimeRef = useRef(0);
  const processedRejectionIdsRef = useRef(new Set());

  useEffect(() => {
    const loadLastReadTimestamp = async () => {
      try {
        const userId = user?.userId || user?._id || user?.id;
        if (userId) {
          const timestamp = await AsyncStorage.getItem(`lastReadTimestamp_${userId}`);
          if (timestamp) {
            setLastReadTimestamp(parseInt(timestamp, 10));
          }
        }
      } catch (error) {
        // Silent catch
      }
    };
    loadLastReadTimestamp();
  }, [user]);

  useEffect(() => {
    const userId = user?.userId || user?._id || user?.id;

    if (user && userId) {
      SocketService.connect(userId);

      const checkConnection = setInterval(() => {
        const connectionStatus = SocketService.getConnectionStatus();
        setIsConnected(connectionStatus);
      }, 1000);

      return () => {
        clearInterval(checkConnection);
      };
    } else {
      if (isConnected) {
        SocketService.disconnect();
        setIsConnected(false);
      }
    }
  }, [user]);

  useEffect(() => {
    const userId = user?.userId || user?._id || user?.id;

    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        if (SocketService.getConnectionStatus()) {
          SocketService.disconnect();
          setIsConnected(false);
        }

        if (bookingSoundRef.current) {
          bookingSoundRef.current.release();
          bookingSoundRef.current = null;
        }
        if (autoCancelSoundRef.current) {
          autoCancelSoundRef.current.release();
          autoCancelSoundRef.current = null;
        }
        if (rejectSoundRef.current) {
          rejectSoundRef.current.release();
          rejectSoundRef.current = null;
        }
        if (messageSoundRef.current) {
          messageSoundRef.current.release();
          messageSoundRef.current = null;
        }
        if (ringtoneSoundRef.current) {
          ringtoneSoundRef.current.stop();
          ringtoneSoundRef.current.release();
          ringtoneSoundRef.current = null;
        }
      }

      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (user && userId && !SocketService.getConnectionStatus()) {
          SocketService.connect(userId);
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user]);

  // ==================== CALL HANDLERS ====================

  useEffect(() => {
    if (!isConnected || !SocketService.socket) {
      return;
    }

    SocketService.onIncomingCall((callData) => {
      setIncomingCall(callData);
      playRingtone();

      if (navigationRef?.isReady()) {
        navigationRef.navigate('CallScreen', {
          callId: callData.callId,
          isIncoming: true,
          receiverId: callData.callerId,
          receiverName: callData.callerName,
          receiverAvatar: callData.callerAvatar,
          callType: callData.callType || 'audio',
          offer: callData.offer,
        });
      }
    });

    SocketService.onCallEnded((data) => {
      setIncomingCall(null);
    });

    SocketService.onCallRejected((data) => {
      setIncomingCall(null);
    });

    return () => {
      SocketService.removeListener('incomingCall');
      SocketService.removeListener('callEnded');
      SocketService.removeListener('callRejected');
    };
  }, [isConnected, navigationRef]);

  // ==================== CHAT MESSAGE HANDLERS ====================

  useEffect(() => {
    if (!isConnected || !SocketService.socket) return;

    const currentUserId = user?.userId || user?._id || user?.id;

    SocketService.socket.on('new_message', (messageData) => {
      const messageSenderId = typeof messageData.senderId === 'string'
        ? messageData.senderId
        : messageData.senderId?._id;

      if (messageSenderId !== currentUserId) {
        setNewMessage(messageData);
        playMessageSound();

        setInAppNotification({
          type: 'message',
          title: messageData.senderName || 'New Message',
          message: messageData.message || 'You have a new message',
          data: messageData,
        });
        setNotificationCount(prev => prev + 1);
      }
    });

    return () => {
      if (SocketService.socket) {
        SocketService.socket.off('new_message');
      }
    };
  }, [isConnected, user]);

  // ==================== BOOKING HANDLERS ====================

  useEffect(() => {
    if (!isConnected || !SocketService.socket) return;

    const currentUserId = user?.userId || user?._id || user?.id;

    if (SocketService.socket) {
      SocketService.socket.on('new-booking-request', (bookingData) => {
        const bookingOwnerId = bookingData.ownerId || bookingData.owner_id;
        const bookingCustomerId = bookingData.customerId || bookingData.customer_id || bookingData.userId;

        let isTargetOwner = false;

        if (bookingOwnerId) {
          isTargetOwner = currentUserId === bookingOwnerId && currentUserId !== bookingCustomerId;
        } else if (bookingCustomerId) {
          isTargetOwner = currentUserId && currentUserId !== bookingCustomerId;
        }

        if (isTargetOwner) {
          setNewBooking(bookingData);
          playBookingSound();
          setNotificationCount(prev => prev + 1);

          setInAppNotification({
            type: 'booking',
            title: 'New Booking Request',
            message: `${bookingData.customerName || 'Customer'} wants to book your vehicle`,
            data: bookingData,
          });

          if (navigationRef?.isReady()) {
            navigationRef.navigate('RequestStatusScreen', {
              bookingId: bookingData.bookingId,
              fromSocketNotification: true
            });
          }
        }
      });
    }

    SocketService.onNewBooking((bookingData) => {
      const bookingOwnerId = bookingData.ownerId || bookingData.owner_id;
      const bookingCustomerId = bookingData.customerId || bookingData.customer_id || bookingData.userId;

      let isTargetOwner = false;

      if (bookingOwnerId) {
        isTargetOwner = currentUserId === bookingOwnerId && currentUserId !== bookingCustomerId;
      } else if (bookingCustomerId) {
        isTargetOwner = currentUserId && currentUserId !== bookingCustomerId;
      }

      if (isTargetOwner) {
        setNewBooking(bookingData);
        playBookingSound();
        setNotificationCount(prev => prev + 1);

        setInAppNotification({
          type: 'booking',
          title: 'New Booking Request',
          message: `${bookingData.customerName || 'Customer'} wants to book your vehicle`,
          data: bookingData,
        });
      }
    });

    SocketService.onBookingConfirmed((bookingData) => {
      if (navigationRef?.isReady()) {
        // Navigation handled elsewhere
      }
    });

    // Listen for booking acceptance - close waiting popup for customer automatically
    if (SocketService.socket) {
      SocketService.socket.on('booking_accepted', (bookingData) => {
        const customerId = bookingData.customerId || bookingData.customer_id || bookingData.userId;
        const bookingId = bookingData.bookingId || bookingData._id;

        // If current user is the customer who made the booking, navigate to acceptance screen
        if (customerId === currentUserId) {
          if (navigationRef?.isReady()) {
            navigationRef.navigate('BookingRejectScreen', {
              status: 'accepted',
              bookingId: bookingId
            });
          }
        }
      });

      // Also listen for booking-status-update event (emitted by owner on accept/reject)
      SocketService.socket.on('booking-status-update', (data) => {
        const customerId = data.customerId || data.customer_id;
        const bookingId = data.bookingId || data._id;
        const status = data.status;

        // If current user is the customer and status is accepted
        if (customerId === currentUserId && (status === 'accepted' || status === 'Confirmed')) {
          if (navigationRef?.isReady()) {
            navigationRef.navigate('BookingRejectScreen', {
              status: 'accepted',
              bookingId: bookingId
            });
          }
        }
      });
    }

    SocketService.onBookingCancelled((bookingData) => {
      if (bookingData.ownerId === currentUserId) {
        playAutoCancelSound();
      } else {
        const bookingId = bookingData.bookingId || bookingData._id;
        playRejectSound(bookingId);
      }
    });

    SocketService.onBookingRejected((bookingData) => {
      const customerId = bookingData.customerId || bookingData.userId || bookingData.customer_id;
      const bookingId = bookingData.bookingId || bookingData._id;

      if (customerId === currentUserId) {
        playRejectSound(bookingId);

        setInAppNotification({
          type: 'reject',
          title: 'Booking Rejected',
          message: 'Your booking request has been rejected by the owner',
          data: bookingData,
        });

        setNotificationCount(prev => prev + 1);

        if (navigationRef?.isReady()) {
          navigationRef.navigate('BookingRejectScreen', {
            status: 'rejected',
            bookingId: bookingId
          });
        }
      }
    });

    SocketService.onBookingUpdated((bookingData) => {
      if (bookingData.status === 'rejected' || bookingData.status === 'Rejected') {
        const customerId = bookingData.customerId || bookingData.userId || bookingData.customer_id;
        const bookingId = bookingData.bookingId || bookingData._id;

        if (customerId === currentUserId) {
          playRejectSound(bookingId);

          setInAppNotification({
            type: 'reject',
            title: 'Booking Rejected',
            message: 'Your booking request has been rejected',
            data: bookingData,
          });

          if (navigationRef?.isReady()) {
            navigationRef.navigate('BookingRejectScreen', {
              status: 'rejected',
              bookingId: bookingId
            });
          }
        }
      }
    });

    return () => {
      if (SocketService.socket) {
        SocketService.socket.off('new-booking-request');
        SocketService.socket.off('booking_rejected');
        SocketService.socket.off('bookingRejected');
        SocketService.socket.off('booking_accepted');
        SocketService.socket.off('booking-status-update');
      }
      SocketService.removeListener('new_booking');
      SocketService.removeListener('booking_confirmed');
      SocketService.removeListener('booking_cancelled');
      SocketService.removeListener('booking_rejected');
      SocketService.removeListener('booking_updated');
    };
  }, [isConnected, navigationRef, user]);

  // ==================== HELPER METHODS ====================

  const playBookingSound = useCallback(() => {
    SoundService.playBookingSound();
  }, []);

  const playAutoCancelSound = useCallback(() => {
    Sound.setCategory('Playback');

    const autoCancelSound = new Sound('autocancel_notification.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }

      autoCancelSound.play((success) => {
        autoCancelSound.release();
      });
    });

    autoCancelSoundRef.current = autoCancelSound;
  }, []);

  const playRejectSound = useCallback((bookingId = null) => {
    const now = Date.now();
    const DEBOUNCE_MS = 3000;

    if (now - lastRejectSoundTimeRef.current < DEBOUNCE_MS) {
      return;
    }

    if (bookingId && processedRejectionIdsRef.current.has(bookingId)) {
      return;
    }

    lastRejectSoundTimeRef.current = now;
    if (bookingId) {
      processedRejectionIdsRef.current.add(bookingId);
      setTimeout(() => {
        processedRejectionIdsRef.current.delete(bookingId);
      }, 60000);
    }

    SoundService.playRejectSound();
  }, []);

  const playMessageSound = useCallback(() => {
    Sound.setCategory('Playback');

    const messageSound = new Sound('booking_notification.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }

      messageSound.play((success) => {
        messageSound.release();
      });
    });

    messageSoundRef.current = messageSound;
  }, []);

  const playRingtone = useCallback(() => {
    stopRingtone();

    Sound.setCategory('Playback');

    const ringtoneSound = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        return;
      }

      ringtoneSound.setNumberOfLoops(-1);
      ringtoneSound.play((success) => {});
    });

    ringtoneSoundRef.current = ringtoneSound;
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringtoneSoundRef.current) {
      ringtoneSoundRef.current.stop();
      ringtoneSoundRef.current.release();
      ringtoneSoundRef.current = null;
    }
  }, []);

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  const clearNewBooking = useCallback(() => {
    setNewBooking(null);
  }, []);

  const clearNewMessage = useCallback(() => {
    setNewMessage(null);
  }, []);

  const clearInAppNotification = useCallback(() => {
    setInAppNotification(null);
  }, []);

  const incrementNotificationCount = useCallback(() => {
    setNotificationCount(prev => prev + 1);
  }, []);

  const clearNotificationCount = useCallback(async () => {
    setNotificationCount(0);

    const currentTimestamp = Date.now();
    setLastReadTimestamp(currentTimestamp);

    try {
      const userId = user?.userId || user?._id || user?.id;
      if (userId) {
        await AsyncStorage.setItem(`lastReadTimestamp_${userId}`, currentTimestamp.toString());
      }
    } catch (error) {
      // Silent catch
    }
  }, [user]);

  const setNotificationCountValue = useCallback((count) => {
    setNotificationCount(count);
  }, []);

  const calculateUnreadCount = useCallback((notifications) => {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      return 0;
    }

    if (!lastReadTimestamp) {
      return notifications.length;
    }

    const unreadCount = notifications.filter(notification => {
      const createdAt = notification.createdAt || notification.timestamp || notification.created_at;
      if (!createdAt) return false;

      const notificationTimestamp = new Date(createdAt).getTime();
      return notificationTimestamp > lastReadTimestamp;
    }).length;

    return unreadCount;
  }, [lastReadTimestamp]);

  const updateNotificationCountFromAPI = useCallback((notifications) => {
    const unreadCount = calculateUnreadCount(notifications);
    setNotificationCount(unreadCount);
  }, [calculateUnreadCount]);

  const showBookingNotification = useCallback((bookingData) => {
    setInAppNotification({
      type: 'booking',
      title: 'New Booking Request',
      message: `${bookingData.customerName || 'Customer'} wants to book your vehicle`,
      data: bookingData,
    });
    incrementNotificationCount();
  }, [incrementNotificationCount]);

  const value = {
    isConnected,
    socket: SocketService,
    incomingCall,
    newBooking,
    newMessage,
    inAppNotification,
    notificationCount,
    lastReadTimestamp,
    clearIncomingCall,
    clearNewBooking,
    clearNewMessage,
    clearInAppNotification,
    incrementNotificationCount,
    clearNotificationCount,
    setNotificationCountValue,
    calculateUnreadCount,
    updateNotificationCountFromAPI,
    showBookingNotification,
    playRingtone,
    stopRingtone,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom hook to use Socket context
 * @returns {Object} Socket context value
 */
export const useSocket = () => {
  const context = useContext(SocketContext);

  if (!context) {
    // Return default values instead of throwing to handle edge cases during initial render
    return {
      isConnected: false,
      socket: null,
      incomingCall: null,
      newBooking: null,
      newMessage: null,
      inAppNotification: null,
      notificationCount: 0,
      lastReadTimestamp: null,
      clearIncomingCall: () => {},
      clearNewBooking: () => {},
      clearNewMessage: () => {},
      clearInAppNotification: () => {},
      incrementNotificationCount: () => {},
      clearNotificationCount: () => {},
      setNotificationCountValue: () => {},
      calculateUnreadCount: () => 0,
      updateNotificationCountFromAPI: () => {},
      showBookingNotification: () => {},
      playRingtone: () => {},
      stopRingtone: () => {},
    };
  }

  return context;
};
