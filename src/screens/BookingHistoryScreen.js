import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getAllBookings, getBookingById, getMyVehicleBookings, shouldMarkAsCompleted, updateBooking } from '../api/bookingApi';
import { handleBookingCompleted } from '../utils/bookingFlowHelper';
import BookingHistoryItem from '../components/BookingHistoryItem/BookingHistoryItem';
import GradientHeader from '../components/Header/GradientHeader';
import { API_ENDPOINTS, fetchData } from '../config/apiConfig';
import { Colors } from '../constants/Colors';
import { hp, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const BookingHistoryScreen = ({ navigation, route }) => {
  const { 
    from, 
    itemType, 
    bikeData, 
    carData, 
    vehicle, 
    bookingId,
    vehicleId,
    vehicleType,
    isOwnerView 
  } = route.params || {};

  // Determine current vehicle from various sources
  const extractedVehicle = vehicle?.vehicleDetails || vehicle;
  
  const currentVehicle =
    itemType === 'bike' ? bikeData :
    itemType === 'car' ? carData :
    extractedVehicle;

  const [bookingHistory, setBookingHistory] = useState([]);
  const [vehicleDetails, setVehicleDetails] = useState(currentVehicle || null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to fetch vehicle details by ID and type
  const fetchVehicleDetailsById = async (vehicleId, vehicleType) => {
    try {
      let endpoint = '';
      if (vehicleType === 'Car' || vehicleType === 'car') {
        endpoint = API_ENDPOINTS.GET_CAR_BY_ID(vehicleId);
      } else if (vehicleType === 'Bike' || vehicleType === 'bike') {
        endpoint = API_ENDPOINTS.GET_BIKE_BY_ID(vehicleId);
      } else if (vehicleType === 'Auto' || vehicleType === 'auto') {
        endpoint = API_ENDPOINTS.GET_AUTO_BY_ID(vehicleId);
      }

      if (!endpoint) return null;


      const response = await fetchData(endpoint);
      const vehicleData = response.data || response.car || response.bike || response.auto || response;


      return vehicleData;
    } catch (err) {

      return null;
    }
  };

  const fetchBookingHistory = async () => {
    try {
      setError(null);
      

      // SCENARIO 1: Coming from a specific booking (MyBookingsScreen)
      if (bookingId) {

        await fetchSingleBooking(bookingId);
        return;
      }

      // SCENARIO 2: Coming from vehicle card (ListedCarCard/ListedBikeCard) - show all bookings for this vehicle
      if ((vehicleId || currentVehicle?._id) && isOwnerView) {
        const targetVehicleId = vehicleId || currentVehicle?._id || currentVehicle?.id;

        await fetchVehicleBookings(targetVehicleId, vehicleType || itemType);
        return;
      }

      // If we reach here, we don't have enough information
      throw new Error('Booking information is missing. Please try again.');
      
    } catch (err) {

      setError(err.message || 'Failed to load booking details.');
      setBookingHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch a single booking by ID
  const fetchSingleBooking = async (bookingId) => {
    try {
      const result = await getBookingById(bookingId);

      if (result.success && result.data) {
        const booking = result.data;

        // Extract vehicle details from booking - prioritize API response
        let extractedVehicle = booking.vehicleDetails || booking.vehicle || booking.carDetails || booking.bikeDetails || booking.autoDetails;

        // Determine vehicle type from booking or route params
        let detectedVehicleType = booking.vechileType || booking.vehicleType || vehicleType || 'Car';
        if (itemType) {
          detectedVehicleType = itemType === 'bike' ? 'Bike' :
                                itemType === 'car' ? 'Car' :
                                itemType === 'auto' ? 'Auto' : 'Car';
        }

        // If no vehicle details in booking, try to fetch them from API
        if (!extractedVehicle) {
          const bookingVehicleId = booking.VechileId || booking.vehicleId;
          if (bookingVehicleId) {

            extractedVehicle = await fetchVehicleDetailsById(bookingVehicleId, detectedVehicleType);
          }

          // If still no vehicle details, use currentVehicle as fallback
          if (!extractedVehicle && currentVehicle) {
            extractedVehicle = currentVehicle;
          }
        }

        if (extractedVehicle) {
          setVehicleDetails(extractedVehicle);
        }

        const transformedBooking = await transformSingleBooking(
          booking,
          extractedVehicle,
          detectedVehicleType
        );

        setBookingHistory([transformedBooking]);
      } else {
        throw new Error(result.message || 'Booking not found');
      }
    } catch (error) {
      throw error;
    }
  };

  // Fetch all bookings for a specific vehicle (owner view)
  const fetchVehicleBookings = async (vehicleId, type) => {
    try {
      // Get current user ID from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || userData?.id;

      if (!userId) {
        throw new Error('User not found. Please login again.');
      }


      // Normalize vehicle type
      const normalizedType = (type || itemType || 'car').toLowerCase();
      const vehicleTypeAPI = normalizedType === 'bike' ? 'Bike' : 
                            normalizedType === 'car' ? 'Car' : 
                            normalizedType === 'auto' ? 'Auto' : 'Car';

      // METHOD 1: Try fetching with specific vehicle ID

      let result = await getMyVehicleBookings(userId, vehicleTypeAPI, vehicleId);


      // If Method 1 returns no results, try Method 2
      if (!result.success || !result.data || result.data.length === 0) {

        result = await getMyVehicleBookings(userId, vehicleTypeAPI, null);
        

      }

      // If Method 2 still returns nothing, try Method 3
      if (!result.success || !result.data || result.data.length === 0) {

        const allBookingsResult = await getAllBookings(userId);
        

        if (allBookingsResult.success && allBookingsResult.data?.length > 0) {
          // Log all vehicle IDs to see what we have
          

          // Filter for bookings where the vehicle matches
          const filtered = allBookingsResult.data.filter(booking => {
            const bookingVehicleId = booking.VechileId || booking.vehicleId || booking.vehicle?._id;
            const match = String(bookingVehicleId) === String(vehicleId);
            
            if (bookingVehicleId) {
            }
            
            return match;
          });
          
          result = {
            success: true,
            data: filtered,
            count: filtered.length
          };
          

        }
      }


      if (result.success && result.data && result.data.length > 0) {
        // Log all booking vehicle IDs to debug

        // Filter bookings for the specific vehicle with multiple checks
        const vehicleBookings = result.data.filter(booking => {
          // Extract booking object if it's nested
          const actualBooking = booking.booking || booking;
          
          // Try multiple possible vehicle ID fields
          const bookingVehicleId = 
            actualBooking.VechileId || 
            actualBooking.vehicleId || 
            actualBooking.vehicle?._id ||
            actualBooking.vehicle?.id ||
            booking.VechileId || 
            booking.vehicleId ||
            booking.vehicle?._id ||
            booking.vehicle?.id;

          // Compare as strings to handle type mismatches
          const match = String(bookingVehicleId) === String(vehicleId);
          

          return match;
        });


        if (vehicleBookings.length === 0) {

          setBookingHistory([]);
          setError('No bookings found for this vehicle yet.');
          return;
        }

        // Transform all bookings
        const transformedBookings = await Promise.all(
          vehicleBookings.map(async (booking) => {
            // Extract the actual booking if nested
            const actualBooking = booking.booking || booking;
            return await transformSingleBooking(actualBooking, currentVehicle, normalizedType);
          })
        );

        // Sort by date (newest first)
        transformedBookings.sort((a, b) => {
          const dateA = new Date(a.rawBooking?.FromDate || a.rawBooking?.startDate || 0);
          const dateB = new Date(b.rawBooking?.FromDate || b.rawBooking?.startDate || 0);
          return dateB - dateA;
        });


        setBookingHistory(transformedBookings);
      } else {

        setBookingHistory([]);
        setError('No bookings found for this vehicle yet.');
      }
    } catch (error) {

      throw new Error(error.message || 'Failed to load booking history for this vehicle.');
    }
  };

  const transformSingleBooking = async (booking, vehicle, vehicleType) => {
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Extract actual times from booking - use FromTime/ToTime directly
    const fromTime = booking.FromTime || booking.fromTime || 'N/A';
    const toTime = booking.ToTime || booking.toTime || 'N/A';

    // Check if booking should be auto-completed
    let bookingStatus = booking.status || booking.bookingStatus || 'Pending';

    if (shouldMarkAsCompleted(booking)) {
      // Update status in backend
      const updateResult = await updateBooking(booking._id || booking.id, {
        status: 'Completed',
        bookingStatus: 'Completed'
      });

      if (updateResult.success) {
        bookingStatus = 'Completed';

        // Send completion notification to customer with default sound
        const customerId = booking.userId?._id || booking.userId || booking.customerId || booking.customer_id;
        const vehicleName = vehicle?.modelName || vehicle?.brandName || booking.vehicleName || 'vehicle';

        if (customerId) {
          handleBookingCompleted({
            bookingId: booking._id || booking.id,
            customerId,
            vehicleName
          });
        }
      }
    }

    const transformed = {
      id: booking._id || booking.id,
      customerName: booking.userName ||
                   booking.userId?.name ||
                   booking.user?.name ||
                   booking.contactName ||
                   'Customer',
      fromDate: formatDate(booking.FromDate || booking.startDate || booking.fromDate),
      toDate: formatDate(booking.ToDate || booking.endDate || booking.toDate),
      // Use actual times from booking, not formatted from date
      fromTime: fromTime,
      toTime: toTime,
      FromTime: fromTime,
      ToTime: toTime,
      mobileNo: booking.userMobile ||
               booking.userId?.mobile ||
               booking.user?.mobile ||
               booking.contactNumber ||
               booking.phoneNumber ||
               'N/A',
      status: bookingStatus,
      type: vehicleType?.toLowerCase() || itemType,
      vehicleType: booking.vechileType || vehicleType,
      vehicleDetails: vehicle,
      pickupLocation: booking.pickupLocation || booking.location,
      totalPrice: booking.totalPrice || booking.price || booking.amount || booking.TotalAmount,
      totalHours: booking.totalHours || booking.hours,
      pricePerDay: booking.pricePerDay || booking.RentPerDay,
      pricePerHour: booking.pricePerHour || booking.RentPerHour,
      pricePerKm: booking.pricePerKm || booking.RentPerKm,
      rawBooking: booking,
    };

    return transformed;
  };

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookingHistory();
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        onBackPress={() => navigation.goBack()}
        showVehicleCard={true}
        vehicle={vehicleDetails}
        bookingId={bookingId}
        showBackButton={true}
        showMoreButton={false}
        gradientColors={['#63C8FF', '#141248']}
        compactCard={true}
      />
      
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary || '#4A90E2'} />
          <Text style={styles.loadingText}>Loading booking details...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookingHistory}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : bookingHistory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No bookings found</Text>
          <Text style={styles.emptySubText}>
            {isOwnerView 
              ? 'This vehicle has no booking history yet.' 
              : 'No booking details available.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.activeTab || '#4A90E2']}
            />
          }
        >
          <View style={styles.historyContainer}>
            {isOwnerView && bookingHistory.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {bookingHistory.length} Booking{bookingHistory.length !== 1 ? 's' : ''} Found
                </Text>
              </View>
            )}
            
            {bookingHistory.map((item, index) => (
              <BookingHistoryItem
                key={item.id || index}
                item={item}
                navigation={navigation}
                from={isOwnerView ? 'viewHistory' : 'myBookings'}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(5),
  },
  historyContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  countBadge: {
    backgroundColor: Colors.primary || '#4A90E2',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: normalize(20),
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  countText: {
    color: Colors.white,
    fontSize: normalize(12),
    fontWeight: Typography.fontWeight.semiBold,
    fontFamily: Typography.fontFamily.semiBold,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: normalize(14),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  errorText: {
    fontSize: normalize(14),
    color: Colors.error || '#E53935',
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: normalize(16),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: normalize(13),
    color: Colors.text.tertiary || '#999',
    fontFamily: Typography.fontFamily.regular,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  retryButton: {
    backgroundColor: Colors.primary || '#4A90E2',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: normalize(8),
    marginTop: Spacing.sm,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: normalize(14),
    fontFamily: Typography.fontFamily.semiBold,
    fontWeight: Typography.fontWeight.semiBold,
  },
});

export default BookingHistoryScreen;