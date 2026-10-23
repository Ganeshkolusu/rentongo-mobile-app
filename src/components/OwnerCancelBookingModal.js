/**
 * Owner Cancel Booking Modal
 * Modal component for owners to cancel a confirmed booking
 *
 * Features:
 * - Reason selection (required)
 * - Ride status check (blocks cancellation if ride in progress)
 * - Loading state with activity indicator
 * - Success/Error handling with alerts
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { handleOwnerCancelBooking, CANCEL_REASON } from '../utils/bookingFlowHelper';
import { checkRideStatus } from '../utils/bookingEdgeCases';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { BorderRadius, Spacing } from '../constants/Dimensions';

// Cancellation reasons with labels and icons
const CANCEL_REASONS = [
  {
    id: CANCEL_REASON.OWNER_UNAVAILABLE,
    label: 'I am no longer available',
    icon: 'calendar-outline',
    description: 'You have other commitments during this time'
  },
  {
    id: CANCEL_REASON.VEHICLE_ISSUE,
    label: 'Vehicle has an issue',
    icon: 'car-outline',
    description: 'Vehicle needs maintenance or repair'
  },
  {
    id: CANCEL_REASON.OWNER_REQUEST,
    label: 'Other reason',
    icon: 'ellipsis-horizontal-outline',
    description: 'Personal or other reasons'
  }
];

const OwnerCancelBookingModal = ({
  visible,
  onClose,
  booking,
  onCancelSuccess,
  onRefreshCalendar
}) => {
  const [selectedReason, setSelectedReason] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when modal opens
  const handleModalShow = useCallback(() => {
    setSelectedReason(null);
    setIsLoading(false);
  }, []);

  // Handle cancellation
  const handleCancel = async () => {
    if (!selectedReason) {
      Alert.alert('Select Reason', 'Please select a cancellation reason');
      return;
    }

    if (!booking) {
      Alert.alert('Error', 'Booking information not available');
      return;
    }

    // Check if ride has already started
    const rideStatus = checkRideStatus(booking);

    if (rideStatus.status === 'in_progress') {
      Alert.alert(
        'Ride In Progress',
        `${rideStatus.message}\n\nFor emergency cancellation, please contact support.`,
        [{ text: 'OK' }]
      );
      return;
    }

    if (rideStatus.status === 'completed') {
      Alert.alert('Cannot Cancel', rideStatus.message);
      return;
    }

    // Warn if ride starts soon (within 2 hours)
    if (rideStatus.status === 'not_started' && rideStatus.hoursUntilStart < 2) {
      Alert.alert(
        'Ride Starting Soon',
        `The ride is scheduled to start in ${Math.round(rideStatus.hoursUntilStart * 60)} minutes. ` +
          'Cancelling now may affect your rating.\n\nDo you want to continue?',
        [
          { text: 'No, Keep Booking', style: 'cancel' },
          { text: 'Yes, Cancel', style: 'destructive', onPress: () => processCancellation() }
        ]
      );
      return;
    }

    processCancellation();
  };

  // Process the actual cancellation
  const processCancellation = async () => {
    setIsLoading(true);

    try {
      const result = await handleOwnerCancelBooking({
        bookingId: booking._id || booking.id,
        vehicleId: booking.VechileId || booking.vehicleId,
        customerId: booking.userId || booking.customerId,
        availabilityId: booking.availabilityId,
        reason: selectedReason,
        fromDate: booking.FromDate
      });

      if (result.success) {
        // Refresh calendar to remove the blocked dates
        onRefreshCalendar?.();

        Alert.alert(
          'Booking Cancelled',
          'The booking has been cancelled and the customer has been notified.',
          [
            {
              text: 'OK',
              onPress: () => {
                onCancelSuccess?.();
                onClose();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to cancel booking. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Get booking details for display
  const getBookingDetails = () => {
    if (!booking) return null;

    return {
      customerName: booking.customerName || booking.userName || 'Customer',
      fromDate: booking.FromDate || booking.fromDate,
      toDate: booking.ToDate || booking.toDate,
      fromTime: booking.FromTime || booking.fromTime,
      toTime: booking.ToTime || booking.toTime
    };
  };

  const details = getBookingDetails();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleModalShow}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="close-circle-outline" size={28} color="#F44336" />
            </View>
            <Text style={styles.title}>Cancel Booking</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Booking Details */}
          {details && (
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Icon name="person-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.detailText}>{details.customerName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="calendar-outline" size={18} color={Colors.text.secondary} />
                <Text style={styles.detailText}>
                  {details.fromDate}
                  {details.toDate && details.toDate !== details.fromDate
                    ? ` to ${details.toDate}`
                    : ''}
                </Text>
              </View>
              {details.fromTime && (
                <View style={styles.detailRow}>
                  <Icon name="time-outline" size={18} color={Colors.text.secondary} />
                  <Text style={styles.detailText}>
                    {details.fromTime} - {details.toTime || ''}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Reason Selection */}
          <Text style={styles.sectionTitle}>Select cancellation reason:</Text>

          {CANCEL_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonItem,
                selectedReason === reason.id && styles.selectedReason
              ]}
              onPress={() => setSelectedReason(reason.id)}
              disabled={isLoading}
            >
              <View style={styles.reasonIconContainer}>
                <Icon
                  name={reason.icon}
                  size={22}
                  color={selectedReason === reason.id ? '#F44336' : Colors.text.secondary}
                />
              </View>
              <View style={styles.reasonContent}>
                <Text
                  style={[
                    styles.reasonLabel,
                    selectedReason === reason.id && styles.selectedReasonText
                  ]}
                >
                  {reason.label}
                </Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
              <View
                style={[
                  styles.radio,
                  selectedReason === reason.id && styles.radioSelected
                ]}
              >
                {selectedReason === reason.id && (
                  <Icon name="checkmark" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}

          {/* Warning Message */}
          <View style={styles.warningBox}>
            <Icon name="warning-outline" size={18} color="#FF9800" />
            <Text style={styles.warningText}>
              The customer will be notified and the blocked dates will be freed up for new bookings.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                (!selectedReason || isLoading) && styles.disabledBtn
              ]}
              onPress={handleCancel}
              disabled={!selectedReason || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="close-circle" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.confirmBtnText}>Cancel Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    maxHeight: '90%'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md
  },
  headerIcon: {
    marginRight: Spacing.sm
  },
  title: {
    flex: 1,
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary
  },
  closeButton: {
    padding: 4
  },
  detailsCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  detailText: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    backgroundColor: '#fff'
  },
  selectedReason: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5'
  },
  reasonIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md
  },
  reasonContent: {
    flex: 1
  },
  reasonLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
    marginBottom: 2
  },
  selectedReasonText: {
    color: '#F44336'
  },
  reasonDescription: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioSelected: {
    borderColor: '#F44336',
    backgroundColor: '#F44336'
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8E1',
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg
  },
  warningText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: '#F57C00',
    lineHeight: 18
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md
  },
  cancelBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary
  },
  confirmBtn: {
    flex: 1,
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center'
  },
  confirmBtnText: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: '#fff'
  },
  disabledBtn: {
    backgroundColor: '#BDBDBD'
  }
});

export default OwnerCancelBookingModal;
