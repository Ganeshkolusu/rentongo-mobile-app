import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, responsiveValue, Spacing, wp } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const BikeCard = ({ bike, onPress, onBookNow }) => {
  if (!bike) return null;

  // Default fallback image
  const defaultBikeImage = require('../../assets/Images/bike.png');
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
      return defaultBikeImage;
    }

    if (bike.image) {
      if (typeof bike.image === 'number') {
        return bike.image;
      } else if (bike.image.uri && isValidUri(bike.image.uri)) {
        return bike.image;
      }
    }

    const rawImage = bike.bikeImages?.[0] || bike.BikeImages?.[0];
    if (isValidUri(rawImage)) {
      return { uri: rawImage };
    }

    return defaultBikeImage;
  };

  // Format distance display (always show in km)
  const formatDistance = (distance) => {
    if (!distance && distance !== 0) return null;
    return `${distance.toFixed(1)} km`;
  };

  // Get distance from API and convert to number if it's a string
  const getDistance = () => {
    const distanceValue = bike.range ??
                         bike.distance ??
                         bike.Distance ??
                         bike.distanceInKm;

    if (distanceValue === null || distanceValue === undefined) return null;
    
    const numericDistance = typeof distanceValue === 'string' 
        ? parseFloat(distanceValue) 
        : distanceValue;
    
    return isNaN(numericDistance) ? null : numericDistance;
  };

  const imageSource = getImageSource();
  const distance = getDistance();
  const distanceText = formatDistance(distance);

  const bikeName = bike.bikeName || bike.name || 'Bike';
  const rating = bike.rating || bike.averageRating || '4.4';
  const mileage = bike.mileage || bike.Mileage || '50';
  const price = bike.pricePerKm || bike.price || '500';
  const location = bike.location || bike.pickupCity || bike.pickupArea || 'Location not available';

  const handleBookNow = (e) => {
    e?.stopPropagation();
    if (onBookNow) {
      onBookNow(bike);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image
          source={imageSource}
          style={styles.image}
          defaultSource={defaultBikeImage}
          onError={() => setHasImageError(true)}
        />
      </View>

      {/* Details */}
      <View style={styles.detailsContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{bikeName}</Text>
          <View style={styles.ratingContainer}>
            <Image
              source={require('../../assets/Icons/star.png')}
              style={styles.starIcon}
            />
            <Text style={styles.rating}>{rating}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featureRow}>
          <Image
            source={require('../../assets/Icons/bikespeed.png')}
            style={styles.featureIcon}
          />
          <Text style={styles.featureText}>{mileage} kmpl</Text>
        </View>

        {/* Location and Distance */}
        <View style={styles.locationRow}>
          <Image
            source={require('../../assets/Icons/location.png')}
            style={styles.featureIcon}
          />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
            {distanceText && (
              <Text style={styles.distanceText}>
                {distanceText} away
              </Text>
            )}
          </View>
        </View>

        {/* Price and Book Now Button */}
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{price}</Text>
            <Text style={styles.unit}>/km</Text>
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
    </TouchableOpacity>
  );
};

export default BikeCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: normalize(2) },
    shadowOpacity: 0.1,
    shadowRadius: normalize(4),
    elevation: 3,
    minHeight: responsiveValue(wp(32), wp(34), wp(36), wp(30)),
  },
  imageContainer: {
    width: responsiveValue(wp(28), wp(30), wp(32), wp(25)),
    height: responsiveValue(wp(28), wp(30), wp(32), wp(25)),
    marginRight: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
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
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: normalize(1),
    backgroundColor: Colors.white,
  },
  starIcon: {
    width: normalize(14),
    height: normalize(14),
    marginRight: normalize(4),
    tintColor: '#FFD700',
  },
  rating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFD700',
    lineHeight: Typography.lineHeight.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
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
    fontFamily: Typography.fontFamily.regular,
    fontWeight: Typography.fontWeight.regular,
    lineHeight: Typography.lineHeight.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
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
    marginTop: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  unit: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: normalize(3),
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
    paddingHorizontal: Spacing.xxs,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
    // Simulating gradient from #141248 to #63C8FF
    backgroundColor: '#2a4a8f',
    // For a more gradient-like effect, you can add a subtle pattern
    borderRightWidth: 20,
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