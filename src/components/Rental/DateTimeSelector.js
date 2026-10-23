import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { navigate } from '../../services/NavigationService';

const DateTimeSelector = ({ selectedDate, selectedTime, onDateChange, onTimeChange }) => {
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [showStartTimeModal, setShowStartTimeModal] = useState(false);
    const [showEndTimeModal, setShowEndTimeModal] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState(selectedDate);
    const [selectedEndDate, setSelectedEndDate] = useState(selectedDate);
    const [selectedStartTime, setSelectedStartTime] = useState(selectedTime);
    const [selectedEndTime, setSelectedEndTime] = useState(selectedTime);

    const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        };
        return date.toLocaleDateString('en-US', options);
    };

    const handleStartDateSelect = (day) => {
        setSelectedStartDate(day.dateString);
        onDateChange(day.dateString);
        setShowStartCalendar(false);
    };

    const handleEndDateSelect = (day) => {
        setSelectedEndDate(day.dateString);
        setShowEndCalendar(false);
    };

    const handleStartTimeSelect = (time) => {
        setSelectedStartTime(time);
        onTimeChange(time);
        setShowStartTimeModal(false);
    };

    const handleEndTimeSelect = (time) => {
        setSelectedEndTime(time);
        setShowEndTimeModal(false);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Date & Time</Text>

            <TouchableOpacity
                style={styles.combinedButton}
                onPress={() => navigate('DateTimeMyBookingsScreen', { fromScreen: 'rental' })}
            >
                <View style={styles.combinedContent}>
                    <View style={styles.dateSection}>
                        <View style={styles.buttonHeader}>
                            <Image source={require('../../assets/Icons/calender.png')} style={styles.calendarIcon} />
                            <Text style={styles.selectLabel}>Start</Text>
                        </View>
                        <Text style={styles.selectValue}>Select</Text>
                    </View>
                    <View style={styles.dateDivider} />
                    <View style={styles.dateSection}>
                        <View style={styles.buttonHeader}>
                            <Image source={require('../../assets/Icons/calender.png')} style={styles.calendarIcon} />
                            <Text style={styles.selectLabel}>End</Text>
                        </View>
                        <Text style={styles.selectValue}>Select</Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Start Calendar Modal */}
            <Modal
                visible={showStartCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowStartCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Start Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowStartCalendar(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            onDayPress={handleStartDateSelect}
                            markedDates={{
                                [selectedStartDate]: { selected: true, selectedColor: '#007AFF' }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#007AFF',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#007AFF',
                                dayTextColor: '#2d4150',
                                textDisabledColor: '#d9e1e8',
                                arrowColor: '#007AFF',
                                monthTextColor: '#2d4150',
                                indicatorColor: '#007AFF',
                                textDayFontWeight: '300',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '300',
                                textDayFontSize: 16,
                                textMonthFontSize: 16,
                                textDayHeaderFontSize: 13,
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* End Calendar Modal */}
            <Modal
                visible={showEndCalendar}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEndCalendar(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select End Date</Text>
                            <TouchableOpacity
                                onPress={() => setShowEndCalendar(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Calendar
                            onDayPress={handleEndDateSelect}
                            markedDates={{
                                [selectedEndDate]: { selected: true, selectedColor: '#007AFF' }
                            }}
                            theme={{
                                selectedDayBackgroundColor: '#007AFF',
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: '#007AFF',
                                dayTextColor: '#2d4150',
                                textDisabledColor: '#d9e1e8',
                                arrowColor: '#007AFF',
                                monthTextColor: '#2d4150',
                                indicatorColor: '#007AFF',
                                textDayFontWeight: '300',
                                textMonthFontWeight: 'bold',
                                textDayHeaderFontWeight: '300',
                                textDayFontSize: 16,
                                textMonthFontSize: 16,
                                textDayHeaderFontSize: 13,
                            }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Start Time Selection Modal */}
            <Modal
                visible={showStartTimeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowStartTimeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.timeContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Start Time</Text>
                            <TouchableOpacity
                                onPress={() => setShowStartTimeModal(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.timeSlots}>
                            {timeSlots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeSlot,
                                        selectedStartTime === time && styles.selectedTimeSlot
                                    ]}
                                    onPress={() => handleStartTimeSelect(time)}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        selectedStartTime === time && styles.selectedTimeSlotText
                                    ]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* End Time Selection Modal */}
            <Modal
                visible={showEndTimeModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowEndTimeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.timeContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select End Time</Text>
                            <TouchableOpacity
                                onPress={() => setShowEndTimeModal(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.timeSlots}>
                            {timeSlots.map((time) => (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeSlot,
                                        selectedEndTime === time && styles.selectedTimeSlot
                                    ]}
                                    onPress={() => handleEndTimeSelect(time)}
                                >
                                    <Text style={[
                                        styles.timeSlotText,
                                        selectedEndTime === time && styles.selectedTimeSlotText
                                    ]}>
                                        {time}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.white,
        margin: Spacing.md,
        padding: Spacing.md,
        borderRadius: 15,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: normalize(-5)
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: 10,
    },
    selectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    selectButton: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 70,
    },
    buttonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    calendarIcon: {
        width: 18,
        height: 18,
        marginRight: 6,
        tintColor: Colors.text.secondary,
    },
    selectLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
    },
    selectValue: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginTop: 2,
    },
    combinedButton: {
        backgroundColor: Colors.white,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    combinedContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    dateSection: {
        flex: 1,
        alignItems: 'center',
    },
    dateDivider: {
        width: 1,
        height: 35,
        backgroundColor: Colors.border,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    calendarContainer: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxWidth: 350,
    },
    timeContainer: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        padding: 20,
        width: '100%',
        maxWidth: 300,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
    },
    timeSlots: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    timeSlot: {
        width: '48%',
        padding: 15,
        borderRadius: 10,
        backgroundColor: Colors.background,
        marginBottom: 10,
        alignItems: 'center',
    },
    selectedTimeSlot: {
        backgroundColor: Colors.primary,
    },
    timeSlotText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
    },
    selectedTimeSlotText: {
        color: Colors.white,
    },
});

export default DateTimeSelector;