import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const TimeSelectionMyBookings = ({
  onTimeChange,
  isModal,
  initialStartTime,
  initialEndTime,
}) => {
  // Parse initial times into hours and minutes
  const parseTime = (timeStr) => {
    if (!timeStr) return { hour: '06', minute: '00' };
    const [hour, minute] = timeStr.split(':');
    return { hour: hour || '06', minute: minute || '00' };
  };

  const initialStart = parseTime(initialStartTime || '06:00');
  const initialEnd = parseTime(initialEndTime || '08:00');

  const [startHour, setStartHour] = useState(initialStart.hour);
  const [startMinute, setStartMinute] = useState(initialStart.minute);
  const [endHour, setEndHour] = useState(initialEnd.hour);
  const [endMinute, setEndMinute] = useState(initialEnd.minute);

  // Update state when props change
  useEffect(() => {
    if (initialStartTime) {
      const parsed = parseTime(initialStartTime);
      setStartHour(parsed.hour);
      setStartMinute(parsed.minute);
    }
    if (initialEndTime) {
      const parsed = parseTime(initialEndTime);
      setEndHour(parsed.hour);
      setEndMinute(parsed.minute);
    }
  }, [initialStartTime, initialEndTime]);

  // Notify parent when times change
  useEffect(() => {
    if (onTimeChange) {
      const startTime = `${startHour}:${startMinute}`;
      const endTime = `${endHour}:${endMinute}`;
      onTimeChange({ startTime, endTime });
    }
  }, [startHour, startMinute, endHour, endMinute]);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

  // Generate minutes (00-59) in 5-minute intervals for easier selection
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

  const renderPickerItem = (value, selectedValue, onSelect, isMinute = false) => (
    <TouchableOpacity
      key={value}
      style={[
        styles.pickerItem,
        selectedValue === value && styles.selectedPickerItem,
      ]}
      onPress={() => onSelect(value)}
    >
      <Text
        style={[
          styles.pickerText,
          selectedValue === value && styles.selectedPickerText,
        ]}
      >
        {value}
      </Text>
    </TouchableOpacity>
  );

  const selectedStartTime = `${startHour}:${startMinute}`;
  const selectedEndTime = `${endHour}:${endMinute}`;

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      <Text style={[styles.sectionTitle, isModal && styles.modalSectionTitle]}>
        Confirm Time
      </Text>

      {/* Start Time Picker */}
      <View style={styles.timePickerSection}>
        <Text style={styles.timeLabel}>Start Time</Text>
        <View style={[styles.timePickerRow, isModal && styles.modalTimePickerRow]}>
          {/* Hour Picker */}
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Hour</Text>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled={true}
              style={styles.pickerScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {hours.map((hour) =>
                renderPickerItem(hour, startHour, setStartHour)
              )}
            </ScrollView>
          </View>

          <Text style={styles.timeSeparatorColon}>:</Text>

          {/* Minute Picker */}
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Min</Text>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled={true}
              style={styles.pickerScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {minutes.map((minute) =>
                renderPickerItem(minute, startMinute, setStartMinute, true)
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* End Time Picker */}
      <View style={styles.timePickerSection}>
        <Text style={styles.timeLabel}>End Time</Text>
        <View style={[styles.timePickerRow, isModal && styles.modalTimePickerRow]}>
          {/* Hour Picker */}
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Hour</Text>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled={true}
              style={styles.pickerScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {hours.map((hour) =>
                renderPickerItem(hour, endHour, setEndHour)
              )}
            </ScrollView>
          </View>

          <Text style={styles.timeSeparatorColon}>:</Text>

          {/* Minute Picker */}
          <View style={styles.pickerColumn}>
            <Text style={styles.pickerLabel}>Min</Text>
            <ScrollView
              showsVerticalScrollIndicator
              nestedScrollEnabled={true}
              style={styles.pickerScroll}
              contentContainerStyle={styles.scrollContent}
            >
              {minutes.map((minute) =>
                renderPickerItem(minute, endMinute, setEndMinute, true)
              )}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Selected Times Display */}
      <View style={styles.selectedTimesContainer}>
        <View style={styles.selectedTimeBox}>
          <Text style={styles.selectedTimeLabel}>From</Text>
          <Text style={styles.selectedTimeValue}>{selectedStartTime}</Text>
        </View>
        <Text style={styles.timeSeparator}>→</Text>
        <View style={styles.selectedTimeBox}>
          <Text style={styles.selectedTimeLabel}>To</Text>
          <Text style={styles.selectedTimeValue}>{selectedEndTime}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  modalContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.black,
    marginBottom: Spacing.md,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  timePickerSection: {
    marginBottom: Spacing.md,
  },
  timeLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: Spacing.md,
    height: 150,
  },
  modalTimePickerRow: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  pickerScroll: {
    maxHeight: 100,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
    minWidth: 50,
  },
  selectedPickerItem: {
    backgroundColor: Colors.primary,
  },
  pickerText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
  selectedPickerText: {
    color: Colors.white,
    fontWeight: '700',
  },
  timeSeparatorColon: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    marginHorizontal: Spacing.sm,
  },
  selectedTimesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  selectedTimeBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  selectedTimeLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: 4,
  },
  selectedTimeValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  timeSeparator: {
    fontSize: 20,
    color: Colors.text.secondary,
    marginHorizontal: Spacing.sm,
  },
});

export default TimeSelectionMyBookings;
