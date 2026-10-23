import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius, normalize, wp, responsiveValue } from '../../constants/Dimensions';
import Icon from 'react-native-vector-icons/Ionicons';

// Local seat icon
import SeatIcon from '../../assets/Icons/seat.png';

const AutoCard = ({ auto, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={auto.image} style={styles.image} />
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{auto.name || 'Auto'}</Text>
          <View style={styles.ratingContainer}>
            <Image
              source={require('../../assets/Icons/star.png')}
              style={styles.starIcon}
            />
            <Text style={styles.rating}>{auto.rating}</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Image source={SeatIcon} style={styles.icon} />
            <Text style={styles.featureText}>{auto.seats || 3} Seaters</Text>
          </View>
        </View>

        {/* Price */}
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{auto.price}</Text>
          <Text style={styles.unit}>/km</Text>
        </View>
      </View>

      {/* Arrow */}
      <Icon name="chevron-forward" size={22} color={Colors.text.secondary} style={styles.arrowIcon} />
    </TouchableOpacity>
  );
};

export default AutoCard;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: normalize(2) },
    shadowOpacity: 0.1,
    shadowRadius: normalize(4),
    elevation: 3,
    minHeight: responsiveValue(wp(30), wp(32), wp(34), wp(28)),
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
  infoContainer: {
    flex: 1,
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
    color: Colors.text.primary,
    flex: 1,
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
    marginRight: normalize(3),
    tintColor: '#FFD700',
  },
  rating: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFD700',
  },
  features: {
    marginBottom: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(6),
  },
  icon: {
    width: normalize(16),
    height: normalize(16),
    marginRight: Spacing.sm,
    tintColor: Colors.text.primary,
  },
  featureText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: Spacing.xs,
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
  arrowIcon: {
    marginLeft: Spacing.sm,
  },
});
