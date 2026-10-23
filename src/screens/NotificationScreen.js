import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { getBookingById } from '../api/bookingApi';
import {
  clearAllNotifications as clearAllNotificationsApi,
  deleteNotification as deleteNotificationApi,
  getNotifications,
  markAllNotificationsRead as markAllNotificationsReadApi,
  markNotificationRead as markNotificationReadApi,
} from '../api/notificationApi';
import { getVehicleById } from '../api/vehicleApi';
import FeedbackPopUp from '../components/FeedbackPopUp';
import Header from '../components/Header/Header';
import BookingConfirmationModal from '../components/Notification/BookingConfirmationModal';
import BookingNotificationCard from '../components/Notification/BookingNotificationCard';
import ChatNotificationCard from '../components/Notification/ChatNotificationCard';
import FeedbackNotificationCard from '../components/Notification/FeedbackNotificationCard';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';

const CACHE_KEY_NOTIFICATIONS = '@cached_notifications';
const CACHE_KEY_REVIEWED_BOOKINGS = '@reviewed_bookings';

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'chats', label: 'Chats' },
  { key: 'alerts', label: 'Alerts' },
];

const getCategory = (notification) => {
  if (notification.type === 'chat_message') return 'chats';
  if (notification.bookingId) return 'bookings';
  return 'alerts';
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalAction, setModalAction] = useState('confirm');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedFeedbackBooking, setSelectedFeedbackBooking] = useState(null);
  const [reviewedBookings, setReviewedBookings] = useState(new Set());
  const [filterTab, setFilterTab] = useState('all');
  const [userId, setUserId] = useState(null);

  const initialFetchDone = useRef(false);
  const cacheLoaded = useRef(false);
  const statusUpdateInterval = useRef(null);

  const handleBackPress = () => navigation.goBack();

  // Load reviewed bookings from AsyncStorage
  const loadReviewedBookings = async () => {
    try {
      const stored = await AsyncStorage.getItem(CACHE_KEY_REVIEWED_BOOKINGS);
      if (stored) {
        const bookingIds = JSON.parse(stored);
        setReviewedBookings(new Set(bookingIds));
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Save reviewed bookings to AsyncStorage
  const saveReviewedBookings = async (bookingIds) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY_REVIEWED_BOOKINGS, JSON.stringify(Array.from(bookingIds)));
    } catch (error) {
      // Silent fail
    }
  };

  // Calculate time ago from date string
  const timeAgo = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} hour${diffH > 1 ? 's' : ''} ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD} day${diffD > 1 ? 's' : ''} ago`;
  };

  // Calculate notification status based on booking status from backend
  const calculateStatus = (notification, bookingStatus) => {
    // First check booking status from backend (most reliable source)
    if (bookingStatus) {
      const status = bookingStatus.toLowerCase().trim();

      if (status === 'confirmed' || status === 'accepted') {
        return 'confirmed';
      }
      if (status === 'rejected' || status === 'cancelled') {
        return 'rejected';
      }
      if (status === 'autocancelled') {
        return 'expired';
      }
      if (status === 'completed') {
        return 'completed';
      }
      if (status === 'pending') {
        if (notification.createdAt) {
          const createdAt = new Date(notification.createdAt);
          const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000);
          const now = new Date();

          if (now >= expiryTime) {
            return 'expired';
          }
        }
        return 'pending';
      }
    }

    // Then check notification's own status
    if (notification.status) {
      const notifStatus = notification.status.toLowerCase().trim();

      if (notifStatus === 'completed') {
        return 'completed';
      }
      if (notifStatus === 'confirmed' || notifStatus === 'accepted') {
        return 'confirmed';
      }
      if (notifStatus === 'rejected' || notifStatus === 'cancelled') {
        return 'rejected';
      }

      // For pending, check time-based expiry
      if (notifStatus === 'pending' && notification.createdAt) {
        const createdAt = new Date(notification.createdAt);
        const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000);
        const now = new Date();

        if (now >= expiryTime) {
          return 'expired';
        }
        return 'pending';
      }

      return notifStatus;
    }

    return 'pending';
  };

  // Update statuses dynamically (for pending -> expired transition)
  const updateNotificationStatuses = useCallback(() => {
    setNotifications(prevNotifications => {
      const updated = prevNotifications.map(notification => {
        // Only recalculate for pending notifications
        if (notification.status === 'pending' && notification.createdAt) {
          const createdAt = new Date(notification.createdAt);
          const expiryTime = new Date(createdAt.getTime() + 2 * 60 * 1000);
          const now = new Date();

          if (now >= expiryTime) {
            return {
              ...notification,
              status: 'expired',
              timeAgo: timeAgo(notification.createdAt), // Update time ago as well
            };
          }
        }

        // Update timeAgo for all notifications
        return {
          ...notification,
          timeAgo: timeAgo(notification.createdAt),
        };
      });

      return updated;
    });
  }, []);

  // Load cache from AsyncStorage
  const loadCache = async () => {
    try {
      const cachedNotifs = await AsyncStorage.getItem(CACHE_KEY_NOTIFICATIONS);

      if (cachedNotifs) {
        const parsed = JSON.parse(cachedNotifs);
        setNotifications(parsed);
        setInitialLoad(false);
        cacheLoaded.current = true;
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const currentUserId = await AsyncStorage.getItem('userId');
      setUserId(currentUserId);
      if (!currentUserId) {
        setInitialLoad(false);
        return;
      }

      const result = await getNotifications(currentUserId);

      if (result?.success && result?.data?.length > 0) {
        const formattedNotifications = await Promise.all(
          result.data.map(async (n) => {
            let vehicleDetails = {};
            let bookingStatus = null;
            let hasReview = false;
            let vehicleId = null;
            let vehicleType = 'Car';

            if (n.type === 'chat_message') {
              // Chat notifications don't need booking status or vehicle specs —
              // ChatNotificationCard only shows vehicleName, which the backend
              // already saves directly on the notification. Skipping the
              // booking+vehicle fetch cascade here matters most because chat
              // is the highest-volume notification type.
              vehicleDetails = { vehicleName: n.vehicleName, ownerId: n.ownerId };
              vehicleId = n.vehicleId;
              vehicleType = n.vehicleType || 'Car';
            } else if (n.bookingId) {
              try {
                const bookingResult = await getBookingById(n.bookingId);

                if (bookingResult?.success && bookingResult?.data) {
                  const booking = bookingResult.data;

                  bookingStatus = booking.bookingStatus || booking.status;
                  hasReview = booking.hasReview || false;
                  vehicleId = booking.VechileId || booking.vehicleId || booking.carId || booking.bikeId || booking.vehicle?._id;

                  if (booking.vechileType || booking.vehicleType) {
                    vehicleType = booking.vechileType || booking.vehicleType;
                  } else if (booking.bikeId) {
                    vehicleType = 'Bike';
                  } else if (booking.carId) {
                    vehicleType = 'Car';
                  } else if (booking.autoId) {
                    vehicleType = 'Auto';
                  } else {
                    vehicleType = 'Car';
                  }

                  if (vehicleId) {
                    const vehicleResult = await getVehicleById(vehicleId, vehicleType);
                    if (vehicleResult?.success && vehicleResult?.data) {
                      const rawData = vehicleResult.data;
                      const vehicle = rawData.car || rawData.bike || rawData.auto || rawData;
                      vehicleDetails = {
                        vehicleName: vehicle.CarName || vehicle.carName || vehicle.bikeName || vehicle.name || 'Vehicle',
                        transmission: vehicle.transmissionType || vehicle.transmission || 'Automatic',
                        seats: vehicle.Carseater || vehicle.seats || vehicle.seatingCapacity || '5 Seaters',
                        fuelType: vehicle.fuelType || 'Petrol',
                        ownerId: vehicle.userId || vehicle.ownerId || vehicle.UserId,
                      };
                    }
                  }
                }
              } catch (err) {
                // Silent fail
              }
            }

            const finalStatus = calculateStatus(n, bookingStatus);

            return {
              id: n._id || n.id,
              type: n.type || 'booking',
              title: n.title || 'Notification',
              message: n.message || n.messages || n.body || '',
              read: n.seen ?? false,
              senderId: n.ownerId, // for chat_message notifications: who sent it
              timeAgo: timeAgo(n.createdAt),
              vehicleName: vehicleDetails.vehicleName || n.vehicleName || 'Vehicle',
              transmission: vehicleDetails.transmission || 'Automatic',
              seats: vehicleDetails.seats || '5 Seaters',
              fuelType: vehicleDetails.fuelType || 'Petrol',
              bookingId: n.bookingId,
              isOwner: vehicleDetails.ownerId === currentUserId,
              createdAt: n.createdAt,
              status: finalStatus,
              hasReview: hasReview,
              vehicleId: vehicleId || n.vehicleId,
              vehicleType: vehicleType,
            };
          })
        );

        // De-dupe exact repeats (same notification id fetched twice), never by
        // bookingId — a booking legitimately gets more than one notification
        // over its lifetime (request sent, confirmed, chat messages, ...).
        const uniqueNotifications = [];
        const seenIds = new Set();
        for (const notification of formattedNotifications) {
          if (notification.id && seenIds.has(notification.id)) continue;
          if (notification.id) seenIds.add(notification.id);
          uniqueNotifications.push(notification);
        }
        uniqueNotifications.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        setNotifications(uniqueNotifications);
        await AsyncStorage.setItem(CACHE_KEY_NOTIFICATIONS, JSON.stringify(uniqueNotifications));
      } else {
        setNotifications([]);
        await AsyncStorage.setItem(CACHE_KEY_NOTIFICATIONS, JSON.stringify([]));
      }
    } catch (err) {
      setNotifications([]);
    } finally {
      setInitialLoad(false);
      setRefreshing(false);
    }
  };

  // Load cache first, then fetch fresh data
  useEffect(() => {
    if (initialFetchDone.current) return;
    initialFetchDone.current = true;

    // Load reviewed bookings first
    loadReviewedBookings();

    // Load cached notifications
    loadCache();

    setTimeout(() => {
      fetchNotifications();
    }, 100);
  }, []);

  // Set up interval to update statuses dynamically (every 10 seconds)
  useEffect(() => {
    statusUpdateInterval.current = setInterval(() => {
      updateNotificationStatuses();
    }, 10000); // Update every 10 seconds

    return () => {
      if (statusUpdateInterval.current) {
        clearInterval(statusUpdateInterval.current);
      }
    };
  }, [updateNotificationStatuses]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications().finally(() => setRefreshing(false));
  }, []);

  const handleMarkRead = (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
    markNotificationReadApi(notificationId);
  };

  const handleDelete = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    deleteNotificationApi(notificationId);
  };

  const handleMarkAllRead = () => {
    if (!userId) return;
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    markAllNotificationsReadApi(userId);
  };

  const handleClearAll = () => {
    if (!userId) return;
    setNotifications([]);
    clearAllNotificationsApi(userId);
  };

  const handleChatPress = (notification) => {
    handleMarkRead(notification.id);
    navigation.navigate('ChatScreen', {
      bookingId: notification.bookingId,
      receiverId: notification.senderId,
      customerId: notification.senderId,
      ownerId: notification.senderId,
      vehicleId: notification.vehicleId,
      vehicleInfo: notification.vehicleName,
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const categoryUnread = { bookings: 0, chats: 0, alerts: 0 };
  notifications.forEach(n => {
    if (!n.read) categoryUnread[getCategory(n)]++;
  });

  const visibleNotifications = filterTab === 'all'
    ? notifications
    : notifications.filter(n => getCategory(n) === filterTab);

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        onBackPress={handleBackPress}
        gradientColors={['#63C8FF', '#141248']}
      />

      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map(tab => {
            const count = tab.key === 'all' ? unreadCount : categoryUnread[tab.key];
            const active = filterTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilterTab(tab.key)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
                {count > 0 && (
                  <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
                    <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>
                      {count > 9 ? '9+' : count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {notifications.length > 0 && (
          <View style={styles.actionsRow}>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionButton}>
                <Icon name="checkmark-done" size={14} color={Colors.linkBlue} />
                <Text style={styles.actionButtonText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
              <Icon name="trash-outline" size={14} color={Colors.error} />
              <Text style={[styles.actionButtonText, { color: Colors.error }]}>Clear all</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {initialLoad ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        >
          {visibleNotifications.map((notification) => {
            if (notification.type === 'chat_message') {
              return (
                <ChatNotificationCard
                  key={notification.id}
                  title={notification.title}
                  message={notification.message}
                  vehicleName={notification.vehicleName}
                  timeAgo={notification.timeAgo}
                  read={notification.read}
                  onPress={() => handleChatPress(notification)}
                  onDeletePress={() => handleDelete(notification.id)}
                />
              );
            }

            // Show feedback card for customers only if:
            // 1. Status is completed
            // 2. No review exists (from backend)
            // 3. Not locally marked as reviewed
            // 4. User is NOT the owner (only customers can give feedback)
            const shouldShowFeedback =
              notification.status === 'completed' &&
              !notification.hasReview &&
              !reviewedBookings.has(notification.bookingId) &&
              !notification.isOwner;

            return (
              <TouchableOpacity
                key={notification.id}
                activeOpacity={0.95}
                onPress={() => !notification.read && handleMarkRead(notification.id)}
              >
                {/* Always show the booking notification card (ride completed for both owner and customer) */}
                <BookingNotificationCard
                  timeAgo={notification.timeAgo}
                  vehicleName={notification.vehicleName}
                  transmission={notification.transmission}
                  seats={notification.seats}
                  fuelType={notification.fuelType}
                  isOwner={notification.isOwner}
                  status={notification.status}
                  hasReview={notification.hasReview || reviewedBookings.has(notification.bookingId)}
                  vehicleType={notification.vehicleType}
                  onYesPress={() => {
                    setSelectedBooking(notification);
                    setModalAction('confirm');
                    setShowModal(true);
                  }}
                  onNoPress={() => {
                    setSelectedBooking(notification);
                    setModalAction('reject');
                    setShowModal(true);
                  }}
                />

                {/* Show feedback card only for customers (not owners) after ride is completed */}
                {shouldShowFeedback && (
                  <FeedbackNotificationCard
                    timeAgo={notification.timeAgo}
                    isOwner={notification.isOwner}
                    onFeedbackPress={() => {
                      setSelectedFeedbackBooking({
                        _id: notification.bookingId,
                        vehicleId: notification.vehicleId,
                        vehicleType: notification.vehicleType,
                      });
                      setShowFeedbackModal(true);
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}

          {/* Empty state */}
          {visibleNotifications.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filterTab === 'all' ? 'No notifications' : `No ${filterTab} yet`}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <BookingConfirmationModal
        visible={showModal}
        booking={selectedBooking}
        initialAction={modalAction}
        onClose={() => {
          setShowModal(false);
          setSelectedBooking(null);
        }}
        onSuccess={(action) => {
          if (selectedBooking) {
            setNotifications(prev => prev.map(n =>
              n.id === selectedBooking.id
                ? { ...n, status: action === 'confirm' || action === 'confirmed' ? 'confirmed' : 'rejected' }
                : n
            ));
          }
        }}
      />

      <FeedbackPopUp
        visible={showFeedbackModal}
        onClose={() => {
          setShowFeedbackModal(false);
          setSelectedFeedbackBooking(null);
        }}
        vehicleId={selectedFeedbackBooking?.vehicleId}
        bookingId={selectedFeedbackBooking?._id || selectedFeedbackBooking?.id}
        vehicleType={selectedFeedbackBooking?.vehicleType || 'Car'}
        onSuccess={async () => {
          if (selectedFeedbackBooking) {
            const bookingIdToUpdate = selectedFeedbackBooking._id || selectedFeedbackBooking.id;

            // Add to reviewed bookings set
            const newReviewedBookings = new Set(reviewedBookings);
            newReviewedBookings.add(bookingIdToUpdate);
            setReviewedBookings(newReviewedBookings);

            // Save to AsyncStorage
            await saveReviewedBookings(newReviewedBookings);

            // Update notifications state - mark as reviewed
            const updatedNotifications = notifications.map(n =>
              n.bookingId === bookingIdToUpdate
                ? { ...n, hasReview: true }
                : n
            );

            setNotifications(updatedNotifications);

            // Update cache
            await AsyncStorage.setItem(CACHE_KEY_NOTIFICATIONS, JSON.stringify(updatedNotifications));

            // Close modal
            setShowFeedbackModal(false);
            setSelectedFeedbackBooking(null);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  tabsRow: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEFF2',
    paddingBottom: Spacing.sm,
  },
  tabsScroll: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 8,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F2F5',
    marginRight: 8,
    gap: 6,
  },
  tabPillActive: {
    backgroundColor: '#141248',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabLabelActive: {
    color: Colors.white,
  },
  tabBadge: {
    minWidth: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.linkBlue,
    textAlign: 'center',
  },
  tabBadgeTextActive: {
    color: Colors.white,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.linkBlue,
  },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default NotificationScreen;
