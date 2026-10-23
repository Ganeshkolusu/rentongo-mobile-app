import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

// Default images for different vehicle types
const DEFAULT_BIKE_IMAGE = require('../assets/Images/bike.png');
const DEFAULT_CAR_IMAGE = require('../assets/Images/car1.png');
const DEFAULT_AUTO_IMAGE = require('../assets/Images/auto.png');

/**
 * VehicleDetailsCard – works dynamically for Car, Bike, Auto
 */
const VehicleDetailsCard = ({ vehicle, style }) => {
  const [imageError, setImageError] = useState(false);

  if (!vehicle) return null;

  // ✅ Title (combine name + model)
  const vehicleTitle =
    vehicle?.title ||
    vehicle?.CarName ||
    vehicle?.bikeName ||
    vehicle?.autoName ||
    vehicle?.name ||
    vehicle?.model ||
    '';

  // ✅ Bike subtitle / model (e.g., Classic 350)
  const bikeSubtitle =
    vehicle?.bikeModel || vehicle?.model || '';

  // ✅ Helper function to get first valid image URL from array
  const getFirstValidImage = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) return null;
    for (const img of images) {
      if (img && typeof img === 'string' && img.trim() !== '' &&
          (img.startsWith('http://') || img.startsWith('https://'))) {
        return img.trim();
      }
    }
    return null;
  };

  // ✅ Image - with validation for empty strings and invalid URLs
  const vehicleImage =
    (vehicle?.bikeImage && typeof vehicle.bikeImage === 'string' && vehicle.bikeImage.trim() !== '' ? vehicle.bikeImage.trim() : null) ||
    getFirstValidImage(vehicle?.bikeImages) ||
    getFirstValidImage(vehicle?.carImages) ||
    getFirstValidImage(vehicle?.autoImages) ||
    (vehicle?.photo && typeof vehicle.photo === 'string' && vehicle.photo.trim() !== '' ? vehicle.photo.trim() : null) ||
    getFirstValidImage(vehicle?.images) ||
    null;

  // ✅ Transmission (if available)
  const transmission =
    vehicle?.transmissionType ||
    vehicle?.transmission ||
    vehicle?.gearType ||
    '';

  // ✅ Seats (for car / auto)
  const seats =
    vehicle?.Carseater ||
    vehicle?.BikeSeater ||
    vehicle?.seatingCapacity ||
    vehicle?.seats ||
    '';

  // ✅ Fuel type
  const fuel = vehicle?.fuelType || vehicle?.fuel || '';

  // ✅ Price (support per km and per hour)
  const price =
    vehicle?.RentPerHour ||
    vehicle?.rentPerHour ||
    vehicle?.pricePerHour ||
    vehicle?.pricePerKm ||
    vehicle?.price ||
    '';

  // ✅ Determine price unit
  const priceUnit = vehicle?.pricePerKm ? '/km' : '/hr';

  // ✅ Location
  const location =
    vehicle?.pickupArea ||
    vehicle?.pickupCity ||
    vehicle?.location ||
    vehicle?.address ||
    '';

  // ✅ Determine vehicle type
  const isBike = !!vehicle?.bikeName || !!vehicle?.bikeModel || !!vehicle?.bikeImages;
  const isAuto = !!vehicle?.autoName || !!vehicle?.autoImages;
  const isCar = !!vehicle?.CarName || !!vehicle?.carImages || !!vehicle?.name?.toLowerCase()?.includes('car');

  // ✅ Get appropriate default image based on vehicle type
  const getDefaultImage = () => {
    if (isBike) return DEFAULT_BIKE_IMAGE;
    if (isAuto) return DEFAULT_AUTO_IMAGE;
    return DEFAULT_CAR_IMAGE; // Default to car
  };
  const defaultImage = getDefaultImage();

  // ✅ Determine image source
  const getImageSource = () => {
    // If image failed to load or no image available, use default
    if (imageError || !vehicleImage) {
      return defaultImage;
    }
    return { uri: vehicleImage };
  };

  return (
    <View style={[styles.vehicleCard, style]}>
      {/* 🖼 Vehicle Image */}
      <Image
        source={getImageSource()}
        style={styles.vehicleImage}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      {/* Right Side Info */}
      <View style={styles.vehicleInfo}>
        {/* 🚗 Title */}
        {vehicleTitle ? (
          <Text style={styles.vehicleName}>{vehicleTitle}</Text>
        ) : null}

        {/* 🏍 Bike subtitle/model right below bike name */}
        {isBike && bikeSubtitle ? (
          <Text style={styles.bikeSubtitle}>{bikeSubtitle}</Text>
        ) : null}

        {/* 🏍 Bike fuel (only for bikes, below subtitle) */}
        {isBike && fuel ? (
          <Text style={styles.bikeFuel}>{fuel}</Text>
        ) : null}

        {/* ⚙️ Specs (only for Car/Auto) */}
       {/* ⚙️ Specs (only for Car/Auto, line by line) */}
{(isCar || isAuto) && (
  <View style={styles.vehicleSpecsList}>
    {transmission ? (
      <View style={styles.specItem}>
        <Image
          source={require('../assets/Icons/automatic.png')}
          style={styles.specIcon}
        />
        <Text style={styles.specText}>{transmission}</Text>
      </View>
    ) : null}

    {seats ? (
      <View style={styles.specItem}>
        <Image
          source={require('../assets/Icons/seat.png')}
          style={styles.specIcon}
        />
        <Text style={styles.specText}>
          {seats.toString().includes('Seater') ? seats : `${seats} Seater`}
        </Text>
      </View>
    ) : null}

    {fuel ? (
      <View style={styles.specItem}>
        <Image
          source={require('../assets/Icons/fuel.png')}
          style={styles.specIcon}
        />
        <Text style={styles.specText}>{fuel}</Text>
      </View>
    ) : null}
  </View>
)}

        {/* 💰 Price */}
        {price ? (
          <Text style={styles.vehiclePrice}>
            ₹{price}
            <Text style={styles.priceUnit}>{priceUnit}</Text>
          </Text>
        ) : null}

        {/* 📍 Location */}
        {location ? (
          <View style={styles.locationContainer}>
            <Image
              source={require('../assets/Icons/location.png')}
              style={styles.locationIcon}
            />
            <Text style={styles.locationText} numberOfLines={2}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  vehicleCard: {
    backgroundColor: Colors.white,
    borderRadius: normalize(10),
    padding: Spacing.sm,
    flexDirection: 'row',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleImage: {
    width: wp(26),
    height: wp(26),
    borderRadius: normalize(8),
    resizeMode: 'cover',
    backgroundColor: '#F0F0F0',
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
    justifyContent: 'space-between',
  },
  vehicleName: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: Colors.black,
    fontFamily: Typography.fontFamily.bold,
  },
  bikeSubtitle: {
    fontSize: normalize(12),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: normalize(2),
  },
  bikeFuel: {
    fontSize: normalize(12),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginTop: normalize(2),
  },
  vehicleSpecsList: {
    flexDirection: 'column',
    marginBottom: normalize(4),
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(3),
    marginRight: normalize(10),
  },
  specIcon: {
    width: normalize(12),
    height: normalize(12),
    marginRight: normalize(3),
    tintColor: Colors.text.secondary,
  },
  specText: {
    fontSize: normalize(10),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  vehiclePrice: {
    fontSize: normalize(16),
    fontWeight: '700',
    color: Colors.black,
    fontFamily: Typography.fontFamily.bold,
    marginTop: Spacing.xs,
  },
  priceUnit: {
    fontSize: normalize(10),
    fontWeight: '400',
    color: Colors.text.secondary,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: Spacing.xs,
  },
  locationIcon: {
    width: normalize(12),
    height: normalize(12),
    marginRight: normalize(3),
    marginTop: normalize(1),
    tintColor: Colors.text.secondary,
  },
  locationText: {
    flex: 1,
    fontSize: normalize(10),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: normalize(12),
  },
});

export default VehicleDetailsCard;
