import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../constants/Dimensions';
import Button from './Button/Button';
import DateSelectionSection from './DateTime/DateSelectionSection';
import TimeSelectionSection from './DateTime/TimeSelectionSection';

const { width: screenWidth } = Dimensions.get('window');

const DateTimeConfirmationPopup = ({ visible, onClose, onConfirm }) => {
  const [selectedFromDate, setSelectedFromDate] = useState(null);
  const [selectedToDate, setSelectedToDate] = useState(null);
  const [selectedStartTime, setSelectedStartTime] = useState('06:00 PM');
  const [selectedEndTime, setSelectedEndTime] = useState('08:00 PM');

  // Handle date change from DateSelectionSection
  const handleDateChange = ({ fromDate, toDate }) => {
    if (fromDate) setSelectedFromDate(fromDate);
    if (toDate) setSelectedToDate(toDate);
  };

  // Handle time change from TimeSelectionSection
  const handleTimeChange = ({ startTime, endTime }) => {
    setSelectedStartTime(startTime);
    setSelectedEndTime(endTime);
  };

  const handleConfirm = () => {
    const bookingData = {
      fromDate: selectedFromDate,
      toDate: selectedToDate,
      startTime: selectedStartTime,
      endTime: selectedEndTime,
    };
    onConfirm(bookingData);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={StyleSheet.absoluteFillObject}
      >
        <BlurView intensity={70} tint="dark" style={styles.overlay}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.container}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Confirm Date & Time of your booking</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Scroll Content */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Date Picker Section */}
              <DateSelectionSection
                onDateChange={handleDateChange}
                fromScreen="booking"
                isModal
              />

              {/* Time Picker Section */}
              <TimeSelectionSection
                onTimeChange={handleTimeChange}
                isModal
              />

              {/* Confirmation Button */}
              <View style={styles.buttonContainer}>
                <Button title="Confirm" onPress={handleConfirm} />
              </View>
            </ScrollView>
          </TouchableOpacity>
        </BlurView>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    fontWeight:'bold',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: normalize(15),
    top: normalize(3),
    padding: 2,
  },
  closeText: {
    fontSize: 30,
    color: Colors.blaxk,
  },
  scrollContent: {
    paddingBottom: Spacing.xs,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
});

export default DateTimeConfirmationPopup;
