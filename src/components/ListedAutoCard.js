import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS, fetchData, HTTP_METHODS } from '../config/apiConfig';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { navigate } from '../services/NavigationService';
import MoreOptionsPopup from './MoreOptionsPopup';

const ListedAutoCard = ({
  autoId,
  autoName,
  image,
  transmission,
  fuel,
  seatingCapacity,
  price,
  location,
  isAvailable = true,
  rawData,
  onPress,
  onEdit,
  onDelete,
  onImagePress,
  onAvailabilityChange,
  onViewHistory,
  onRefresh,
}) => {
  // Extract values from props or rawData
  const displayAutoName = autoName || rawData?.autoName || 'Auto';
  const displayImage = image || rawData?.autoImages?.[0] || null;
  const displayTransmission = transmission || rawData?.transmissionType || 'Manual';
  const displayFuel = fuel || rawData?.fuelType || 'Petrol';
  const displaySeatingCapacity = seatingCapacity || rawData?.seatingCapacity || '3 Seater';
  const displayPrice = price || rawData?.pricePerKm || rawData?.RentPerDay || '0';
  const displayLocation = location || rawData?.pickupCity || rawData?.pickupArea || 'Location not available';
  const userId = rawData?.userId;

  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
  const moreButtonRef = useRef(null);
  const [currentAvailability, setCurrentAvailability] = useState(isAvailable);
  const [updating, setUpdating] = useState(false);

  const handleMorePress = () => {
    moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setPopupPosition({ top: py + height, right: normalize(20) });
      setShowPopup(true);
    });
  };

  const handleEdit = () => {
    setShowPopup(false);
    if (onEdit) return onEdit();

    navigate('EditAutoDetailsScreen', {
      auto: rawData || { id: autoId, name: displayAutoName, image: displayImage, price: displayPrice, location: displayLocation, transmission: displayTransmission, fuel: displayFuel, seatingCapacity: displaySeatingCapacity },
    });
  };

  const handleDelete = () => {
    setShowPopup(false);
    Alert.alert(
      'Delete Auto',
      'Are you sure you want to delete this auto listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);

              const response = await fetchData(API_ENDPOINTS.DELETE_AUTO(autoId), {}, { method: HTTP_METHODS.DELETE });

              onDelete?.(autoId);
              onRefresh?.();
              Alert.alert('Success', 'Auto deleted successfully');
            } catch (error) {

              Alert.alert('Error', error.message || 'Failed to delete auto');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleAvailabilityPress = () => {
    navigate('DateTimeSelectionScreen', {
      fromScreen: 'availability',
      autoId,
      currentAvailability,
      onSave: async (newAvailability) => {
        try {

          const response = await fetchData(
            API_ENDPOINTS.UPDATE_AUTO(autoId),
            {},
            {
              method: HTTP_METHODS.PUT,
              body: JSON.stringify({ Available: newAvailability === 'available' }),
            }
          );

          setCurrentAvailability(newAvailability === 'available');
          onAvailabilityChange?.(newAvailability === 'available');
        } catch (error) {

          Alert.alert('Error', 'Failed to update availability');
        }
      },
    });
  };

  const handleViewHistory = () => {
    if (onViewHistory) return onViewHistory();

    const vehicleData = rawData || {
      _id: autoId,
      id: autoId,
      AutoName: displayAutoName,
      autoName: displayAutoName,
      autoImages: [displayImage],
      transmissionType: displayTransmission,
      fuelType: displayFuel,
      seatingCapacity: displaySeatingCapacity,
      pickupCity: displayLocation,
      pickupArea: displayLocation,
      RentPerDay: displayPrice,
      pricePerKm: displayPrice,
      Available: currentAvailability,
      userId,
    };

    navigate('BookingHistoryScreen', {
      autoId,
      vehicleId: autoId,
      userId,
      autoName: displayAutoName,
      vehicleType: 'Auto',
      itemType: 'auto',
      autoData: rawData || vehicleData,
      vehicle: vehicleData,
      from: 'ListedAutoCard',
    });
  };

  return (
    <>
      <View style={[styles.card, currentAvailability && styles.availableCard]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ flex: 1 }}>
          <View style={styles.contentContainer}>
            <Image
              source={displayImage ? { uri: displayImage } : require('../assets/Images/auto.png')}
              style={styles.autoImage}
              defaultSource={require('../assets/Images/auto.png')}
            />

            <View style={styles.detailsContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.autoName} numberOfLines={1}>{displayAutoName}</Text>
                <TouchableOpacity ref={moreButtonRef} onPress={handleMorePress} style={styles.moreButton} disabled={updating}>
                  <Image source={require('../assets/Icons/vector.png')} style={styles.moreIcon} />
                </TouchableOpacity>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/automatic.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{displayTransmission}</Text>
                </View>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/fuel.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{displayFuel}</Text>
                </View>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/seat.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{displaySeatingCapacity}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>₹{displayPrice}</Text>
                  <Text style={styles.priceUnit}>/km</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Image source={require('../assets/Icons/location.png')} style={styles.iconImage} />
                <Text style={styles.locationText} numberOfLines={2}>{displayLocation}</Text>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.statusContainer, styles.unavailableStatus]}
              onPress={handleAvailabilityPress}
              activeOpacity={0.5}
              disabled={updating}
            >
              <Text style={[styles.statusText, styles.unavailableText]}>Add Not Available Slot</Text>
              <Image source={require('../assets/Icons/plus.png')} style={styles.plusIcon} />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleViewHistory} activeOpacity={0.5} style={styles.viewHistoryButton}>
              <Text style={styles.viewHistoryText}>View Booking History</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>

      <MoreOptionsPopup
        visible={showPopup}
        onClose={() => setShowPopup(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        position={popupPosition}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.xs, borderWidth: normalize(1), borderColor: '#FFE5E5', shadowColor: Colors.black, shadowOffset: { width: 0, height: normalize(2) }, shadowOpacity: 0.08, shadowRadius: normalize(4), elevation: 3, overflow: 'hidden' },
  availableCard: { borderColor: '#E5F4FF' },
  contentContainer: { flexDirection: 'row', padding: Spacing.md },
  autoImage: { width: wp(30), height: wp(30), borderRadius: BorderRadius.md, marginRight: Spacing.md, backgroundColor: '#f5f5f5' },
  detailsContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  autoName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semiBold, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
  moreButton: { padding: Spacing.xs },
  specRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  specItem: { flexDirection: 'row', alignItems: 'center' },
  specText: { marginLeft: Spacing.xs, fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: Typography.fontFamily.regular },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  price: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary },
  priceUnit: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, fontFamily: Typography.fontFamily.regular },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: Spacing.xs },
  locationText: { marginLeft: Spacing.xs, fontSize: Typography.fontSize.xs, color: Colors.text.secondary, fontFamily: Typography.fontFamily.regular, flex: 1 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: normalize(10), marginBottom: normalize(10) },
  statusContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, width: normalize(155), borderRadius: BorderRadius.sm },
  unavailableStatus: { backgroundColor: Colors.lightGray },
  statusText: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.regular },
  unavailableText: { color: Colors.error },
  plusIcon: { width: normalize(10), height: normalize(12), tintColor: Colors.black, marginRight: 5 },
  viewHistoryButton: { flex: 1, marginLeft: Spacing.xxl, paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center', justifyContent: 'center', borderWidth: normalize(1.2), borderColor: Colors.activeTab, backgroundColor: Colors.white },
  viewHistoryText: { color: Colors.activeTab, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium },
  moreIcon: { width: normalize(20), height: normalize(20), resizeMode: 'contain', tintColor: Colors.text.secondary },
  iconImage: { width: normalize(16), height: normalize(16), tintColor: Colors.text.secondary },
});

export default ListedAutoCard;