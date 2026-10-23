import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import Button from './Button/Button';
import { Colors } from '../constants/Colors';
import { normalize, wp, hp, Spacing, BorderRadius, responsiveValue } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const ListedBookingCard = ({
    title,
    image,
    transmission = 'Automatic',
    seats = '5 Seaters',
    fuel = 'Petrol',
    location,
    price,
    unit = '/hr',
    onViewHistory,
    onPress
}) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
            <View style={styles.contentContainer}>
                <Image source={image} style={styles.vehicleImage} />

                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.vehicleTitle}>{title}</Text>
                        <View style={styles.priceContainer}>
                            <Text style={styles.price}>₹{price}</Text>
                            <Text style={styles.unit}>{unit}</Text>
                        </View>
                    </View>

                    <View style={styles.specsContainer}>
                        <View style={styles.specRow}>
                            <Image
                                source={require('../assets/Icons/automatic.png')}
                                style={styles.specIcon}
                            />
                            <Text style={styles.specText}>{transmission}</Text>
                        </View>

                        <View style={styles.specRow}>
                            <Image
                                source={require('../assets/Icons/seat.png')}
                                style={styles.specIcon}
                            />
                            <Text style={styles.specText}>{seats}</Text>
                        </View>

                        <View style={styles.specRow}>
                            <Image
                                source={require('../assets/Icons/fuel.png')}
                                style={styles.specIcon}
                            />
                            <Text style={styles.specText}>{fuel}</Text>
                        </View>
                    </View>

                    <View style={styles.locationRow}>
                        <Image
                            source={require('../assets/Icons/location.png')}
                            style={styles.locationIcon}
                        />
                        <Text style={styles.locationText} numberOfLines={2}>
                            {location}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.historyButtonContainer}>
                <Button
                    title="View Booking History"
                    onPress={onViewHistory}
                    variant="tertiary"
                    style={styles.historyButtonStyle}
                />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: normalize(16),
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
        overflow: 'hidden',
    },
    contentContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
    },
    vehicleImage: {
        width: wp(28),
        height: wp(28),
        borderRadius: normalize(12),
        resizeMode: 'cover',
    },
    detailsContainer: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    vehicleTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
        flex: 1,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    price: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
    },
    unit: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    specsContainer: {
        marginBottom: Spacing.sm,
    },
    specRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(4),
    },
    specIcon: {
        width: normalize(16),
        height: normalize(16),
        marginRight: Spacing.xs,
        tintColor: Colors.text.secondary,
    },
    specText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginTop: Spacing.xs,
    },
    locationIcon: {
        width: normalize(16),
        height: normalize(16),
        marginRight: Spacing.xs,
        marginTop: normalize(2),
        tintColor: Colors.text.secondary,
    },
    locationText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: Typography.lineHeight.sm,
    },
    historyButtonContainer: {
        paddingHorizontal: Spacing.sm,
        borderTopWidth: 0,
        marginBottom: Spacing.sm,
        marginTop: normalize(-10)
    },
    historyButtonStyle: {
        marginHorizontal: Spacing.xs,
    },
});

export default ListedBookingCard;