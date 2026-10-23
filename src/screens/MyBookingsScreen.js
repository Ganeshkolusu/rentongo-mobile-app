import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { cancelBooking, getAllBookings, shouldMarkAsCompleted, transformBookings, updateBooking } from '../api/bookingApi';
import BookingCard from '../components/BookingCard';
import BookingOptionsPopup from '../components/BookingOptionsPopup';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { BorderRadius, hp, normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { handleBookingCompleted } from '../utils/bookingFlowHelper';

const MyBookingsScreen = ({ navigation }) => {
  const { userId, user } = useAuth();
  const [searchText, setSearchText] = useState('');
  const [showHeaderPopup, setShowHeaderPopup] = useState(false);
  const [headerPopupPosition, setHeaderPopupPosition] = useState({ top: 0, right: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // ✅ For pull-to-refresh
  const [error, setError] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const headerMoreRef = useRef(null);

  // ------------------------------------------------------------
  // ✅ FIX: Handle Android hardware back button properly
  // ------------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.replace('DashBoard'); // Go back safely
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  // Fetch bookings
  const fetchBookings = async (isRefreshing = false) => {
    // Use userId from context, or fallback to user._id
    const idToUse = userId || user?._id || user?.userId;

    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      if (!idToUse) {
        setError('Please login to view bookings');
        if (!isRefreshing) setLoading(false);
        return;
      }

      const response = await getAllBookings(idToUse);

      if (response.success) {
        const transformed = response.data?.length
          ? transformBookings(response.data)
          : [];

        // Auto-update status from Confirmed to Completed if end date/time has passed
        const bookingsWithUpdatedStatus = await Promise.all(
          transformed.map(async (booking) => {
            // Check if booking should be marked as completed
            if (shouldMarkAsCompleted(booking.rawBooking)) {
              // Update status in backend
              const updateResult = await updateBooking(booking.id, {
                status: 'Completed',
                bookingStatus: 'Completed'
              });

              if (updateResult.success) {
                // Send completion notification to customer with default sound
                const rawBooking = booking.rawBooking || {};
                const customerId = rawBooking.userId || rawBooking.customerId || rawBooking.customer_id;
                const vehicleName = booking.vehicleName || rawBooking.vehicleName || 'vehicle';

                if (customerId) {
                  handleBookingCompleted({
                    bookingId: booking.id,
                    customerId,
                    vehicleName
                  });
                }

                // Return booking with updated status
                return { ...booking, status: 'Completed' };
              } else {
                // Silent catch
              }
            }
            return booking;
          })
        );

        setBookings(bookingsWithUpdatedStatus);

      } else {
        setBookings([]);
      }
    } catch (err) {
      // Silent catch
      setBookings([]);
    } finally {
      if (!isRefreshing) {
        setLoading(false);
      }
    }
  };

  // ✅ Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBookings(true);
    setRefreshing(false);
  };

  useEffect(() => {
    const idToUse = userId || user?._id || user?.userId;
    if (idToUse) {
      fetchBookings();
    } else {
      setError('User not authenticated');
      setLoading(false);
    }
  }, [userId, user]);

  const getFilteredBookings = () => {
    if (searchText) {
      return bookings.filter(
        (b) =>
          b.title.toLowerCase().includes(searchText.toLowerCase()) ||
          b.status.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    return bookings;
  };

  const handleBookingPress = (booking) => {
    navigation.navigate('BookingHistoryScreen', {
      bookingId: booking.id,
      from: 'MyBookings',
      vehicle: booking.vehicleDetails,
    });
  };

  const handleBookingDelete = (booking) => {
    Alert.alert('Cancel Booking', `Cancel ${booking.title}?`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await cancelBooking(booking.id);
            if (result.success) {
              setBookings((prev) => prev.filter((b) => b.id !== booking.id));
              Alert.alert('✅ Cancelled', `${booking.title} booking cancelled`);
            }
          } catch (e) {
            Alert.alert('❌ Error', 'Failed to cancel booking');
          }
        },
      },
    ]);
  };

  const handleHeaderMorePress = () => {
    setHeaderPopupPosition({ top: hp(10), right: normalize(20) });
    setShowHeaderPopup(true);
  };

  const filtered = getFilteredBookings();

  return (
    <View style={styles.container}>
      <Header
        onBackPress={() => {
          navigation.replace('DashBoard');
        }}
        title="My Bookings"
        gradientColors={Colors.gradient.primary}
        showMoreButton={false}
        onMorePress={handleHeaderMorePress}
      />

      {/* 🔍 Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Image
            source={require('../assets/Icons/search.png')}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bookings..."
            placeholderTextColor={Colors.text.secondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* 📦 Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            filtered.length === 0 && styles.emptyScrollContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
              title="Pull to refresh"
              titleColor={Colors.text.secondary}
            />
          }
        >
          {filtered.length > 0 ? (
            <>
              <Text style={styles.bookingCount}>
                {filtered.length} {filtered.length === 1 ? 'Booking' : 'Bookings'}
              </Text>

              {/* ✅ Show first 5, then expand */}
              {(showAll ? filtered : filtered.slice(0, 5)).map((b) => (
                <BookingCard
                  key={b.id}
                  title={b.title}
                  date={b.dateRange || b.date}
                  status={b.status}
                  price={b.price}
                  unit={b.unit}
                  image={b.image}
                  type={b.type}
                  onDetails={() => handleBookingPress(b)}
                  onPress={() => handleBookingPress(b)}
                  onDelete={() => handleBookingDelete(b)}
                />
              ))}

              {/* ✅ See More / Less Centered Button */}
              {filtered.length > 5 && (
                <TouchableOpacity
                  style={styles.seeMoreContainer}
                  onPress={() => setShowAll((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seeMoreText}>
                    {showAll ? 'Show Less' : 'Show More'}
                  </Text>
                  <Ionicons
                    name={showAll ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.primary}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={require('../assets/Images/car.png')}
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? `No bookings match "${searchText}"`
                  : "You haven't made any bookings yet"}
              </Text>
              <Text style={styles.pullToRefreshHint}>
                Pull down to refresh
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <BookingOptionsPopup
        visible={showHeaderPopup}
        onClose={() => setShowHeaderPopup(false)}
        position={headerPopupPosition}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchSection: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.sm,
    paddingVertical: normalize(1),
    borderWidth: normalize(1),
    borderColor: '#E9ECEF',
  },
  searchIcon: {
    width: normalize(20),
    height: normalize(20),
    marginRight: Spacing.sm,
    tintColor: '#999',
  },
  searchInput: {
    flex: 1,
    fontSize: normalize(16),
    color: Colors.text.primary,
    paddingVertical: normalize(10),
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp(10) },
  loadingText: { marginTop: Spacing.md, fontSize: normalize(16), color: Colors.text.secondary },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: hp(15) },
  emptyScrollContent: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: hp(60) },
  bookingCount: { fontSize: normalize(14), color: Colors.text.secondary, marginBottom: Spacing.sm },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: hp(10) },
  emptyIcon: { width: wp(30), height: wp(30), marginBottom: Spacing.lg, opacity: 0.5, tintColor: Colors.text.secondary },
  emptyTitle: { fontSize: normalize(20), fontWeight: '600', color: Colors.text.primary, marginBottom: Spacing.sm },
  emptySubtitle: { fontSize: normalize(16), color: Colors.text.secondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
  pullToRefreshHint: {
    fontSize: normalize(13),
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
    opacity: 0.7,
  },

  // ✅ See More / Less Styles
  seeMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  seeMoreText: {
    color: Colors.activeTab,
    fontSize: normalize(15),
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
  },
});

export default MyBookingsScreen;
