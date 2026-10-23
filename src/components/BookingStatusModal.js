import { BlurView } from 'expo-blur';
import React from 'react';
import {
    Dimensions,
    Image,
    Modal,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Button from './Button/Button';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing, normalize } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const { width } = Dimensions.get('window');

const BookingStatusModal = ({ visible, status, onClose }) => {
    const isAccepted = status === 'accepted';
    const isAutoCancelled = status === 'autocancelled' || status === 'AutoCancelled';

    // Choose image and title based on status
    const image = isAccepted
        ? require('../assets/Images/happy.png')
        : require('../assets/Images/unhappy.png');

    // Set title based on status
    let title = 'Booking Rejected';
    if (isAccepted) {
        title = 'Booking Confirmed!';
    } else if (isAutoCancelled) {
        title = 'Booking Auto-Cancelled';
    }

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Blurred background overlay */}
                <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />

                {/* Popup Card */}
                <View style={styles.popup}>
                    <Image
                        source={image}
                        style={styles.icon}
                    />

                    <Text style={styles.title}>
                        {title}
                    </Text>

                    <Button
                        title="OK"
                        onPress={onClose}
                        style={styles.okButton}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default BookingStatusModal;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent backdrop
        justifyContent: 'center',
        alignItems: 'center',
    },
    popup: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        width: width * 0.85,
        paddingVertical: Spacing.xxl,
        paddingHorizontal: Spacing.xl,
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 12,
    },
    icon: {
        width: normalize(150),
        height: normalize(150),
        resizeMode: 'contain',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
        lineHeight: Typography.lineHeight.xl,
    },
    okButton: {
        width: '100%',
        marginTop: Spacing.md,
    },
});
