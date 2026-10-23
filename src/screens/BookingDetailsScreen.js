import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { getAutoById } from '../api/autoApi';
import { getBookingById, updateBooking } from '../api/bookingApi';
import { getBikeById } from '../api/services/bikeService';
import { getCarById } from '../api/services/carService';
import Header from '../components/Header/Header';
import LiveTrackingMap from '../components/LiveTrackingMap';
import ShareLocationButton from '../components/ShareLocationButton';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateDistance, getCurrentLocation } from '../utils/location';

const SELECTED_LOCATION_KEY = 'selectedUserLocation';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();
  const currentUserId = user?.userId || user?._id || user?.id;
  const insets = useSafeAreaInsets();

  // Calculate bottom padding for Android navigation bar
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 60) : insets.bottom;

  const { item, from } = route.params;

  // Determine if this is owner view (from ViewHistoryBookings) or customer view (from MyBookings)
  const isOwnerView = from === 'viewHistory' || from === 'BookingHistoryScreen';
  const isCustomerView = from === 'myBookings' || from === 'MyBookingsScreen' || !from;

  const [booking, setBooking] = useState(item || null);
  const [vehicle, setVehicle] = useState(item?.vehicleDetails || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [fetchingOwner, setFetchingOwner] = useState(false);
  const [distanceToVehicle, setDistanceToVehicle] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    const bookingId = item?.id || item?._id || item?.rawBooking?._id;
    if (bookingId) fetchBookingDetails(bookingId);
  }, [item?.id, item?._id, item?.rawBooking?._id]);

  // Function to calculate distance - reusable
  const calculateVehicleDistance = useCallback(async () => {
    try {
      // Get vehicle pickup coordinates from multiple possible sources - use item directly for immediate access
      const vehicleData = item?.vehicleDetails || item?.rawBooking?.vehicleDetails || vehicle;
      const bookingData = item?.rawBooking || item || booking;

      let vehicleLat = parseFloat(
        vehicleData?.pickupLatitude ||
        vehicleData?.latitude ||
        vehicleData?.Latitude ||
        bookingData?.pickupLatitude ||
        bookingData?.latitude ||
        bookingData?.Latitude ||
        item?.pickupLatitude ||
        item?.latitude
      );
      let vehicleLon = parseFloat(
        vehicleData?.pickupLongitude ||
        vehicleData?.longitude ||
        vehicleData?.Longitude ||
        bookingData?.pickupLongitude ||
        bookingData?.longitude ||
        bookingData?.Longitude ||
        item?.pickupLongitude ||
        item?.longitude
      );

      // First try to get the selected location from AsyncStorage (user's chosen location in app)
      let userLat = null;
      let userLon = null;

      try {
        const savedLocation = await AsyncStorage.getItem(SELECTED_LOCATION_KEY);
        if (savedLocation) {
          const parsedLocation = JSON.parse(savedLocation);
          if (parsedLocation?.latitude && parsedLocation?.longitude) {
            userLat = parsedLocation.latitude;
            userLon = parsedLocation.longitude;
          }
        }
      } catch {
        // Silent fail - will fall back to GPS
      }

      // If no saved location, fall back to GPS current location
      if (!userLat || !userLon) {
        const currentLocation = await getCurrentLocation();
        if (currentLocation?.latitude && currentLocation?.longitude) {
          userLat = currentLocation.latitude;
          userLon = currentLocation.longitude;
        }
      }

      // If coordinates not found, try to fetch from vehicle API
      if (!vehicleLat || !vehicleLon || isNaN(vehicleLat) || isNaN(vehicleLon)) {
        const vehicleId = bookingData?.VechileId || bookingData?.vehicleId || item?.VechileId || item?.vehicleId;
        const vehicleType = (bookingData?.vechileType || bookingData?.vehicleType || item?.vechileType || item?.vehicleType || '').toLowerCase();

        if (vehicleId && vehicleType) {
          try {
            let vehicleResponse;
            if (vehicleType === 'car') {
              vehicleResponse = await getCarById(vehicleId);
            } else if (vehicleType === 'bike') {
              vehicleResponse = await getBikeById(vehicleId);
            } else if (vehicleType === 'auto') {
              vehicleResponse = await getAutoById(vehicleId);
            }

            const fetchedVehicle = vehicleResponse?.data?.car || vehicleResponse?.data?.bike || vehicleResponse?.data?.auto || vehicleResponse?.data;
            if (fetchedVehicle) {
              vehicleLat = parseFloat(fetchedVehicle.pickupLatitude || fetchedVehicle.latitude);
              vehicleLon = parseFloat(fetchedVehicle.pickupLongitude || fetchedVehicle.longitude);
            }
          } catch {
            // Silent fail
          }
        }
      }

      if (!vehicleLat || !vehicleLon || isNaN(vehicleLat) || isNaN(vehicleLon)) {
        return;
      }

      if (userLat && userLon) {
        const distance = calculateDistance(
          userLat,
          userLon,
          vehicleLat,
          vehicleLon
        );
        setDistanceToVehicle(distance);
        setUserLocation({
          latitude: userLat,
          longitude: userLon,
        });
        setVehicleLocation({
          latitude: vehicleLat,
          longitude: vehicleLon,
        });
      }
    } catch (error) {
      // Silent fail - distance is optional
    }
  }, [item, vehicle, booking]);

  // Calculate distance on mount
  useEffect(() => {
    calculateVehicleDistance();
  }, [calculateVehicleDistance]);

  // Recalculate distance when screen comes back into focus (e.g., returning from Google Maps)
  useFocusEffect(
    useCallback(() => {
      calculateVehicleDistance();
    }, [calculateVehicleDistance])
  );

  const fetchBookingDetails = async (bookingId) => {
    try {
      setLoading(true);
      setError(null);

      const result = await getBookingById(bookingId);

      if (result.success && result.data) {
        const bookingData = result.data;

        const vehicleData =
          bookingData.vehicleDetails ||
          bookingData.vehicle ||
          bookingData.vehicleId ||
          bookingData.carId ||
          bookingData.bikeId ||
          bookingData.autoId;

        setVehicle(vehicleData || null);
        setBooking({
          ...item,
          ...bookingData,
          vehicleDetails: vehicleData,
        });
      } else {
        setError(result.message || 'Failed to load booking details');
      }
    } catch (err) {
      setError('Error loading booking details');
    } finally {
      setLoading(false);
    }
  };

  const displayData = booking || item;
  const trackingBookingId = displayData?.id || displayData?._id || displayData?.rawBooking?._id;

  // ✅ Mask phone number function
  const maskPhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return 'XXXXXXXXXX';
    const phone = String(phoneNumber);
    if (phone.length < 2) return 'XXXXXXXXXX';
    return 'XXXXXXXX' + phone.slice(-2);
  };

  // ✅ Check if actions (Chat/Call) are allowed based on status
  const isActionsAllowed = () => {
    const status = displayData?.status?.toLowerCase();
    // Only allow when status is 'confirmed' or 'booked'
    return status === 'confirmed' || status === 'booked';
  };

  // ✅ Check if booking can be cancelled
  const canCancelBooking = () => {
    const status = displayData?.status?.toLowerCase();
    // Allow cancel for pending or confirmed bookings
    return status === 'pending' || status === 'confirmed';
  };

  // ✅ Handle cancel booking
  const handleCancelBooking = () => {
    setShowMenu(false);

    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              const bookingId = displayData?.id || displayData?._id || displayData?.rawBooking?._id;

              if (!bookingId) {
                showError('Booking ID not found');
                return;
              }

              const result = await updateBooking(bookingId, { status: 'Cancelled' });

              if (result.success) {
                showSuccess('The booking has been cancelled successfully.');
                navigation.goBack();
              } else {
                showError(result.message || 'Failed to cancel booking');
              }
            } catch (error) {
              showError('An error occurred while cancelling the booking');
            } finally {
              setIsCancelling(false);
            }
          }
        }
      ]
    );
  };

  // ✅ Handle update booking (customer only)
  const handleUpdateBooking = async () => {
    setShowMenu(false);

    const vehicleType = (displayData?.vehicleType || displayData?.vechileType || displayData?.type || 'Car').toLowerCase();
    const vehicleId = vehicle?._id || vehicle?.id || displayData?.vehicleId || displayData?.VechileId;

    if (!vehicleId) {
      showError('Vehicle information not found');
      return;
    }

    try {
      // Show loading overlay
      setLoading(true);

      // Fetch fresh vehicle data from API
      let vehicleResponse;
      let vehicleData = null;

      if (vehicleType === 'car') {
        vehicleResponse = await getCarById(vehicleId);
      } else if (vehicleType === 'bike') {
        vehicleResponse = await getBikeById(vehicleId);
      } else if (vehicleType === 'auto') {
        vehicleResponse = await getAutoById(vehicleId);
      }

      // Extract vehicle data from response
      if (vehicleResponse?.success && vehicleResponse?.data) {
        vehicleData = vehicleResponse.data;
      } else if (vehicleResponse?.data) {
        vehicleData = vehicleResponse.data;
      } else if (vehicleResponse && typeof vehicleResponse === 'object') {
        vehicleData = vehicleResponse;
      }

      // Handle nested response structure
      const actualVehicleData = vehicleData?.car || vehicleData?.bike || vehicleData?.auto || vehicleData;

      if (!actualVehicleData) {
        showError('Could not load vehicle details. Please try again.');
        setLoading(false);
        return;
      }

      setLoading(false);

      // Navigate with fresh vehicle data
      if (vehicleType === 'car') {
        navigation.navigate('CarDetailsScreen', {
          car: actualVehicleData,
          carId: vehicleId,
          fromBookingUpdate: true,
          oldBookingId: displayData?.id || displayData?._id
        });
      } else if (vehicleType === 'bike') {
        navigation.navigate('BikeDetailsScreen', {
          bike: actualVehicleData,
          bikeId: vehicleId,
          fromBookingUpdate: true,
          oldBookingId: displayData?.id || displayData?._id
        });
      } else if (vehicleType === 'auto') {
        navigation.navigate('AutoDetailsScreen', {
          auto: actualVehicleData,
          autoId: vehicleId,
          fromBookingUpdate: true,
          oldBookingId: displayData?.id || displayData?._id
        });
      }
    } catch (error) {
      setLoading(false);
      showError('Failed to load vehicle details. Please try again.');
    }
  };

  // ✅ Open Google Maps with directions (shows route line from current location to vehicle)
  const openInGoogleMaps = () => {
    if (!userLocation || !vehicleLocation) {
      showError('Location data not available');
      return;
    }

    const { latitude: userLat, longitude: userLng } = userLocation;
    const { latitude: vehicleLat, longitude: vehicleLng } = vehicleLocation;

    if (Platform.OS === 'ios') {
      // iOS: Try Google Maps app first, fallback to Apple Maps
      const googleMapsUrl = `comgooglemaps://?saddr=${userLat},${userLng}&daddr=${vehicleLat},${vehicleLng}&directionsmode=driving`;
      const appleMapsUrl = `maps://app?saddr=${userLat},${userLng}&daddr=${vehicleLat},${vehicleLng}&dirflg=d`;

      Linking.canOpenURL(googleMapsUrl)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(googleMapsUrl);
          } else {
            return Linking.openURL(appleMapsUrl);
          }
        })
        .catch(() => {
          Linking.openURL(appleMapsUrl);
        });
    } else {
      // Android: Use Google Maps directions URL - this format shows the route line
      const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${vehicleLat},${vehicleLng}`;

      Linking.openURL(url).catch(() => {
        showError('Could not open Google Maps');
      });
    }
  };

  // Navigate to CallScreen for in-app calling
  const handleCall = async () => {
    const bookingData = booking || item;
    const bookingId = bookingData?.id || bookingData?._id || bookingData?.rawBooking?._id;

    // Get customer information
    const customerId = bookingData?.userId || bookingData?.customerId || bookingData?.rawBooking?.userId || bookingData?.rawBooking?.customerId;
    const customerName = bookingData?.customerName || bookingData?.contactName || item?.customerName;
    const customerAvatar = bookingData?.customerAvatar || bookingData?.avatar;

    // Get owner information
    let ownerId = bookingData?.ownerId ||
                  bookingData?.vehicleDetails?.ownerId ||
                  bookingData?.vehicleDetails?.userId ||
                  vehicle?.ownerId ||
                  vehicle?.userId ||
                  bookingData?.rawBooking?.ownerId ||
                  bookingData?.vehicleOwnerId ||
                  bookingData?.owner ||
                  bookingData?.vehicleDetails?.owner;

    let ownerName = bookingData?.ownerName ||
                    bookingData?.vehicleDetails?.ownerName ||
                    vehicle?.ownerName ||
                    'Owner';

    // If ownerId is missing, try to fetch vehicle details
    if (!ownerId) {
      const vehicleId = bookingData?.VechileId || bookingData?.vehicleId || bookingData?.rawBooking?.VechileId;
      const vehicleType = (bookingData?.vechileType || bookingData?.vehicleType || bookingData?.rawBooking?.vechileType || '').toLowerCase();

      if (vehicleId && vehicleType) {
        setFetchingOwner(true);
        try {
          let vehicleResponse;
          if (vehicleType === 'car') {
            vehicleResponse = await getCarById(vehicleId);
          } else if (vehicleType === 'bike') {
            vehicleResponse = await getBikeById(vehicleId);
          } else if (vehicleType === 'auto') {
            vehicleResponse = await getAutoById(vehicleId);
          }

          let vehicleData = null;
          if (vehicleResponse?.success && vehicleResponse?.data) {
            vehicleData = vehicleResponse.data;
          } else if (vehicleResponse?.data) {
            vehicleData = vehicleResponse.data;
          } else if (vehicleResponse && typeof vehicleResponse === 'object') {
            vehicleData = vehicleResponse;
          }

          if (vehicleData) {
            const actualVehicleData = vehicleData.car || vehicleData.bike || vehicleData.auto || vehicleData;
            ownerId = actualVehicleData.userId || actualVehicleData.ownerId || actualVehicleData.UserId || actualVehicleData.user_id;
            ownerName = actualVehicleData.contactName || actualVehicleData.ownerName || actualVehicleData.owner_name || ownerName;
          }
        } catch (error) {
          // Silent catch
        } finally {
          setFetchingOwner(false);
        }
      }
    }

    // Validate we have required IDs
    if (!customerId) {
      showError('Customer information not available');
      return;
    }

    if (!ownerId) {
      showError('Owner information not available');
      return;
    }

    // Determine who to call based on who is viewing
    const receiverId = isOwnerView ? customerId : ownerId;
    const receiverName = isOwnerView ? (customerName || 'Customer') : (ownerName || 'Owner');
    const receiverAvatar = isOwnerView ? customerAvatar : null;

    // Navigate to CallScreen
    navigation.navigate('CallScreen', {
      callType: 'audio',
      isIncoming: false,
      receiverId,
      receiverName,
      receiverAvatar,
      bookingId,
    });
  };

  const handleChat = async () => {
    const bookingData = booking || item;
    const bookingId = bookingData?.id || bookingData?._id || bookingData?.rawBooking?._id;

    const customerId = bookingData?.userId || bookingData?.customerId || bookingData?.rawBooking?.userId || bookingData?.rawBooking?.customerId;

    let ownerId = bookingData?.ownerId ||
                  bookingData?.vehicleDetails?.ownerId ||
                  bookingData?.vehicleDetails?.userId ||
                  vehicle?.ownerId ||
                  vehicle?.userId ||
                  bookingData?.rawBooking?.ownerId ||
                  bookingData?.vehicleOwnerId ||
                  bookingData?.owner ||
                  bookingData?.vehicleDetails?.owner;

    // Get customer name from multiple sources
    const customerName = bookingData?.customerName ||
                         bookingData?.contactName ||
                         bookingData?.rawBooking?.customerName ||
                         bookingData?.rawBooking?.contactName ||
                         bookingData?.userDetails?.name ||
                         bookingData?.user?.name ||
                         item?.customerName ||
                         item?.rawBooking?.customerName ||
                         null;

    // Get owner name from multiple sources
    let ownerName = bookingData?.ownerName ||
                    bookingData?.vehicleOwnerName ||
                    bookingData?.vehicleDetails?.ownerName ||
                    bookingData?.vehicleDetails?.contactName ||
                    bookingData?.vehicleDetails?.ContactName ||
                    bookingData?.rawBooking?.ownerName ||
                    bookingData?.rawBooking?.vehicleOwnerName ||
                    bookingData?.rawBooking?.vehicleDetails?.contactName ||
                    vehicle?.ownerName ||
                    vehicle?.contactName ||
                    vehicle?.ContactName ||
                    item?.ownerName ||
                    item?.vehicleOwnerName ||
                    item?.vehicleDetails?.contactName ||
                    item?.vehicleDetails?.ownerName ||
                    item?.rawBooking?.vehicleDetails?.contactName ||
                    null;

    // If ownerId or ownerName is missing, try to fetch vehicle details
    if (!ownerId || !ownerName) {
      const vehicleId = bookingData?.VechileId || bookingData?.vehicleId || bookingData?.rawBooking?.VechileId;
      const vehicleType = (bookingData?.vechileType || bookingData?.vehicleType || bookingData?.rawBooking?.vechileType || '').toLowerCase();

      if (vehicleId && vehicleType) {
        setFetchingOwner(true);

        try {
          let vehicleResponse;

          if (vehicleType === 'car') {
            vehicleResponse = await getCarById(vehicleId);
          } else if (vehicleType === 'bike') {
            vehicleResponse = await getBikeById(vehicleId);
          } else if (vehicleType === 'auto') {
            vehicleResponse = await getAutoById(vehicleId);
          }

          let vehicleData = null;

          if (vehicleResponse?.success && vehicleResponse?.data) {
            vehicleData = vehicleResponse.data;
          } else if (vehicleResponse?.data) {
            vehicleData = vehicleResponse.data;
          } else if (vehicleResponse && typeof vehicleResponse === 'object') {
            vehicleData = vehicleResponse;
          }

          if (vehicleData) {
            const actualVehicleData = vehicleData.car || vehicleData.bike || vehicleData.auto || vehicleData;

            ownerId = actualVehicleData.userId || actualVehicleData.ownerId || actualVehicleData.UserId || actualVehicleData.user_id;
            // Get owner name from contactName (this is where it's stored when listing a vehicle)
            if (!ownerName) {
              ownerName = actualVehicleData.contactName || actualVehicleData.ownerName || actualVehicleData.owner_name || actualVehicleData.ContactName;
            }
          }
        } catch (error) {
          // Silent catch
        } finally {
          setFetchingOwner(false);
        }
      }
    }

    // Validate we have required IDs
    if (!customerId) {
      showError('Customer information not available for chat');
      return;
    }

    if (!ownerId) {
      showError('Owner information not available. Please try refreshing the booking details.');
      return;
    }

    // Determine receiverId based on who is viewing
    const receiverId = isOwnerView ? customerId : ownerId;

    // Get vehicleId for customer message fetching
    const vehicleId = bookingData?.VechileId || bookingData?.vehicleId || bookingData?.rawBooking?.VechileId;

    navigation.navigate('ChatScreen', {
      bookingId,
      vehicleId,
      receiverId,
      ownerId,
      customerId,
      customerName: customerName || 'Customer',
      ownerName: ownerName || 'Owner',
      vehicleInfo: bookingData?.vehicleDetails?.CarName || bookingData?.vehicleDetails?.bikeName || vehicle?.CarName || vehicle?.bikeName || 'Vehicle',
    });
  };

  const fromTime =
    displayData?.rawBooking?.FromTime ||
    displayData?.rawBooking?.fromTime ||
    displayData?.FromTime ||
    displayData?.fromTime ||
    item?.rawBooking?.FromTime ||
    item?.rawBooking?.fromTime ||
    item?.FromTime ||
    item?.fromTime ||
    'N/A';

  const toTime =
    displayData?.rawBooking?.ToTime ||
    displayData?.rawBooking?.toTime ||
    displayData?.ToTime ||
    displayData?.toTime ||
    item?.rawBooking?.ToTime ||
    item?.rawBooking?.toTime ||
    item?.ToTime ||
    item?.toTime ||
    'N/A';

  if (loading && !displayData) {
    return (
      <View style={styles.centerContainer}>
        <Header
          title={'Booking Details'}
          onBackPress={() => navigation.goBack()}
          useGradient
          gradientColors={Colors.gradient.primary}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>{'Loading'}...</Text>
      </View>
    );
  }

  if (error && !displayData) {
    return (
      <View style={styles.centerContainer}>
        <Header
          title={'Booking Details'}
          onBackPress={() => navigation.goBack()}
          useGradient
          gradientColors={Colors.gradient.primary}
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => fetchBookingDetails(item?.id || item?._id)}
        >
          <Text style={styles.retryButtonText}>{'Try Again'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={'Booking Details'}
        onBackPress={() => navigation.goBack()}
        useGradient
        gradientColors={Colors.gradient.primary}
      />

      {/* Customer Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuItem, !canCancelBooking() && styles.menuItemDisabled]}
              onPress={canCancelBooking() ? handleUpdateBooking : null}
              disabled={!canCancelBooking()}
            >
              <Icon name="calendar-outline" size={20} color={canCancelBooking() ? Colors.primary : '#CCCCCC'} />
              <Text style={[styles.menuItemText, !canCancelBooking() && styles.menuItemTextDisabled]}>
                Update Booking
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={[styles.menuItem, !canCancelBooking() && styles.menuItemDisabled]}
              onPress={canCancelBooking() ? handleCancelBooking : null}
              disabled={!canCancelBooking()}
            >
              <Icon name="close-circle-outline" size={20} color={canCancelBooking() ? (Colors.error || '#E53935') : '#CCCCCC'} />
              <Text style={[styles.menuItemText, { color: canCancelBooking() ? (Colors.error || '#E53935') : '#CCCCCC' }]}>
                Cancel Booking
              </Text>
            </TouchableOpacity>

            {!canCancelBooking() && (
              <Text style={styles.menuDisabledHint}>
                Actions not available for {displayData?.status} bookings
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Loading overlay when cancelling */}
      {isCancelling && (
        <View style={styles.cancellingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.cancellingText}>Cancelling booking...</Text>
        </View>
      )}

      {/* Loading overlay when fetching owner info */}
      {fetchingOwner && (
        <View style={styles.cancellingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.cancellingText}>Loading chat information...</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.card}>
          <View style={styles.customerHeader}>
            <Image
              source={require('../assets/Icons/phone_outline.png')}
              style={styles.phoneIcon}
            />
            <Text style={styles.customerName}>
              {displayData?.customerName || 'Customer'}
            </Text>
            {/* 3 dots menu for customer view */}
            {isCustomerView && (
              <TouchableOpacity
                onPress={() => setShowMenu(true)}
                style={styles.cardMenuButton}
              >
                <Icon name="ellipsis-vertical" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
            {/* Trash icon for owner view */}
            {isOwnerView && (
              <TouchableOpacity
                onPress={canCancelBooking() ? handleCancelBooking : null}
                style={styles.cardMenuButton}
                disabled={isCancelling || !canCancelBooking()}
              >
                <Icon
                  name="trash-outline"
                  size={20}
                  color={canCancelBooking() ? (Colors.error || '#E53935') : '#CCCCCC'}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Booking period */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Booking Period'}</Text>
            <View style={styles.infoRow}>
              <Image
                source={require('../assets/Icons/inactive_mybookings.png')}
                style={styles.icon}
              />
              <Text style={styles.value}>
                {'From'}: {displayData?.fromDate || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Image
                source={require('../assets/Icons/inactive_mybookings.png')}
                style={styles.icon}
              />
              <Text style={styles.value}>{'To'}: {displayData?.toDate || 'N/A'}</Text>
            </View>
          </View>

          {/* Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Timing'}</Text>
            <View style={styles.infoRow}>
              <Icon name="time-outline" size={normalize(20)} color={Colors.text.secondary} />
              <Text style={styles.value}>{'From'}: {fromTime}</Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="time-outline" size={normalize(20)} color={Colors.text.secondary} />
              <Text style={styles.value}>{'To'}: {toTime}</Text>
            </View>
          </View>

          {/* Contact - MASKED PHONE NUMBER */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Contact Information'}</Text>
            <View style={styles.infoRow}>
              <Icon name="call-outline" size={normalize(20)} color={Colors.text.secondary} />
              <Text style={styles.value}>
                {maskPhoneNumber(displayData?.mobileNo)}
              </Text>
            </View>
          </View>

          {/* Pickup Location */}
          {displayData?.pickupLocation && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{'Pickup Location'}</Text>
              <View style={styles.infoRow}>
                <Icon name="location-outline" size={normalize(20)} color={Colors.text.secondary} />
                <Text style={styles.value}>{displayData.pickupLocation}</Text>
              </View>
            </View>
          )}

          {/* Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Booking Status'}</Text>
            <View
              style={[
                styles.statusBadge,
                displayData?.status === 'Confirmed' && styles.statusConfirmed,
                displayData?.status === 'Pending' && styles.statusPending,
                (displayData?.status === 'Cancelled' ||
                  displayData?.status === 'AutoCancelled') &&
                  styles.statusCancelled,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  displayData?.status === 'Confirmed' && styles.statusTextConfirmed,
                  displayData?.status === 'Pending' && styles.statusTextPending,
                  (displayData?.status === 'Cancelled' ||
                    displayData?.status === 'AutoCancelled') &&
                    styles.statusTextCancelled,
                ]}
              >
                {displayData?.status || 'Pending'}
              </Text>
            </View>
          </View>

          {/* Live Location Sharing/Tracking - Only for Confirmed bookings */}
          {displayData?.status === 'Confirmed' && (
            <View style={styles.section}>
              {isCustomerView && (
                <TouchableOpacity
                  style={styles.trackButton}
                  onPress={() => setShowTrackingModal(true)}
                >
                  <Icon name="navigate-circle-outline" size={normalize(18)} color={Colors.white} />
                  <Text style={styles.trackButtonText}>Track Owner's Live Location</Text>
                </TouchableOpacity>
              )}
              {isOwnerView && trackingBookingId && currentUserId && (
                <ShareLocationButton bookingId={trackingBookingId} ownerId={currentUserId} />
              )}
            </View>
          )}

          {/* Distance to Vehicle - Only for Confirmed bookings and Customer view */}
          {distanceToVehicle !== null && displayData?.status === 'Confirmed' && isCustomerView && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{'Distance to Vehicle'}</Text>
              <View style={styles.distanceRow}>
                <Icon name="navigate-outline" size={normalize(18)} color={Colors.primary} />
                <Text style={styles.distanceText}>
                  {distanceToVehicle < 1
                    ? `${Math.round(distanceToVehicle * 1000)} m away from your location`
                    : `${distanceToVehicle.toFixed(1)} km away from your location`}
                </Text>
              </View>
              {userLocation && vehicleLocation && (
                <TouchableOpacity
                  style={styles.viewMapButton}
                  onPress={openInGoogleMaps}
                >
                  <Icon name="map-outline" size={normalize(16)} color={Colors.white} />
                  <Text style={styles.viewMapButtonText}>View on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Chat Button */}
          <TouchableOpacity
            style={styles.actionButtonWrapper}
            activeOpacity={0.8}
            onPress={handleChat}
            disabled={!isActionsAllowed()}
          >
            <LinearGradient
              colors={isActionsAllowed() 
                ? Colors.gradient.primary 
                : ['#CCCCCC', '#999999']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.actionButton, 
                styles.gradientButton,
                !isActionsAllowed() && styles.disabledButton
              ]}
            >
              <Icon 
                name="chatbubble-outline"
                size={normalize(20)} 
                color={isActionsAllowed() ? Colors.white : '#666666'} 
              />
              <Text style={[
                styles.actionButtonText,
                !isActionsAllowed() && styles.disabledButtonText
              ]}>
                {'Chat'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Call Button - TEMPORARILY DISABLED */}
          <TouchableOpacity
            style={styles.actionButtonWrapper}
            activeOpacity={0.8}
            onPress={() => {}}
            disabled={true}
          >
            <LinearGradient
              colors={['#CCCCCC', '#999999']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={[
                styles.actionButton,
                styles.gradientButton,
                styles.disabledButton
              ]}
            >
              <Icon
                name="call-outline"
                size={normalize(20)}
                color={'#666666'}
              />
              <Text style={[
                styles.actionButtonText,
                !isActionsAllowed() && styles.disabledButtonText
              ]}>
                {'Call'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Info message when buttons are disabled */}
        {!isActionsAllowed() && (
          <View style={styles.disabledInfoContainer}>
            <Icon name="information-circle-outline" size={normalize(16)} color={Colors.text.secondary} />
            <Text style={styles.disabledInfoText}>
              {'Contact options are only available for confirmed bookings'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Live Owner-Tracking Modal */}
      <Modal
        visible={showTrackingModal}
        animationType="slide"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.trackingModalContainer}>
          <View style={styles.trackingModalHeader}>
            <Text style={styles.trackingModalTitle}>Owner's Live Location</Text>
            <TouchableOpacity onPress={() => setShowTrackingModal(false)}>
              <Icon name="close" size={normalize(24)} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
          {showTrackingModal && trackingBookingId && (
            <LiveTrackingMap bookingId={trackingBookingId} markerLabel="Owner" />
          )}
        </View>
      </Modal>
    </View>
  );
};

// 🧩 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: normalize(14),
    color: Colors.text.secondary,
  },
  errorText: {
    color: Colors.error || '#E53935',
    fontSize: normalize(14),
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: normalize(14),
  },
  vehicleCardContainer: {
    marginBottom: Spacing.md,
  },
  sectionHeaderTitle: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 4,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  phoneIcon: {
    width: normalize(24),
    height: normalize(24),
    marginRight: Spacing.sm,
  },
  customerName: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: Colors.text.primary,
    flex: 1,
  },
  cardMenuButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: normalize(14),
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
  },
  trackButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: normalize(13),
  },
  trackingModalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  trackingModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  trackingModalTitle: {
    fontSize: normalize(18),
    fontWeight: '700',
    color: Colors.text.primary,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  distanceText: {
    fontSize: normalize(13),
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.xs,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  viewMapButtonText: {
    color: Colors.white,
    fontSize: normalize(13),
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  icon: {
    width: normalize(20),
    height: normalize(20),
    tintColor: Colors.text.secondary,
    marginRight: Spacing.sm,
  },
  value: {
    fontSize: normalize(13),
    color: Colors.text.primary,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
  },
  statusConfirmed: {
    backgroundColor: '#D4F8D4',
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusCancelled: {
    backgroundColor: '#FFE5E5',
  },
  statusText: {
    fontSize: normalize(13),
  },
  statusTextConfirmed: {
    color: '#4CAF50',
  },
  statusTextPending: {
    color: '#FFA500',
  },
  statusTextCancelled: {
    color: '#E53935',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  actionButtonWrapper: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  gradientButton: {
    borderRadius: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    fontSize: normalize(15),
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    color: '#666666',
  },
  disabledInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: Spacing.xs,
  },
  disabledInfoText: {
    fontSize: normalize(12),
    color: Colors.text.secondary,
    textAlign: 'center',
    flex: 1,
  },
  headerIconButton: {
    padding: Spacing.xs,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: Spacing.md,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.sm,
    minWidth: 180,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  menuItemText: {
    fontSize: normalize(14),
    fontWeight: '500',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: Spacing.sm,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuItemTextDisabled: {
    color: '#CCCCCC',
  },
  menuDisabledHint: {
    fontSize: normalize(11),
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    fontStyle: 'italic',
  },
  cancellingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  cancellingText: {
    marginTop: Spacing.md,
    fontSize: normalize(14),
    color: Colors.text.secondary,
  },
});

export default BookingDetailsScreen;
