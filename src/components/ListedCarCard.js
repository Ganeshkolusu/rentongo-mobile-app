import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createNotAvailability, deleteNotAvailability, updateNotAvailability } from '../api/notAvailabilityApi';
import { API_ENDPOINTS, fetchData, HTTP_METHODS } from '../config/apiConfig';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { navigate } from '../services/NavigationService';
import MoreOptionsPopup from './MoreOptionsPopup';


const ListedCarCard = ({
  carId,
  carName,
  image,
  transmission = 'Automatic',
  seats = '5 Seaters',
  fuel = 'Petrol',
  price,
  location,
  rawData,
  onPress,
  onEdit,
  onDelete,
  onImagePress,
  onAvailabilityChange,
  onViewHistory,
  onRefresh,
  approvalStatus = 'pending', // 'pending' | 'approved' | 'rejected'
  onApprovalChange,
}) => {
  const [showPopup, setShowPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
  const [updating, setUpdating] = useState(false);
  const [availability, setAvailability] = useState(rawData?.Available ?? true);
  const [unavailableSlots, setUnavailableSlots] = useState(rawData?.unavailableSlots || []);

  const moreButtonRef = useRef(null);

  const handleMorePress = () => {
    moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
      setPopupPosition({ top: py + height, right: normalize(20) });
      setShowPopup(true);
    });
  };

  const handleEdit = () => {
    setShowPopup(false);
    if (onEdit) return onEdit();
    navigate('EditCarDetailsScreen', {
      carId,
      Car: rawData || { id: carId, name: carName, image, price, location, transmission, seats, fuel },
    });
  };

  const handleDelete = () => {
    setShowPopup(false);
    Alert.alert(
      'Delete Car',
      'Are you sure you want to delete this car listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              await fetchData(
                API_ENDPOINTS.DELETE_CAR(carId),
                {},
                { method: HTTP_METHODS.DELETE }
              );
              
              // Call onDelete first to remove from UI
              if (onDelete) {
                onDelete(carId);
              }
              
              // Show success message
              Alert.alert('Success', 'Car deleted successfully');
              
              // Refresh after a short delay to allow UI update
              setTimeout(() => {
                onRefresh?.();
              }, 300);
            } catch (error) {
              Alert.alert('Error', error.message || 'Failed to delete car');
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
      currentAvailability: availability,
      vehicleId: carId,
      vehicleType: 'Car',
      unavailableSlots: unavailableSlots,
      onSave: async (newSlot) => {
        try {
          setUpdating(true);
          
          const data = {
            vechileType: 'Car',
            VechileId: carId,
            fromDate: newSlot.fromDate,
            toDate: newSlot.toDate,
            fromTime: newSlot.times?.startTime || newSlot.fromTime,
            toTime: newSlot.times?.endTime || newSlot.toTime,
            isNotAvailable: true,
          };

          const result = await createNotAvailability(data);

          if (!result.success) {
            throw new Error(result.message || 'Failed to create unavailable slot');
          }

          const slotWithId = {
            _id: result.data?.data?._id || result.data?._id,
            fromDate: newSlot.fromDate,
            toDate: newSlot.toDate,
            times: {
              startTime: newSlot.times?.startTime || newSlot.fromTime,
              endTime: newSlot.times?.endTime || newSlot.toTime,
            },
            fromTime: newSlot.times?.startTime || newSlot.fromTime,
            toTime: newSlot.times?.endTime || newSlot.toTime,
          };

          setUnavailableSlots(prev => [...prev, slotWithId]);
          setAvailability(false);
          onAvailabilityChange?.(false);
          onRefresh?.();
          Alert.alert('Success', result.message || 'Unavailable slot added successfully');
        } catch (error) {

          Alert.alert('Error', error.message || 'Failed to add unavailable slot');
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleEditSlot = async (index) => {
    const slot = unavailableSlots[index];
    
    navigate('DateTimeSelectionScreen', {
      fromScreen: 'edit-availability',
      currentAvailability: availability,
      vehicleId: carId,
      vehicleType: 'Car',
      existingSlot: slot,
      isEditing: true,
      onSave: async (updatedSlot) => {
        try {
          setUpdating(true);
          
          if (!slot._id) {
            throw new Error('Slot ID not found');
          }

          const data = {
            vechileType: 'Car',
            VechileId: carId,
            fromDate: updatedSlot.fromDate,
            toDate: updatedSlot.toDate,
            fromTime: updatedSlot.times?.startTime || updatedSlot.fromTime,
            toTime: updatedSlot.times?.endTime || updatedSlot.toTime,
            isNotAvailable: true,
          };

          const result = await updateNotAvailability(slot._id, data);

          if (!result.success) {
            throw new Error(result.message || 'Failed to update unavailable slot');
          }

          const updatedSlots = [...unavailableSlots];
          updatedSlots[index] = {
            ...slot,
            fromDate: updatedSlot.fromDate,
            toDate: updatedSlot.toDate,
            times: {
              startTime: updatedSlot.times?.startTime || updatedSlot.fromTime,
              endTime: updatedSlot.times?.endTime || updatedSlot.toTime,
            },
            fromTime: updatedSlot.times?.startTime || updatedSlot.fromTime,
            toTime: updatedSlot.times?.endTime || updatedSlot.toTime,
          };

          setUnavailableSlots(updatedSlots);
          onRefresh?.();
          Alert.alert('Success', result.message || 'Slot updated successfully');
        } catch (error) {

          Alert.alert('Error', error.message || 'Failed to update slot');
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  const handleRemoveSlot = async (index) => {
    const slot = unavailableSlots[index];
    
    Alert.alert(
      'Remove Unavailable Slot',
      'Do you want to make this slot available again?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdating(true);
              
              if (slot._id) {
                const result = await deleteNotAvailability(slot._id);
                
                if (!result.success) {
                  throw new Error(result.message);
                }
              }
              
              const updatedSlots = unavailableSlots.filter((_, i) => i !== index);
              setUnavailableSlots(updatedSlots);
              
              if (updatedSlots.length === 0) {
                setAvailability(true);
                onAvailabilityChange?.(true);
              }
              
              onRefresh?.();
              Alert.alert('Success', 'Slot removed successfully');
            } catch (error) {

              Alert.alert('Error', error.message || 'Failed to remove slot');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleSlotLongPress = (index) => {
    Alert.alert(
      'Slot Options',
      'What would you like to do?',
      [
        {
          text: 'Edit',
          onPress: () => handleEditSlot(index),
        },
        {
          text: 'Remove',
          onPress: () => handleRemoveSlot(index),
          style: 'destructive',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleViewHistory = () => {
    if (onViewHistory) return onViewHistory();
    
    // Extract the correct vehicle ID with multiple fallbacks
    const actualVehicleId = rawData?._id || rawData?.id || carId;
    
    const vehicleData = {
      _id: actualVehicleId,
      id: actualVehicleId,
      CarName: carName,
      carImages: [image],
      transmissionType: transmission,
      Carseater: seats,
      fuelType: fuel,
      pickupCity: location,
      RentPerDay: price,
      ...rawData, // Include all original data
    };
    

    // Navigate with vehicleId instead of bookingId
    navigate('BookingHistoryScreen', {
      itemType: 'car',
      vehicle: vehicleData,
      carData: vehicleData,
      vehicleId: actualVehicleId,
      vehicleType: 'Car',
      isOwnerView: true,
      from: 'ListedCarCard',
    });
  };

  const formatSlotDisplay = (slot) => {
    try {
      const fromDate = new Date(slot.fromDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const toDate = new Date(slot.toDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      const startTime = slot.times?.startTime || slot.fromTime || '';
      const endTime = slot.times?.endTime || slot.toTime || '';

      return `${fromDate} ${startTime} - ${toDate} ${endTime}`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const status = (rawData?.Status || rawData?.status || approvalStatus || '').toLowerCase().trim();
  const isPending = status === 'pending';
  const isApproved = status === 'verified' || status === 'approved';
  const isClickable = isApproved;

  return (
    <>
      <View style={[styles.card, !availability && { opacity: 0.9 }, !isClickable && { opacity: 0.6 }]}>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ flex: 1 }} disabled={!isClickable}>
          <View style={styles.contentContainer}>
            <TouchableOpacity onPress={onImagePress} activeOpacity={0.8}>
              <Image
                source={typeof image === 'string' ? { uri: image } : image}
                style={styles.carImage}
                defaultSource={require('../assets/Images/car.png')}
              />
            </TouchableOpacity>

            <View style={styles.detailsContainer}>
              <View style={styles.headerRow}>
                <Text style={styles.carName} numberOfLines={1}>{carName}</Text>
                <TouchableOpacity ref={moreButtonRef} onPress={handleMorePress} style={styles.moreButton} disabled={updating}>
                  <Image source={require('../assets/Icons/vector.png')} style={styles.moreIcon} />
                </TouchableOpacity>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/automatic.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{transmission}</Text>
                </View>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/seat.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{seats}</Text>
                </View>
              </View>

              <View style={styles.specRow}>
                <View style={styles.specItem}>
                  <Image source={require('../assets/Icons/fuel.png')} style={styles.iconImage} />
                  <Text style={styles.specText}>{fuel}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>₹{price}</Text>
                  <Text style={styles.priceUnit}>/hr</Text>
                </View>
              </View>

              <View style={styles.locationRow}>
                <Image source={require('../assets/Icons/location.png')} style={styles.iconImage} />
                <Text style={styles.locationText} numberOfLines={2}>{location}</Text>
              </View>

              {isPending && (
                <View style={styles.verificationMessageContainer}>
                  <Text style={styles.verificationMessage}>Your car is under verification</Text>
                </View>
              )}

              {isApproved && (
                <View style={styles.approvedMessageContainer}>
                  <Text style={styles.approvedMessage}>Your car is approved</Text>
                </View>
              )}

              {unavailableSlots.length > 0 && (
                <View style={{ marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: Colors.text.secondary, marginBottom: 2 }}>
                    Tap to remove • Long press to edit:
                  </Text>
                  {unavailableSlots.map((slot, index) => (
                    <TouchableOpacity
                      key={slot._id || index}
                      onPress={() => handleRemoveSlot(index)}
                      onLongPress={() => handleSlotLongPress(index)}
                      activeOpacity={0.7}
                      disabled={updating}
                      style={{ paddingVertical: 2 }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.error,
                          textDecorationLine: 'line-through',
                          marginVertical: 2,
                        }}
                      >
                        {formatSlotDisplay(slot)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.statusContainer,
                styles.unavailableStatus,
                !isApproved && { opacity: 0.5, backgroundColor: Colors.grey }
              ]}
              onPress={handleAvailabilityPress}
              activeOpacity={0.5}
              disabled={updating || !isApproved}
            >
              <Text style={[styles.statusText, styles.unavailableText]}>
                {availability ? 'Add Not Available Slot' : 'Currently Not Available'}
              </Text>
              {isApproved && <Image source={require('../assets/Icons/plus.png')} style={styles.plusIcon} />}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleViewHistory}
              activeOpacity={0.5}
              style={[
                styles.viewHistoryButton,
                !isApproved && { opacity: 0.5, backgroundColor: Colors.grey }
              ]}
              disabled={updating || !isApproved}
            >
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
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.xs, borderWidth: normalize(1), borderColor: '#FFE5E5', shadowColor: Colors.black, shadowOffset: { width: 0, height: normalize(2) }, shadowOpacity: 0.08, shadowRadius: normalize(4), elevation: 3, overflow: 'visible' },
  approvalStamp: {
    position: 'absolute',
    top: normalize(0),
    right: normalize(35),
    width: normalize(35),
    height: normalize(35),
    borderRadius: normalize(22),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: normalize(2) },
    shadowOpacity: 0.3,
    shadowRadius: normalize(4),
    elevation: 5,
  },
  approvedStamp: {
    backgroundColor: '#22C55E',
  },
  pendingStamp: {
    backgroundColor: '#F59E0B',
  },
  stampIcon: {
    fontSize: normalize(24),
    color: Colors.white,
  },
  contentContainer: { flexDirection: 'row', padding: Spacing.md },
  carImage: { width: wp(30), height: wp(30), borderRadius: BorderRadius.md, marginRight: Spacing.md, backgroundColor: '#f5f5f5' },
  detailsContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  carName: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.semiBold, fontFamily: Typography.fontFamily.medium, color: Colors.text.primary, flex: 1 },
  moreButton: { padding: Spacing.xs },
  specRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  specItem: { flexDirection: 'row', alignItems: 'center' },
  specText: { marginLeft: Spacing.xs, fontSize: Typography.fontSize.sm, color: Colors.text.secondary, fontFamily: Typography.fontFamily.regular },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 0, minWidth: normalize(60), justifyContent: 'flex-end' },
  price: { fontSize: Typography.fontSize.lg, fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily.bold, color: Colors.text.primary, includeFontPadding: false, textAlign: 'right' },
  priceUnit: { fontSize: Typography.fontSize.xs, color: Colors.text.secondary, fontFamily: Typography.fontFamily.regular, marginLeft: 2 },
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
  verificationMessageContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  verificationMessage: {
    fontSize: Typography.fontSize.sm,
    color: '#856404',
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  approvedMessageContainer: {
    backgroundColor: '#D4EDDA',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginTop: Spacing.xs,
  },
  approvedMessage: {
    fontSize: Typography.fontSize.sm,
    color: '#155724',
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
});

export default ListedCarCard;