import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const BookingNotificationCard = ({
    timeAgo = "6 min ago",
    vehicleName = "Hyundai Verna",
    transmission = "Automatic",
    seats = "5 Seaters",
    fuelType = "Petrol",
    vehicleImage,
    vehicleType = "Car",
    // Props for owner notification flow
    booking,
    onYesPress,
    onNoPress,
    onFeedbackPress,
    customerName,
    isOwner = false,
    status = 'pending', // 'pending', 'expired', 'rejected', 'confirmed', 'completed'
    hasReview = false,
}) => {
    // Get vehicle type name in lowercase (car, bike, auto)
    const getVehicleTypeName = (type) => {
        if (!type) return 'vehicle';
        const normalized = type.toLowerCase().trim();
        switch (normalized) {
            case 'car':
                return 'car';
            case 'bike':
            case 'motorcycle':
                return 'bike';
            case 'auto':
            case 'autorickshaw':
            case 'auto-rickshaw':
                return 'auto';
            default:
                return 'vehicle';
        }
    };

    const vehicleTypeName = getVehicleTypeName(vehicleType);

    // Get vehicle icon based on type
    const getVehicleIcon = () => {
        if (vehicleTypeName === 'bike') {
            return require('../../assets/Icons/gis_bike.png');
        }
        return require('../../assets/Icons/gis_car.png');
    };

    // Get dynamic header message
    const getHeaderMessage = () => {
        if (isOwner) {
            return `Your ${vehicleTypeName} has been booked?`;
        } else {
            return `You booked a ${vehicleTypeName}`;
        }
    };

    const VehicleFeature = ({ iconImage, text }) => (
        <View style={styles.featureItem}>
            <Image source={iconImage} style={styles.featureIcon} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );

    return (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={getVehicleIcon()}
                        style={[
                            styles.headerIcon,
                            vehicleTypeName === 'bike' && styles.bikeIcon
                        ]}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>
                            {getHeaderMessage()}
                        </Text>
                        {/* <Text style={styles.headerSubtitle}>Change Availability</Text> */}
                    </View>
                </View>
                <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>

            {/* Vehicle Name */}
            <Text style={styles.vehicleName}>{vehicleName}</Text>

            {/* Vehicle Features - Only show for cars */}
            {vehicleTypeName === 'car' && (
                <View style={styles.featuresContainer}>
                    <VehicleFeature
                        iconImage={require('../../assets/Icons/automatic.png')}
                        text={transmission}
                    />
                    <VehicleFeature
                        iconImage={require('../../assets/Icons/seat.png')}
                        text={seats}
                    />
                    <VehicleFeature
                        iconImage={require('../../assets/Icons/fuel.png')}
                        text={fuelType}
                    />
                </View>
            )}

            {/* Status Badge - Show for expired/rejected/confirmed/completed */}
            {isOwner && (status === 'expired' || status === 'rejected' || status === 'confirmed' || status === 'completed') && (
                <View style={[
                    styles.statusBadge,
                    status === 'expired' && styles.expiredBadge,
                    status === 'rejected' && styles.rejectedBadge,
                    status === 'confirmed' && styles.confirmedBadge,
                    status === 'completed' && styles.completedBadge,
                ]}>
                    <Icon
                        name={status === 'confirmed' || status === 'completed' ? 'checkmark-circle' : 'close-circle'}
                        size={20}
                        color={status === 'rejected' ? '#C62828' : Colors.white}
                    />
                    <Text style={[styles.statusText, status === 'rejected' && styles.rejectedText]}>
                        {status === 'expired' ? 'Expired' : status === 'rejected' ? 'Rejected' : status === 'completed' ? 'Completed' : 'Confirmed'}
                    </Text>
                </View>
            )}

            {/* Yes/No Buttons - Only show for owner with pending status */}
            {isOwner && status === 'pending' && (
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        onPress={onYesPress}
                        activeOpacity={0.8}
                        style={styles.yesButtonWrapper}
                    >
                        <LinearGradient
                            colors={['#63C8FF', '#141248']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.yesButton}
                        >
                            <Icon name="checkmark" size={20} color={Colors.white} />
                            <Text style={styles.yesButtonText}>Yes</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.noButton}
                        onPress={onNoPress}
                        activeOpacity={0.8}
                    >
                        <Icon name="close" size={20} color="#1E3A5F" />
                        <Text style={styles.noButtonText}>No</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Status Badge - Show for customer (all statuses except completed without review) */}
            {!isOwner && !(status === 'completed' && !hasReview) && (
                <View style={[
                    styles.statusBadge,
                    status === 'pending' && styles.pendingBadge,
                    status === 'expired' && styles.expiredBadge,
                    status === 'rejected' && styles.rejectedBadge,
                    status === 'confirmed' && styles.confirmedBadge,
                    status === 'completed' && styles.completedBadge,
                ]}>
                    <Icon
                        name={
                            status === 'pending' ? 'time-outline' :
                            status === 'confirmed' || status === 'completed' ? 'checkmark-circle' : 'close-circle'
                        }
                        size={20}
                        color={status === 'rejected' ? '#C62828' : status === 'pending' ? '#FF9800' : Colors.white}
                    />
                    <Text style={[
                        styles.statusText,
                        status === 'rejected' && styles.rejectedText,
                        status === 'pending' && styles.pendingText,
                    ]}>
                        {status === 'pending' ? 'Pending' :
                         status === 'expired' ? 'Expired' :
                         status === 'rejected' ? 'Rejected' :
                         status === 'completed' ? 'Completed' : 'Confirmed'}
                    </Text>
                </View>
            )}

            {/* Give Feedback Button - Show for customer when completed and no review yet */}
            {!isOwner && status === 'completed' && !hasReview && (
                <TouchableOpacity
                    onPress={onFeedbackPress}
                    activeOpacity={0.8}
                    style={styles.feedbackButtonWrapper}
                >
                    <LinearGradient
                        colors={['#63C8FF', '#141248']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.feedbackButton}
                    >
                        <Icon name="star" size={20} color={Colors.white} />
                        <Text style={styles.feedbackButtonText}>Give Feedback</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: Spacing.md,
    },
    bikeIcon: {
        width: 42,
        height: 42,
        alignSelf: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Colors.text.primary,
        marginBottom: 2,
        lineHeight: normalize(20),
    },
    // headerSubtitle: {
    //     fontSize: normalize(12),
    //     color: Colors.text.secondary,
    // },
    timeAgo: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    vehicleName: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
        marginLeft: 56,
        marginTop: Spacing.xs,
        lineHeight: normalize(24),
    },
    featuresContainer: {
        marginLeft: 56,
        gap: 6,
        marginBottom: Spacing.lg,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    featureIcon: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
        tintColor: Colors.text.secondary,
    },
    featureText: {
        fontSize: normalize(13),
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginLeft: 8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.sm,
    },
    yesButtonWrapper: {
        flex: 1,
    },
    yesButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        gap: 6,
    },
    yesButtonText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Colors.white,
    },
    noButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        paddingVertical: 14,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: '#1E3A5F',
        gap: 6,
    },
    noButtonText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: '#1E3A5F',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
        marginTop: Spacing.sm,
    },
    pendingBadge: {
        backgroundColor: '#FFF3E0',
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    expiredBadge: {
        backgroundColor: '#9E9E9E',
    },
    rejectedBadge: {
        backgroundColor: '#FFCDD2',
    },
    confirmedBadge: {
        backgroundColor: '#4CAF50',
    },
    completedBadge: {
        backgroundColor: '#2196F3',
    },
    statusText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Colors.white,
    },
    pendingText: {
        color: '#FF9800',
    },
    rejectedText: {
        color: '#C62828',
    },
    feedbackButtonWrapper: {
        marginTop: Spacing.sm,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 30,
        gap: 8,
    },
    feedbackButtonText: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Colors.white,
    },
});

export default BookingNotificationCard;