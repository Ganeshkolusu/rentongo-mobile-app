import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';
import Button from './Button/Button';
import DateTimeConfirmationPopup from './DateTimeConfirmationPopup';

const { width: screenWidth } = Dimensions.get('window');

const BookingConfirmationPopup = ({ visible, onClose, onConfirm, onCancel }) => {
    const [showDateTimePopup, setShowDateTimePopup] = useState(false);

    const handleYesPress = () => {
        // Hide the booking confirmation popup and show date time popup
        setShowDateTimePopup(true);
    };

    const handleDateTimeConfirm = (dateTimeData) => {
        // Hide the date time popup
        setShowDateTimePopup(false);
        // Trigger the success popup through onConfirm callback
        if (onConfirm) {
            onConfirm(dateTimeData);
        }
    };

    const handleDateTimeClose = () => {
        setShowDateTimePopup(false);
        onClose();
    };

    return (
        <>
            <Modal
                visible={visible && !showDateTimePopup}
                transparent={true}
                animationType="fade"
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <View style={styles.popupContainer}>
                        <Text style={styles.title}>Booking Confirmation</Text>
                        <Text style={styles.message}>
                            Did the owner confirm your booking for this vehicle?
                        </Text>

                        <View style={styles.buttonContainer}>
                            <Button
                                title="Yes"
                                onPress={handleYesPress}
                                variant="filled"
                                style={styles.yesButton}
                                icon={<Ionicons name="checkmark" size={20} color={Colors.white} />}
                            />

                            <Button
                                title="No"
                                onPress={onCancel}
                                variant="outline"
                                style={styles.noButton}
                                icon={<Ionicons name="close" size={20} color="#007BFF" />}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Time Confirmation Popup */}
            <DateTimeConfirmationPopup
                visible={showDateTimePopup}
                onClose={handleDateTimeClose}
                onConfirm={handleDateTimeConfirm}
            />
        </>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(193, 186, 186, 0.8)',
    },
    popupContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 10,
        width: screenWidth - 40,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        textAlign: 'left',
        marginBottom: 8,
    },
    message: {
        fontSize: 12,
        color: Colors.black,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'left',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    yesButton: {
        flex: 1,
    },
    noButton: {
        flex: 1,
    },
});

export default BookingConfirmationPopup;