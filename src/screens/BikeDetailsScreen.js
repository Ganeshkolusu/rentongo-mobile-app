import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ FIXED: Direct imports to avoid circular dependency
import { updateBooking } from '../api/bookingApi';
import { getReviews as getReviewsApi } from '../api/reviewApi';
import { API_CONFIG } from '../config/apiConfig';
import bikeService from '../api/services/bikeService';
import BikeFeatures from '../components/Bike/BikeFeatures';
import Button from '../components/Button/Button';
import VehicleReviews from '../components/Reviews/VehicleReviews';
import WaitingPopup from '../components/WaitingPopup';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import NotificationService from '../services/NotificationService';

const getResponsiveDimensions = () => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isTablet = screenWidth >= 768;
  const isWeb = Platform.OS === 'web';
  return {
    screenWidth,
    screenHeight,
    isTablet,
    isWeb,
    imageHeight: isTablet ? 400 : 300,
    maxWidth: isWeb ? 800 : screenWidth,
    containerPadding: isTablet ? 40 : 20,
  };
};

const BikeDetailsScreen = ({ navigation, route }) => {
  // Safety check for production
  if (!route || !navigation) {
    return null;
  }

  // Extract bike ID from multiple possible parameter formats
  const params = route.params || {};
  const bikeId =
    params.bikeId ||
    params.bike?.id ||
    params.bike?._id ||
    params.id ||
    params._id;

  const routeBike = params.bike || (params.id || params._id ? params : null);
  const { userId, user } = useAuth();
  const insets = useSafeAreaInsets();

  // Calculate bottom padding for Android navigation bar
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 60) : insets.bottom;

  // State management
  const [bike, setBike] = useState(routeBike || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [dimensions, setDimensions] = useState(getResponsiveDimensions());
  const [averageRating, setAverageRating] = useState('4.4');
  const [totalReviews, setTotalReviews] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  // Socket and modal states
  const { socket: socketService } = useSocket();
  const [showWaitingModal, setShowWaitingModal] = useState(false);
  const [currentBookingId, setCurrentBookingId] = useState(null);
  const [timer, setTimer] = useState(120);
  
  // ✅ NEW: Add these refs for background timer support
  const timerIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const backgroundTimeRef = useRef(null);

  // ✅ Cleanup when screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        setShowWaitingModal(false);
        setTimer(120);
        startTimeRef.current = null;
        backgroundTimeRef.current = null;
      };
    }, [])
  );

  // Initial load
  useEffect(() => {
    if (!bikeId) {
      if (routeBike && (routeBike.name || routeBike.bikeName)) {
        setBike(routeBike);
        setLoading(false);
        return;
      }

      setError('No bike selected');
      setLoading(false);
      Alert.alert('Error', 'Bike not found');
      return;
    }

    if (routeBike && (routeBike.name || routeBike.bikeName)) {
      setBike(routeBike);
      setLoading(false);
    } else {
      fetchBikeDetails();
    }

    fetchReviews();
  }, [bikeId]);

  // Update notification service and register callback
  useEffect(() => {
    NotificationService.setWaitingForResponse(showWaitingModal);

    // Register callback to close waiting popup when booking confirmed notification is received
    if (showWaitingModal) {
      NotificationService.setOnBookingConfirmedCallback(() => {
        setShowWaitingModal(false);
        setCurrentBookingId(null);
        setTimer(0);
        startTimeRef.current = null;
        backgroundTimeRef.current = null;
      });
    } else {
      NotificationService.clearOnBookingConfirmedCallback();
    }

    return () => {
      NotificationService.clearOnBookingConfirmedCallback();
    };
  }, [showWaitingModal]);

  // Fetch bike details
  const fetchBikeDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const cleanId = bikeId?.trim();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('Request timeout - API took too long to respond')),
          15000
        )
      );

      const fetchPromise = bikeService.getBikeById(cleanId);
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      let bikeData = null;

      if (response?.bike) {
        bikeData = response.bike;
      } else if (response?.data?.bike) {
        bikeData = response.data.bike;
      } else if (response?.data) {
        bikeData = response.data;
      } else if (response?._id) {
        bikeData = response;
      }

      if (bikeData && (bikeData._id || bikeData.id)) {
        setBike(bikeData);
      } else {
        throw new Error('Invalid bike data received from server');
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to load bike details';
      setError(errorMessage);

      Alert.alert(
        'Failed to Load',
        errorMessage + '\n\nPlease check your internet connection',
        [
          { text: 'Try Again', onPress: fetchBikeDetails },
          { text: 'Back', onPress: () => navigation.goBack() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviews
  const fetchReviews = async () => {
    try {
      const cleanId = bikeId?.trim();
      if (!cleanId) return;

      const response = await getReviewsApi('Bike', cleanId);

      let reviewsData = [];
      if (response && response.success && response.data && Array.isArray(response.data)) {
        reviewsData = response.data;
      }

      setTotalReviews(reviewsData.length);

      if (reviewsData.length > 0) {
        const sum = reviewsData.reduce((acc, review) => {
          const rating = review.rating || review.Rate || 0;
          return acc + rating;
        }, 0);
        const avg = (sum / reviewsData.length).toFixed(1);
        setAverageRating(avg);
      }
    } catch (error) {
      // Error fetching reviews
    }
  };

  // Handle dimension changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getResponsiveDimensions());
    });
    return () => subscription?.remove();
  }, []);

  // ✅ NEW: Background timer support using AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      // App going to background
      if (
        appStateRef.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // Store the current time when app goes to background
        backgroundTimeRef.current = Date.now();
      }

      // App coming back to foreground
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Calculate elapsed time while app was in background
        if (backgroundTimeRef.current && startTimeRef.current && showWaitingModal) {
          const now = Date.now();
          const elapsedTotal = Math.floor((now - startTimeRef.current) / 1000);
          const remainingTime = Math.max(0, 120 - elapsedTotal);
          
          setTimer(remainingTime);
          
          // If timer expired while in background, trigger auto-cancel
          if (remainingTime === 0) {
            handleAutoCancel();
          }
        }
        
        backgroundTimeRef.current = null;
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [showWaitingModal]);

  // ✅ Modified: Check for booking success and show waiting modal
  useEffect(() => {
    if (route.params?.bookingSuccess && route.params?.bookingId) {
      setCurrentBookingId(route.params.bookingId);
      setTimer(120);
      startTimeRef.current = Date.now(); // Set start time
      setShowWaitingModal(true);
      navigation.setParams({ bookingSuccess: undefined, bookingId: undefined });
    }
  }, [route.params]);

  // ✅ CUSTOMER SIDE: Play one-time sound effect (only for reject)
  const playSound = async (soundFile) => {
    try {
      // Configure audio mode
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(soundFile, {
        shouldPlay: true,
        volume: 1.0,
      });

      // Auto-unload when finished
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync().catch(() => {});
        }
      });
    } catch (error) {
      // Error playing sound
    }
  };

  // ✅ MODIFIED: Timer countdown with timestamp-based calculation
  useEffect(() => {
    if (showWaitingModal && timer > 0) {
      // Set start time when modal first shows
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => {
          // Calculate actual remaining time based on start time
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
          const remainingTime = Math.max(0, 120 - elapsedSeconds);
          
          if (remainingTime <= 0) {
            handleAutoCancel();
            return 0;
          }
          
          return remainingTime;
        });
      }, 1000);
    } else {
      // Reset start time when modal is hidden
      startTimeRef.current = null;
      backgroundTimeRef.current = null;
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [showWaitingModal]);

  // ✅ Auto cancel booking when timer expires (NO SOUND for customer)
  const handleAutoCancel = async () => {
    try {
      if (currentBookingId) {
        const result = await updateBooking(currentBookingId, { status: 'AutoCancelled' });

        if (result.success) {
          const ownerId = bike?.userId || bike?.ownerId || bike?.user_id;

          if (socketService?.socket && socketService.socket.connected) {
            socketService.socket.emit('booking-auto-cancelled', {
              bookingId: currentBookingId,
              customerId: userId,
              ownerId: ownerId,
              status: 'AutoCancelled',
              message: 'Booking was auto-cancelled due to no response from owner',
            });
          }
        }
      }

      // ❌ NO autocancel sound for customer side

      setShowWaitingModal(false);
      setCurrentBookingId(null);
      setTimer(0);
      startTimeRef.current = null;
      backgroundTimeRef.current = null;

      navigation.navigate('BookingRejectScreen', {
        status: 'autocancelled',
        bookingId: currentBookingId,
      });
    } catch (error) {
      setShowWaitingModal(false);
      setCurrentBookingId(null);
      setTimer(0);
      startTimeRef.current = null;
      backgroundTimeRef.current = null;

      navigation.navigate('BookingRejectScreen', {
        status: 'autocancelled',
        bookingId: currentBookingId,
      });
    }
  };

  // ✅ Manual cancel by customer (NO SOUND)
  const handleManualCancel = async () => {
    try {
      if (currentBookingId) {
        const result = await updateBooking(currentBookingId, { status: 'Cancelled' });

        if (result.success) {
          const ownerId = bike?.userId || bike?.ownerId || bike?.user_id;
          console.log('🚫 [BikeDetailsScreen] Customer cancelling booking:', { bookingId: currentBookingId, ownerId });

          // Emit socket event
          if (socketService?.socket && socketService.socket.connected) {
            socketService.socket.emit('booking-cancelled-by-customer', {
              bookingId: currentBookingId,
              customerId: userId,
              ownerId: ownerId,
              status: 'Cancelled',
              message: 'Booking was cancelled by customer',
            });
          }

          // Send push notification to owner (backup)
          if (ownerId) {
            try {
              await fetch(`${API_CONFIG.BASE_URL}/sendNotification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: ownerId,
                  title: 'Booking Cancelled',
                  body: 'The customer has cancelled their booking request.',
                  data: {
                    type: 'booking_cancelled',
                    bookingId: currentBookingId,
                    status: 'Cancelled'
                  }
                }),
              });
            } catch (e) { }
          }
        }
      }

      setShowWaitingModal(false);
      setCurrentBookingId(null);
      startTimeRef.current = null;
      backgroundTimeRef.current = null;
    } catch (error) {
      setShowWaitingModal(false);
      setCurrentBookingId(null);
      startTimeRef.current = null;
      backgroundTimeRef.current = null;
    }
  };

  // ✅ CUSTOMER SIDE: Listen for real-time booking status updates
  useEffect(() => {
    if (!socketService?.socket || !userId) return;

    const handleBookingStatusUpdate = async (data) => {
      // Only process if this is for current user and booking
      if (data.customerId === userId && data.bookingId === currentBookingId) {
        // Only proceed if waiting modal is showing
        if (!showWaitingModal) {
          return;
        }

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Handle accepted/confirmed - NO SOUND for customer
        if (data.status === 'accepted' || data.status === 'confirmed') {
          // ❌ NO success sound for customer side

          setShowWaitingModal(false);
          setCurrentBookingId(null);
          setTimer(0);
          startTimeRef.current = null;
          backgroundTimeRef.current = null;

          navigation.navigate('BookingConfirmationScreen', {
            status: 'confirmed',
            bookingId: data.bookingId,
          });
        }
        // Handle rejected/cancelled - PLAY REJECT SOUND
        else if (data.status === 'rejected' || data.status === 'cancelled') {
          // ✅ Play reject notification sound for customer
          await playSound(require('../assets/sounds/reject_notification.mp3'));

          setShowWaitingModal(false);
          setCurrentBookingId(null);
          setTimer(0);
          startTimeRef.current = null;
          backgroundTimeRef.current = null;

          navigation.navigate('BookingRejectScreen', {
            status: data.status,
            bookingId: data.bookingId,
          });
        }
      }
    };

    socketService.socket.on('booking-status-update', handleBookingStatusUpdate);

    return () => {
      socketService.socket.off('booking-status-update', handleBookingStatusUpdate);
    };
  }, [socketService, userId, currentBookingId, showWaitingModal, navigation]);

  // Handle Book Now
  const handleBookNow = () => {
    if (!userId) {
      Alert.alert('Login Required', 'Please login to book this bike', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') },
      ]);
      return;
    }

    if (!bike) {
      Alert.alert('Error', 'Bike information is missing');
      return;
    }

    const bikeDbId = bike._id || bike.id;

    if (!bikeDbId) {
      Alert.alert('Error', 'Bike information is missing');
      return;
    }

    NotificationService.setWaitingForResponse(true);

    const ownerId = bike.userId || bike.UserId || bike.ownerId;

    navigation.navigate('DateTimeSelectionScreen', {
      fromScreen: 'booking',
      isModal: false,
      userId: userId,
      contactName: user?.name || user?.username || 'User',
      contactNumber: user?.mobilenumber || user?.phone || '',
      vehicleId: bike._id,
      vehicleType: 'Bike',
      vehicleName: bike.bikeName || bike.name || 'Bike',
      ownerId: ownerId,
      pricePerKm: Number(bike.pricePerKm || bike.price) || 40,
      pricePerHour: 0,
      pricePerDay: 0,
      latitude: bike.latitude || '17.438095',
      longitude: bike.longitude || '78.4485',
    });
  };

  // Handle image scroll
  const handleImageScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.round(scrollPosition / dimensions.screenWidth);
    setCurrentImageIndex(imageIndex);
  };

  // Default fallback images
  const defaultBikeImages = [
    require('../assets/Images/bike.png'),
    require('../assets/Images/bike1.png'),
  ];

  // Get bike images - always ensures at least 2 images
  const getBikeImages = () => {
    // Helper to validate URL
    const isValidUrl = (url) => {
      if (!url || typeof url !== 'string') return false;
      const trimmed = url.trim();
      return trimmed !== '' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'));
    };

    let images = [];

    // Check bikeImages array
    if (bike?.bikeImages && Array.isArray(bike.bikeImages) && bike.bikeImages.length > 0) {
      const validImages = bike.bikeImages
        .filter((img) => isValidUrl(img))
        .map((img) => ({ uri: img.trim() }));

      if (validImages.length > 0) {
        images = validImages;
      }
    }

    // Check single image field if no images found yet
    if (images.length === 0 && bike?.image) {
      if (typeof bike.image === 'number') {
        images = [bike.image];
      } else if (isValidUrl(bike.image)) {
        images = [{ uri: bike.image.trim() }];
      }
    }

    // If no valid images found, return both default images
    if (images.length === 0) {
      return defaultBikeImages;
    }

    // If only 1 image found, add default images to make at least 2
    if (images.length === 1) {
      return [...images, ...defaultBikeImages];
    }

    return images;
  };

  // Handle image load error
  const handleImageError = (index) => {
    setFailedImages((prev) => ({ ...prev, [index]: true }));
  };

  // Render bike image
  const renderBikeImage = (image, index) => {
    const imageWidth = dimensions.screenWidth;
    // Use corresponding default image or first one as fallback
    const fallbackImage = defaultBikeImages[index] || defaultBikeImages[0];

    // If this image failed to load, show fallback
    if (failedImages[index]) {
      return (
        <Image
          key={index}
          source={fallbackImage}
          style={[styles.bikeImage, { width: imageWidth }]}
        />
      );
    }

    if (typeof image === 'number') {
      return (
        <Image
          key={index}
          source={image}
          style={[styles.bikeImage, { width: imageWidth }]}
          onError={() => handleImageError(index)}
        />
      );
    }

    if (image && image.uri) {
      return (
        <Image
          key={index}
          source={{ uri: image.uri }}
          style={[styles.bikeImage, { width: imageWidth }]}
          onError={() => handleImageError(index)}
        />
      );
    }

    return (
      <Image
        key={index}
        source={fallbackImage}
        style={[styles.bikeImage, { width: imageWidth }]}
      />
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading bike details...</Text>
      </View>
    );
  }

  // Error state
  if (!bike) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Ionicons name="bicycle-outline" size={80} color={Colors.text?.secondary || '#666'} />
        <Text style={styles.errorText}>Bike not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToHomeButton}>
          <Text style={styles.backToHomeText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const bikeImages = getBikeImages();

  return (
    <View style={styles.container}>
      {/* Image Section */}
      <View style={[styles.imageSection, { height: dimensions.imageHeight }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={16}
        >
          {bikeImages.map((image, index) => renderBikeImage(image, index))}
        </ScrollView>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={Colors.black} />
        </TouchableOpacity>

        <View style={styles.indicatorContainer}>
          {bikeImages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentImageIndex ? styles.activeIndicator : styles.inactiveIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Content Section */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Bike Info */}
        <View style={styles.bikeInfoSection}>
          <View style={styles.bikeHeaderRow}>
            <Text style={styles.bikeName}>{bike.bikeName || bike.name || 'Bike'}</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {parseFloat(averageRating) > 0
                  ? averageRating
                  : bike.averageRating || bike.rating || '0.0'}
              </Text>
            </View>
          </View>

          <Text style={styles.bikePrice}>
            ₹{bike.pricePerKm || bike.price || '40'}
            <Text style={styles.priceUnit}>/km</Text>
          </Text>
        </View>

        {/* Bike Features */}
        <BikeFeatures bike={bike} />

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>
            {bike.description || 'A great bike for your journey'}
          </Text>
        </View>

        {/* Reviews */}
        <VehicleReviews
          vehicleId={bike._id}
          vehicleType="Bike"
          onSeeMore={(vehicleId, vehicleType) => {
            navigation.navigate('ReviewsListScreen', {
              vehicleType: vehicleType,
              vehicleId: vehicleId,
              vehicleName: bike.bikeName || bike.name,
              canAddReview: false,
            });
          }}
        />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Book Button */}
      <View style={[styles.bookButtonContainer, { paddingBottom: bottomPadding }]}>
        <Button title="Book Now" onPress={handleBookNow} />
      </View>

      {/* Waiting Modal - pass totalTime prop */}
      {showWaitingModal && (
        <WaitingPopup 
          timer={timer} 
          onCancel={handleManualCancel}
          totalTime={120}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: Colors.text.secondary,
    marginTop: 10,
    fontSize: Typography.fontSize?.md || 16,
  },
  errorText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize?.lg || 18,
    marginVertical: 20,
    textAlign: 'center',
  },
  backToHomeButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageSection: {
    position: 'relative',
  },
  bikeImage: {
    height: 300,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    flexDirection: 'row',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  activeIndicator: {
    backgroundColor: Colors.primary,
  },
  inactiveIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  bikeInfoSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bikeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bikeName: {
    fontSize: Typography.fontSize?.xxl || 24,
    fontWeight: Typography.fontWeight?.bold || 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: Typography.fontSize?.sm || 14,
    fontWeight: Typography.fontWeight?.medium || '500',
    color: '#FFD700',
    marginLeft: 4,
  },
  bikePrice: {
    fontSize: Typography.fontSize?.xl || 20,
    fontWeight: Typography.fontWeight?.bold || 'bold',
    color: Colors.text.primary,
  },
  priceUnit: {
    fontSize: Typography.fontSize?.md || 16,
    color: Colors.text.secondary,
    fontWeight: 'normal',
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize?.xl || 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: Typography.fontSize?.md || 16,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  bottomSpacer: {
    height: 100,
  },
  bookButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default BikeDetailsScreen;