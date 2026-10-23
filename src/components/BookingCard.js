import React, { useRef, useState } from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import BookingOptionsPopup from './BookingOptionsPopup';

const BookingCard = ({
    title,
    date,
    status,
    price,
    unit,
    image,
    type,
    onPress,
    onDetails,
    onDelete
}) => {
    const [showPopup, setShowPopup] = useState(false);
    const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
    const [imageError, setImageError] = useState(false);
    const moreButtonRef = useRef(null);

    // ✅ Get status colors based on booking status
    const getStatusColor = (status) => {
        const normalizedStatus = (status || '').toLowerCase().trim();
        
        switch (normalizedStatus) {
            case 'completed':
            case 'confirmed':
                return {
                    backgroundColor: Colors.successLight || '#E8F5E9',
                    textColor: Colors.success || '#2E7D32',
                };
            case 'cancelled':
            case 'autocancelled':
            case 'auto cancelled':
                return {
                    backgroundColor: Colors.errorLight || '#FFEBEE',
                    textColor: Colors.error || '#F44336',
                };
            case 'pending':
                return {
                    backgroundColor: '#FFF9C4', // Light yellow
                    textColor: '#FFA500', // Dark yellow/amber
                };
            default:
                return {
                    backgroundColor: Colors.successLight || '#E8F5E9',
                    textColor: Colors.success || '#4CAF50',
                };
        }
    };

    const statusColors = getStatusColor(status);

    // ✅ Get default image based on vehicle type (require inside function for Metro bundler)
    const getDefaultImage = () => {
        const vehicleType = (type || '').toLowerCase();
        if (vehicleType === 'bike') {
            return require('../assets/Images/bike.png');
        }
        if (vehicleType === 'auto') {
            return require('../assets/Images/auto.png');
        }
        return require('../assets/Images/car1.png'); // Default to car for car/unknown types
    };

    // ✅ Get image source with fallback
    const getImageSource = () => {
        try {
            // If image failed to load, use default
            if (imageError) {
                return getDefaultImage();
            }
            // If no image provided, use default
            if (!image || image === null || image === undefined) {
                return getDefaultImage();
            }
            // If image is a require() result (number), use it directly
            if (typeof image === 'number' && image > 0) {
                return image;
            }
            // If image is a URI string
            if (typeof image === 'string') {
                const trimmed = image.trim();
                if (trimmed !== '' && (trimmed.startsWith('http://') || trimmed.startsWith('https://'))) {
                    return { uri: trimmed };
                }
                return getDefaultImage();
            }
            // If image is an object with uri
            if (image && typeof image === 'object' && image.uri) {
                const uri = String(image.uri).trim();
                if (uri !== '' && (uri.startsWith('http://') || uri.startsWith('https://'))) {
                    return { uri: uri };
                }
                return getDefaultImage();
            }
            // Fallback to default for any other case
            return getDefaultImage();
        } catch (error) {
            // If anything goes wrong, return default
            return getDefaultImage();
        }
    };

    const handleMorePress = () => {
        moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
            setPopupPosition({
                top: py + height,
                right: normalize(20)
            });
            setShowPopup(true);
        });
    };

    const popupOptions = [
        {
            id: 'details',
            title: 'Details',
            icon: require('../assets/Icons/info1.png'),
            showArrow: true,
            onPress: () => onDetails && onDetails()
        },
        {
            id: 'delete',
            title: 'Delete',
            icon: require('../assets/Icons/delete.png'),
            isDelete: true,
            onPress: () => onDelete && onDelete()
        }
    ];

    // ✅ Parse date range if it contains ' - '
    const parseDateRange = (dateString) => {
        if (!dateString) return { fromDate: 'N/A', toDate: null };
        
        if (dateString.includes(' - ')) {
            const [from, to] = dateString.split(' - ');
            return { fromDate: from.trim(), toDate: to.trim() };
        }
        
        // Single date format
        return { fromDate: dateString, toDate: null };
    };

    const { fromDate, toDate } = parseDateRange(date);

    return (
        <>
        <TouchableOpacity style={styles.bookingCard} onPress={onPress}>
            <Image
                source={getImageSource()}
                style={styles.vehicleImage}
                resizeMode="cover"
                onError={() => setImageError(true)}
            />

            <View style={[styles.bookingDetails, type === 'auto' && styles.autoBookingDetails]}>
                <Text style={styles.vehicleTitle}>{title}</Text>

                {/* ✅ Date Column Layout */}
                <View style={styles.dateColumn}>
                    <View style={styles.dateRow}>
                        <Image
                            source={require('../assets/Icons/calender.png')}
                            style={styles.calendarIcon}
                        />
                        <Text style={styles.dateLabel}>From: </Text>
                        <Text style={styles.dateValue}>{fromDate}</Text>
                    </View>
                    
                    {toDate && (
                        <View style={styles.dateRow}>
                            <Image
                                source={require('../assets/Icons/calender.png')}
                                style={styles.calendarIcon}
                            />
                            <Text style={styles.dateLabel}>To: </Text>
                            <Text style={styles.dateValue}>{toDate}</Text>
                        </View>
                    )}
                </View>

                {type !== 'auto' && (
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Status: </Text>
                        <View style={[
                            styles.statusBadge, 
                            { backgroundColor: statusColors.backgroundColor }
                        ]}>
                            <Text style={[
                                styles.statusText, 
                                { color: statusColors.textColor }
                            ]}>
                                {status}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            <View style={styles.priceSection}>
                <TouchableOpacity
                    ref={moreButtonRef}
                    style={styles.moreButton}
                    onPress={handleMorePress}
                >
                    <Image
                        source={require('../assets/Icons/vector.png')}
                        style={styles.moreIcon}
                    />
                </TouchableOpacity>

                <View style={styles.priceContainer}>
                    <Text style={styles.price}>{price}</Text>
                    <Text style={styles.unit}>{unit}</Text>
                </View>
            </View>
        </TouchableOpacity>

        <BookingOptionsPopup
            visible={showPopup}
            onClose={() => setShowPopup(false)}
            options={popupOptions}
            position={popupPosition}
        />
        </>
    );
};

const styles = StyleSheet.create({
    bookingCard: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.md,
        marginBottom: Spacing.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    vehicleImage: {
        width: wp(25),
        height: wp(25),
        borderRadius: normalize(8),
        resizeMode: 'cover',
        backgroundColor: '#F0F0F0',
    },
    bookingDetails: {
        flex: 1,
        marginLeft: Spacing.md,
        justifyContent: 'center',
    },
    autoBookingDetails: {
        justifyContent: 'flex-start',
        paddingTop: Spacing.sm,
    },
    vehicleTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.xs,
    },
    dateColumn: {
        marginBottom: Spacing.xs,
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(3),
    },
    calendarIcon: {
        width: normalize(12),
        height: normalize(12),
        marginRight: normalize(4),
        tintColor: Colors.text.secondary,
    },
    dateLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    dateValue: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        fontWeight: Typography.fontWeight.semiBold,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    statusBadge: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: Spacing.xs,
        borderRadius: normalize(5),
    },
    statusText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.medium,
    },
    priceSection: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    moreButton: {
        padding: Spacing.xs,
    },
    moreIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.text.secondary,
        resizeMode: 'contain',
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
    },
    unit: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
});

export default BookingCard;