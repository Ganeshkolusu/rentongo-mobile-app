import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, responsiveValue, Spacing, wp } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const CarCard = ({ car, onPress, onBookNow }) => {
    // Default fallback image
    const defaultCarImage = require('../../assets/Images/car.png');
    const [hasImageError, setHasImageError] = useState(false);

    // Helper to check if URI is valid
    const isValidUri = (uri) => {
        return uri && typeof uri === 'string' && uri.trim().length > 0 &&
               uri !== 'null' && uri !== 'undefined' &&
               (uri.startsWith('http://') || uri.startsWith('https://'));
    };

    // Get image source with proper fallback
    const getImageSource = () => {
        if (hasImageError) {
            return defaultCarImage;
        }

        if (car.image) {
            if (typeof car.image === 'number') {
                return car.image;
            } else if (car.image.uri && isValidUri(car.image.uri)) {
                return car.image;
            }
        }

        const rawImage = car.carImages?.[0] || car.CarImages?.[0];
        if (isValidUri(rawImage)) {
            return { uri: rawImage };
        }

        return defaultCarImage;
    };

    // Format distance display (always show in km)
    const formatDistance = (distance) => {
        if (!distance && distance !== 0) return null;
        return `${distance.toFixed(1)} km`;
    };

    // Get distance from API and convert to number if it's a string
    const getDistance = () => {
        const distanceValue = car.range ??
                             car.distance ??
                             car.Distance ??
                             car.distanceInKm;

        if (distanceValue === null || distanceValue === undefined) return null;
        
        const numericDistance = typeof distanceValue === 'string' 
            ? parseFloat(distanceValue) 
            : distanceValue;
        
        return isNaN(numericDistance) ? null : numericDistance;
    };

    const imageSource = getImageSource();
    const distance = getDistance();
    const distanceText = formatDistance(distance);

    const handleBookNow = (e) => {
        e?.stopPropagation();
        if (onBookNow) {
            onBookNow(car);
        } else if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.carImagePlaceholder}>
                <Image
                    source={imageSource}
                    style={styles.carImage}
                    defaultSource={defaultCarImage}
                    onError={() => setHasImageError(true)}
                />
            </View>

            <View style={styles.carDetails}>
                <View style={styles.carHeader}>
                    <Text style={styles.carName} numberOfLines={1}>{car.name}</Text>
                    <View style={styles.ratingContainer}>
                        <Image source={require('../../assets/Icons/star.png')} style={styles.starIcon} />
                        <Text style={styles.rating}>{car.rating || '4.4'}</Text>
                    </View>
                </View>

                <View style={styles.carFeatures}>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/Icons/automatic.png')} style={styles.featureIcon} />
                        <Text style={styles.featureText}>{car.transmission}</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/Icons/seat.png')} style={styles.featureIcon} />
                        <Text style={styles.featureText}>{car.seats} Seaters</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Image source={require('../../assets/Icons/fuel.png')} style={styles.featureIcon} />
                        <Text style={styles.featureText}>{car.fuel}</Text>
                    </View>

                    {/* Location Row with Distance */}
                    <View style={styles.locationRow}>
                        <Image
                            source={require('../../assets/Icons/location.png')}
                            style={styles.featureIcon}
                        />
                        <View style={styles.locationTextContainer}>
                            <Text style={styles.locationText} numberOfLines={1}>
                                {car.location || 'Kakinada Gandhi Nagar near Varnika function hall'}
                            </Text>
                            {distanceText && (
                                <Text style={styles.distanceText}>
                                    {distanceText} away
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Price and Book Now Button Row */}
                    <View style={styles.bottomRow}>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>₹{car.price}</Text>
                            <Text style={styles.priceUnit}>/Day</Text>
                        </View>

                        <TouchableOpacity 
                            onPress={handleBookNow}
                            activeOpacity={0.8}
                            style={styles.bookButton}
                        >
                            <View style={styles.gradientButton}>
                                <Text style={styles.bookButtonText}>Book Now</Text>
                                <Icon name="arrow-forward" size={14} color={Colors.white} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xs,
        flexDirection: 'row',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: normalize(2) },
        shadowOpacity: 0.1,
        shadowRadius: normalize(4),
        elevation: 3,
        minHeight: responsiveValue(wp(32), wp(34), wp(36), wp(30)),
    },
    carImagePlaceholder: {
        width: responsiveValue(wp(28), wp(30), wp(32), wp(25)),
        height: responsiveValue(wp(28), wp(30), wp(32), wp(25)),
        marginRight: Spacing.md,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    carImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    carDetails: {
        flex: 1,
        justifyContent: 'space-between',
    },
    carHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    carName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        flex: 1,
        marginRight: Spacing.xs,
        lineHeight: Typography.lineHeight.lg,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        paddingHorizontal: Spacing.xs,
        paddingVertical: normalize(1),
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.white,
    },
    starIcon: {
        width: normalize(16),
        height: normalize(16),
        marginRight: normalize(4),
        tintColor: '#FFD700',
    },
    rating: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        color: '#FFD700',
        lineHeight: Typography.lineHeight.sm,
    },
    carFeatures: {
        flex: 1,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(6),
    },
    featureIcon: {
        width: normalize(16),
        height: normalize(16),
        marginRight: Spacing.sm,
        tintColor: Colors.text.primary,
    },
    featureText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.regular,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: Typography.lineHeight.sm,
        flexShrink: 1,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: normalize(6),
    },
    locationTextContainer: {
        flex: 1,
        flexDirection: 'column',
    },
    locationText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        fontWeight: Typography.fontWeight.regular,
        lineHeight: Typography.lineHeight.sm,
    },
    distanceText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        fontWeight: Typography.fontWeight.medium,
        lineHeight: Typography.lineHeight.sm,
        marginTop: normalize(2),
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: normalize(4),
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        lineHeight: Typography.lineHeight.xl,
    },
    priceUnit: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginLeft: normalize(2),
        lineHeight: Typography.lineHeight.sm,
    },
    bookButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#141248',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xxxs,
        paddingVertical: Spacing.sm,
        gap: Spacing.xs,
        // Simulating gradient from #141248 to #63C8FF
        backgroundColor: '#2a4a8f',
        // For a more gradient-like effect
        borderRightWidth: 15,
        borderRightColor: '#2a4a8f',
    },
    bookButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.semiBold,
        marginLeft: normalize(8),
    },
});

export default CarCard;