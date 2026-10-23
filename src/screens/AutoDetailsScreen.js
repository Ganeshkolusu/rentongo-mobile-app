import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    Platform,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../constants/Dimensions';
import Button from '../components/Button/Button';
import { useAuth } from '../context/AuthContext';
import { getAutoById } from '../api/autoApi';
import { getReviews as getReviewsApi } from '../api/reviewApi';
import { getSafeImageSource } from '../config/apiConfig';

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

const AutoDetailsScreen = ({ navigation, route }) => {
    const { autoId } = route.params || {};

    const { userId, user } = useAuth();
    const insets = useSafeAreaInsets();

    // Calculate bottom padding for Android navigation bar
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 60) : insets.bottom;

    const [auto, setAuto] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [dimensions, setDimensions] = useState(getResponsiveDimensions());
    const [averageRating, setAverageRating] = useState('0.0');
    const [totalReviews, setTotalReviews] = useState(0);

    // Fetch auto details and reviews
    useEffect(() => {
        if (!autoId) return;
        fetchAutoDetails();
        fetchReviews();
    }, [autoId]);

    const fetchAutoDetails = async () => {
        try {
            setLoading(true);
            const cleanId = autoId?.trim();

            const response = await getAutoById(cleanId);

            let autoData = null;
            if (response.auto) {
                autoData = response.auto;
            } else if (response.data) {
                autoData = response.data;
            } else {
                autoData = response;
            }

            setAuto(autoData);
        } catch (error) {
            Alert.alert('Error', 'Failed to load auto details');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const cleanId = autoId?.trim();
            if (!cleanId) return;

            // Fetch reviews using reviewApi which has proper error handling
            const response = await getReviewsApi('Auto', cleanId);

            // Handle response from reviewApi
            let reviewsData = [];
            if (response && response.success && response.data && Array.isArray(response.data)) {
                reviewsData = response.data;
            }

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
        }
    };

    // Responsive Layout Listener
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', () => {
            setDimensions(getResponsiveDimensions());
        });
        return () => subscription?.remove();
    }, []);

    // Handle Book Now
    const handleBookNow = () => {
        if (!userId) {
            Alert.alert(
                'Login Required',
                'Please login to book this auto',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Login', onPress: () => navigation.navigate('Login') }
                ]
            );
            return;
        }

        if (!auto?._id) {
            Alert.alert('Error', 'Auto information is missing');
            return;
        }

        // Navigate with all required data
        navigation.navigate('DateTimeSelectionScreen', {
            fromScreen: 'booking',
            isModal: false,

            // User Information
            userId: userId,
            contactName: user?.name || user?.username || 'User',
            contactNumber: user?.mobilenumber || user?.phone || '',

            // Vehicle Information
            vehicleId: auto._id,
            vehicleType: 'Auto',
            vehicleName: auto.AutoNumber || 'Auto',

            // Pricing Information
            pricePerKm: Number(auto.pricePerKm) || 25,
            pricePerHour: 0,
            pricePerDay: 0,

            // Location Information
            latitude: auto.latitude || '17.438095',
            longitude: auto.longitude || '78.4485',
        });
    };

    const handleImageScroll = (event) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const imageIndex = Math.round(scrollPosition / dimensions.screenWidth);
        setCurrentImageIndex(imageIndex);
    };

    // Loading state
    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>{'Loading auto details...'}</Text>
            </View>
        );
    }

    // No auto found
    if (!auto) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <Ionicons name="car-outline" size={80} color={Colors.text?.secondary || '#666'} />
                <Text style={styles.errorText}>{'Auto not found'}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToHomeButton}>
                    <Text style={styles.backToHomeText}>{'Go Back'}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const autoImages = auto.autoImages && auto.autoImages.length > 0
        ? auto.autoImages.map((img) => (typeof img === 'string' ? { uri: img } : img))
        : [require('../assets/Images/auto.png')];

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
                    {autoImages.map((image, index) => (
                        <Image
                            key={index}
                            source={image}
                            style={[styles.autoImage, { width: dimensions.screenWidth }]}
                        />
                    ))}
                </ScrollView>

                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color={Colors.black} />
                </TouchableOpacity>

                {/* Image Indicators */}
                <View style={styles.indicatorContainer}>
                    {autoImages.map((_, index) => (
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

            {/* Auto Info */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.autoInfoSection}>
                    <View style={styles.autoHeaderRow}>
                        <Text style={styles.autoName}>{auto.AutoNumber || 'Auto'}</Text>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <Text style={styles.ratingText}>{parseFloat(averageRating) > 0 ? averageRating : (auto.averageRating || '0.0')}</Text>
                        </View>
                    </View>
                    <Text style={styles.autoPrice}>
                        ₹{auto.pricePerKm || '25'}
                        <Text style={styles.priceUnit}>/km</Text>
                    </Text>

                    {/* Auto Features */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <Image
                                source={require('../assets/Icons/seat.png')}
                                style={styles.featureIcon}
                            />
                            <Text style={styles.featureText}>3 Seats</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="person" size={24} color={Colors.text.primary} />
                            <Text style={styles.featureText}>{auto.contactName || 'Driver'}</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="call" size={24} color={Colors.text.primary} />
                            <Text style={styles.featureText}>{auto.contactNumber || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{'Description'}</Text>
                    <Text style={styles.descriptionText}>
                        {auto.description || 'This auto is in good condition and ready for your journey.'}
                    </Text>
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{'Contact Details'}</Text>
                    <View style={styles.contactRow}>
                        <Ionicons name="person-circle" size={20} color={Colors.primary} />
                        <Text style={styles.contactText}>{auto.contactName || 'N/A'}</Text>
                    </View>
                    <View style={styles.contactRow}>
                        <Ionicons name="call" size={20} color={Colors.primary} />
                        <Text style={styles.contactText}>{auto.contactNumber || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Book Now Button */}
            <View style={[styles.bookButtonContainer, { paddingBottom: bottomPadding }]}>
                <Button title={'Book Now'} onPress={handleBookNow} />
            </View>
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
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: Colors.text?.secondary || '#666',
    },
    errorText: {
        marginTop: 10,
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text?.primary || '#333',
    },
    backToHomeButton: {
        marginTop: 20,
        backgroundColor: Colors.primary,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
    },
    backToHomeText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
    imageSection: {
        position: 'relative',
    },
    autoImage: {
        height: '100%',
        resizeMode: 'cover',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
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
        marginHorizontal: 4,
    },
    activeIndicator: {
        backgroundColor: Colors.white,
    },
    inactiveIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    autoInfoSection: {
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border || '#E0E0E0',
    },
    autoHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    autoName: {
        fontSize: normalize(22),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        flex: 1,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        borderWidth: 1,
        borderColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
        fontWeight: '600',
        color: '#FFD700',
    },
    autoPrice: {
        fontSize: normalize(20),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 15,
    },
    priceUnit: {
        fontSize: normalize(14),
        color: Colors.text.secondary,
        fontWeight: Typography.fontWeight.regular,
    },
    featuresContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: Colors.background || '#F5F5F5',
        paddingVertical: 15,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.md,
        marginTop: 10,
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureIcon: {
        width: 24,
        height: 24,
        marginBottom: 5,
        tintColor: Colors.text.primary,
    },
    featureText: {
        fontSize: normalize(12),
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
    },
    section: {
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 10,
    },
    descriptionText: {
        fontSize: normalize(14),
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    contactText: {
        fontSize: normalize(14),
        color: Colors.text.primary,
        marginLeft: 10,
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
        borderTopColor: Colors.border || '#E0E0E0',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});

export default AutoDetailsScreen;
