import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
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
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { carService } from '../api';
import { updateBooking } from '../api/bookingApi';
import { API_CONFIG } from '../config/apiConfig';
import { getReviews as getReviewsApi } from '../api/reviewApi';
import Button from '../components/Button/Button';
import CarFeatures from '../components/Car/CarFeatures';
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

const CarDetailsScreen = ({ navigation, route }) => {
    const { carId } = route.params || {};

    const { userId, user } = useAuth();
    const insets = useSafeAreaInsets();

    // Calculate bottom padding for Android navigation bar
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 60) : insets.bottom;

    const [car, setCar] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [failedImages, setFailedImages] = useState({});
    const [dimensions, setDimensions] = useState(getResponsiveDimensions());
    const [selectedRentalType, setSelectedRentalType] = useState('hour');
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [averageRating, setAverageRating] = useState(4.4);
    const [totalReviews, setTotalReviews] = useState(0);

    // Socket and modal states for real-time booking status
    const { socket: socketService } = useSocket();
    const [showWaitingModal, setShowWaitingModal] = useState(false);
    const [currentBookingId, setCurrentBookingId] = useState(null);
    const [timer, setTimer] = useState(120);
    
    // ✅ NEW: Add these refs for background timer support
    const timerIntervalRef = useRef(null);
    const startTimeRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const backgroundTimeRef = useRef(null);

    // ✅ Clear timer and waiting modal when screen loses focus (navigating away)
    useFocusEffect(
        useCallback(() => {
            return () => {
                // Cleanup when screen loses focus
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

    useEffect(() => {
        if (!carId) return;
        fetchCarDetails();
        fetchReviews();
    }, [carId]);

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

    const fetchCarDetails = async () => {
        try {
            setLoading(true);
            const cleanId = carId?.trim();
            const response = await carService.getCarById(cleanId);

            let carData = null;
            if (response.car) {
                carData = response.car;
            } else if (response.data) {
                carData = response.data;
            } else {
                carData = response;
            }

            setCar(carData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load car details');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            const cleanId = carId?.trim();

            // Fetch reviews using reviewApi which has proper error handling
            const response = await getReviewsApi('Car', cleanId);

            // Handle response from reviewApi
            let reviewsData = [];
            if (response && response.success && response.data && Array.isArray(response.data)) {
                reviewsData = response.data;
            }

            setReviews(reviewsData);
            setTotalReviews(reviewsData.length);

            // Calculate average rating from reviews
            if (reviewsData.length > 0) {
                const sum = reviewsData.reduce((acc, review) => {
                    const rating = review.rating || review.Rate || 0;
                    return acc + rating;
                }, 0);
                const avg = (sum / reviewsData.length).toFixed(1);
                setAverageRating(avg);
            }
        } catch (error) {
            // Silent catch
        } finally {
            setReviewsLoading(false);
        }
    };

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

    // ✅ Modified: Check if user just made a booking and show waiting modal
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
                    const ownerId = car?.userId || car?.ownerId || car?.user_id;

                    if (socketService?.socket && socketService.socket.connected) {
                        socketService.socket.emit('booking-auto-cancelled', {
                            bookingId: currentBookingId,
                            customerId: userId,
                            ownerId: ownerId,
                            status: 'AutoCancelled',
                            message: 'Booking was auto-cancelled due to no response from owner'
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
                bookingId: currentBookingId
            });
        } catch (error) {
            setShowWaitingModal(false);
            setCurrentBookingId(null);
            setTimer(0);
            startTimeRef.current = null;
            backgroundTimeRef.current = null;

            navigation.navigate('BookingRejectScreen', {
                status: 'autocancelled',
                bookingId: currentBookingId
            });
        }
    };

    // Manual cancel booking when customer clicks cancel button
    const handleManualCancel = async () => {
        try {
            if (currentBookingId) {
                const result = await updateBooking(currentBookingId, { status: 'Cancelled' });

                if (result.success) {
                    const ownerId = car?.userId || car?.ownerId || car?.user_id;

                    // Emit socket events
                    if (socketService?.socket && socketService.socket.connected) {
                        const eventData = {
                            bookingId: currentBookingId,
                            customerId: userId,
                            ownerId: ownerId,
                            status: 'cancelled',
                            cancelledBy: 'customer'
                        };

                        socketService.socket.emit('booking-cancelled-by-customer', eventData);
                        socketService.socket.emit('booking-status-update', {
                            bookingId: currentBookingId,
                            customerId: userId,
                            ownerId: ownerId,
                            status: 'cancelled',
                            cancelledBy: 'customer'
                        });
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
            // Only process if this update is for the current user and booking
            if (data.customerId === userId && data.bookingId === currentBookingId) {
                // Only proceed if waiting modal is currently showing
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
                        bookingId: data.bookingId
                    });
                }
            }
        };

        socketService.socket.on('booking-status-update', handleBookingStatusUpdate);

        return () => {
            socketService.socket.off('booking-status-update', handleBookingStatusUpdate);
        };
    }, [socketService, userId, currentBookingId, showWaitingModal, navigation]);

    const handleBookNow = () => {
        if (!userId) {
            Alert.alert(
                'Login Required',
                'Please login to book this vehicle',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        if (!car?._id) {
            Alert.alert('Error', 'Vehicle information is missing');
            return;
        }

        // ✅ SET WAITING FLAG BEFORE BOOKING - PREVENTS NOTIFICATION SOUND
        NotificationService.setWaitingForResponse(true);

        const pricePerHour = selectedRentalType === 'hour' ? Number(car.RentPerHour) || 250 : 0;
        const pricePerDay = selectedRentalType === 'day' ? Number(car.RentPerDay) || 0 : 0;
        const ownerId = car.userId || car.UserId || car.ownerId;

        navigation.navigate('DateTimeSelectionScreen', {
            fromScreen: 'booking',
            isModal: false,
            userId: userId,
            contactName: user?.name || user?.username || 'User',
            contactNumber: user?.mobilenumber || user?.phone || '',
            vehicleId: car._id,
            vehicleType: 'Car',
            vehicleName: car.CarName || 'Car',
            ownerId: ownerId,
            pricePerKm: 0,
            pricePerHour: pricePerHour,
            pricePerDay: pricePerDay,
            latitude: car.latitude || '17.438095',
            longitude: car.longitude || '78.4485',
            driverAvailable: !!car.driverAvailable,
            driverFee: Number(car.driverFee) || 0,
        });
    };

    const handleImageScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const imageIndex = Math.round(scrollPosition / dimensions.screenWidth);
        setCurrentImageIndex(imageIndex);
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading car details...</Text>
            </View>
        );
    }

    if (!car) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Ionicons name="car-outline" size={80} color={Colors.text?.secondary || '#666'} />
                <Text style={styles.errorText}>Car not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToHomeButton}>
                    <Text style={styles.backToHomeText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Default car images for fallback
    const defaultCarImages = [
        require('../assets/Images/car.png'),
        require('../assets/Images/car1.png'),
    ];

    // Get car images with URL validation and ensure at least 2 images
    const getCarImages = () => {
        const isValidUrl = (url) => {
            if (!url || typeof url !== 'string') return false;
            const trimmed = url.trim();
            return trimmed !== '' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'));
        };

        let images = [];

        // Check car.carImages array
        if (car?.carImages && Array.isArray(car.carImages) && car.carImages.length > 0) {
            const validImages = car.carImages
                .filter((img) => isValidUrl(img))
                .map((img) => ({ uri: img.trim() }));
            if (validImages.length > 0) {
                images = validImages;
            }
        }

        // Fallback to car.image if no valid carImages
        if (images.length === 0 && car?.image) {
            if (typeof car.image === 'number') {
                images = [car.image];
            } else if (isValidUrl(car.image)) {
                images = [{ uri: car.image.trim() }];
            }
        }

        // If no valid images found, return default images
        if (images.length === 0) {
            return defaultCarImages;
        }

        // If only 1 valid image, add default images to ensure at least 2
        if (images.length === 1) {
            return [...images, ...defaultCarImages];
        }

        return images;
    };

    const carImages = getCarImages();

    // Handle image load error - fallback to default image
    const handleImageError = (index) => {
        setFailedImages((prev) => ({ ...prev, [index]: true }));
    };

    // Render car image with error handling
    const renderCarImage = (image, index) => {
        // If this image failed to load, use corresponding default
        if (failedImages[index]) {
            const defaultImage = defaultCarImages[index % defaultCarImages.length];
            return (
                <Image
                    key={index}
                    source={defaultImage}
                    style={[styles.carImage, { width: dimensions.screenWidth }]}
                    resizeMode="cover"
                />
            );
        }

        return (
            <Image
                key={index}
                source={image}
                style={[styles.carImage, { width: dimensions.screenWidth }]}
                resizeMode="cover"
                onError={() => handleImageError(index)}
            />
        );
    };

    const hourlyRate = Number(car.RentPerHour) || 250;
    const dailyRate = Number(car.RentPerDay) || 0;
    const hasHourlyRate = hourlyRate > 0;
    const hasDailyRate = dailyRate > 0;

    return (
        <View style={styles.container}>
            {/* Image Carousel */}
            <View style={[styles.imageSection, { height: dimensions.imageHeight }]}>
                <ScrollView
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleImageScroll}
                    scrollEventThrottle={16}
                >
                    {carImages.map((image, index) => renderCarImage(image, index))}
                </ScrollView>

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.black} />
                </TouchableOpacity>

                <View style={styles.indicatorContainer}>
                    {carImages.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.indicator,
                                index === currentImageIndex 
                                    ? styles.activeIndicator 
                                    : styles.inactiveIndicator,
                            ]}
                        />
                    ))}
                </View>
            </View>

            {/* Car Info */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.carInfoSection}>
                    <View style={styles.carHeaderRow}>
                        <Text style={styles.carName}>{car.CarName || 'Car'}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{parseFloat(averageRating) > 0 ? averageRating : (car.averageRating || car.rating || '0.0')}</Text>
                        </View>
                    </View>

                    {/* Rental Type Selection */}
                    <View style={styles.rentalTypeContainer}>
                        {hasHourlyRate && (
                            <TouchableOpacity
                                style={styles.rentalTypeButtonWrapper}
                                onPress={() => setSelectedRentalType('hour')}
                                activeOpacity={0.8}
                            >
                                {selectedRentalType === 'hour' ? (
                                    <LinearGradient
                                        colors={['#141248', '#63C8FF']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.rentalTypeButton}
                                    >
                                        <Ionicons 
                                            name="time-outline" 
                                            size={20} 
                                            color={Colors.white}
                                        />
                                        <View style={styles.rentalTypeTextContainer}>
                                            <Text style={[styles.rentalTypeLabel, styles.rentalTypeLabelActive]}>
                                                Hourly
                                            </Text>
                                            <Text style={[styles.rentalTypePrice, styles.rentalTypePriceActive]}>
                                                ₹{hourlyRate}/hr
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.rentalTypeButton}>
                                        <Ionicons 
                                            name="time-outline" 
                                            size={20} 
                                            color={Colors.lightGray}
                                        />
                                        <View style={styles.rentalTypeTextContainer}>
                                            <Text style={styles.rentalTypeLabel}>
                                                Hourly
                                            </Text>
                                            <Text style={styles.rentalTypePrice}>
                                                ₹{hourlyRate}/hr
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}

                        {hasDailyRate && (
                            <TouchableOpacity
                                style={styles.rentalTypeButtonWrapper}
                                onPress={() => setSelectedRentalType('day')}
                                activeOpacity={0.8}
                            >
                                {selectedRentalType === 'day' ? (
                                    <LinearGradient
                                        colors={['#141248', '#63C8FF']}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.rentalTypeButton}
                                    >
                                        <Ionicons 
                                            name="calendar-outline" 
                                            size={20} 
                                            color={Colors.white}
                                        />
                                        <View style={styles.rentalTypeTextContainer}>
                                            <Text style={[styles.rentalTypeLabel, styles.rentalTypeLabelActive]}>
                                                Daily
                                            </Text>
                                            <Text style={[styles.rentalTypePrice, styles.rentalTypePriceActive]}>
                                                ₹{dailyRate}/day
                                            </Text>
                                        </View>
                                    </LinearGradient>
                                ) : (
                                    <View style={styles.rentalTypeButton}>
                                        <Ionicons 
                                            name="calendar-outline" 
                                            size={20} 
                                            color={Colors.lightGray}
                                        />
                                        <View style={styles.rentalTypeTextContainer}>
                                            <Text style={styles.rentalTypeLabel}>
                                                Daily
                                            </Text>
                                            <Text style={styles.rentalTypePrice}>
                                                ₹{dailyRate}/day
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                <CarFeatures car={car} />

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.descriptionText}>
                        {car.description || 'No description available'}
                    </Text>
                </View>

                {/* Reviews Section */}
                <VehicleReviews
                    vehicleId={car._id}
                    vehicleType="Car"
                    onSeeMore={(vehicleId, vehicleType) => {
                        navigation.navigate('ReviewsListScreen', {
                            vehicleType: vehicleType,
                            vehicleId: vehicleId,
                            vehicleName: car.CarName,
                            canAddReview: false,
                        });
                    }}
                />

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Book Now Button */}
            <View style={[styles.bookButtonContainer, { paddingBottom: bottomPadding }]}>
                <Button title="Book Now" onPress={handleBookNow} />
            </View>

            {/* Waiting for Owner Response Popup - pass totalTime prop */}
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
        backgroundColor: Colors.white 
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imageSection: { 
        position: 'relative' 
    },
    carImage: { 
        height: 300, 
        resizeMode: 'cover' 
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
        flexDirection: 'row' 
    },
    indicator: { 
        width: 8, 
        height: 8, 
        borderRadius: 4, 
        marginHorizontal: 3 
    },
    activeIndicator: { 
        backgroundColor: Colors.primary
    },
    inactiveIndicator: { 
        backgroundColor: 'rgba(255, 255, 255, 0.5)' 
    },
    contentContainer: { 
        flex: 1, 
        backgroundColor: Colors.white 
    },
    carInfoSection: { 
        padding: Spacing.lg, 
        borderBottomWidth: 1, 
        borderBottomColor: Colors.border 
    },
    carHeaderRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
    },
    carName: {
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
    rentalTypeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    rentalTypeButtonWrapper: {
        flex: 1,
    },
    rentalTypeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 0.5,
        borderColor: Colors.lightGray,
        backgroundColor: Colors.white,
    },
    rentalTypeTextContainer: {
        marginLeft: 8,
        flex: 1,
    },
    rentalTypeLabel: {
        fontSize: Typography.fontSize?.sm || 12,
        color: Colors.text.secondary,
        fontWeight: Typography.fontWeight?.medium || '500',
    },
    rentalTypeLabelActive: {
        color: Colors.white,
    },
    rentalTypePrice: {
        fontSize: Typography.fontSize?.md || 16,
        fontWeight: Typography.fontWeight?.bold || 'bold',
        color: Colors.text.primary,
        marginTop: 2,
    },
    rentalTypePriceActive: {
        color: Colors.white,
    },
    section: { 
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
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
        height: 100
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
});

export default CarDetailsScreen;