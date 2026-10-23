import { BlurView } from 'expo-blur';
import React from 'react';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing, normalize } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import Button from './Button/Button';

const { width } = Dimensions.get('window');

const BookingRejectScreen = ({ route, navigation }) => {
    // Get status from navigation params (accepted, rejected, cancelled, or autocancelled)
    const status = route.params?.status || 'rejected';
    const isAccepted = status === 'accepted';
    const isCancelled = status === 'cancelled' || status === 'Cancelled';
    const isAutoCancelled = status === 'autocancelled' || status === 'AutoCancelled';

    const handleOkay = () => {
        if (isAccepted) {
            // Navigate to Dashboard with My Bookings tab active
            navigation.reset({
                index: 0,
                routes: [{ name: 'DashBoard', params: { activeTab: 'My Bookings' } }],
            });
        } else {
            // Navigate to Dashboard for cancelled/rejected
            navigation.reset({
                index: 0,
                routes: [{ name: 'DashBoard' }],
            });
        }
    };

    // Choose image and title based on status
    const image = isAccepted
        ? require('../assets/Images/happy.png')
        : require('../assets/Images/unhappy.png');

    // Set title based on status
    let title = 'Booking Rejected';
    if (isAccepted) {
        title = 'Booking Confirmed!';
    } else if (isCancelled) {
        title = 'Booking Cancelled';
    } else if (isAutoCancelled) {
        title = 'Booking Auto-Cancelled';
    }

    return (
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
                    onPress={handleOkay}
                    style={styles.okButton}
                />
            </View>
        </View>
    );
};

export default BookingRejectScreen;

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
