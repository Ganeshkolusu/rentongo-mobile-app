import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { normalize, wp, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { getBookingById } from '../../api/bookingApi';
import VehicleDetailsCard from '../VehicleDetailsCard';

const VehicleCard = ({ 
  bookingId, 
  booking = null, 
  vehicle: vehicleProp = null, 
  showCard = true 
}) => {
  const [vehicle, setVehicle] = useState(vehicleProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookingDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);


      const response = await getBookingById(id);


      if (response.success && response.data) {
        const bookingData = response.data;
        const vehicleData =
          bookingData.vehicle ||
          bookingData.vehicleId ||
          bookingData.carId ||
          bookingData.bikeId ||
          bookingData.autoId ||
          null;
        if (vehicleData) {
          setVehicle(vehicleData);
        } else {
          setError('Vehicle details not found');
        }
      } else {
        setError(response.message || 'Failed to load booking details');
      }
    } catch (err) {

      setError('Error loading vehicle details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Priority 1: Use vehicle prop if provided
    if (vehicleProp) {

      setVehicle(vehicleProp);
      setLoading(false);
      setError(null);
      return;
    }

    // Priority 2: Try to get vehicle from booking object
    if (booking) {
      const vehicleFromBooking = 
        booking.vehicle ||
        booking.vehicleId ||
        booking.vehicleDetails ||
        booking.carId ||
        booking.bikeId ||
        booking.autoId;

      if (vehicleFromBooking && typeof vehicleFromBooking === 'object') {

        setVehicle(vehicleFromBooking);
        setLoading(true);
        setError(null);
        return;
      }
    }

    // Priority 3: Fetch using bookingId
    const id = bookingId || booking?._id || booking?.id;
    if (id) {

      fetchBookingDetails(id);
    } else {
      // No way to get vehicle data

      setError('Vehicle information is missing');
      setLoading(false);
    }
  }, [bookingId, booking, vehicleProp]);

  if (!showCard) return null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vehicle...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Vehicle information is missing</Text>
      </View>
    );
  }

  return (
    <VehicleDetailsCard 
      vehicle={vehicle} 
      style={{ marginHorizontal: Spacing.md }} 
    />
  );
};

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    height: wp(30),
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    borderRadius: normalize(10),
    padding: Spacing.sm,
  },
  loadingText: {
    marginTop: Spacing.xs,
    fontSize: normalize(12),
    color: Colors.text.secondary,
  },
  errorText: {
    fontSize: normalize(12),
    color: Colors.error,
    textAlign: 'center',
  },
});

export default VehicleCard;