import { useNavigation } from '@react-navigation/native';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const BookingHistoryItem = ({ item, navigation: navigationProp, from }) => {
    const navigationHook = useNavigation();
    const navigation = navigationProp || navigationHook;

    const handlePress = () => {
        if (item) {
            navigation.navigate('BookingDetailsScreen', { item, from });
        }
    };

    if (!item) return null;

    // ✅ Extract times from rawBooking FIRST
    const fromTime = 
        item.rawBooking?.FromTime || 
        item.rawBooking?.fromTime || 
        item.FromTime || 
        item.fromTime || 
        '6:00 AM';

    const toTime = 
        item.rawBooking?.ToTime || 
        item.rawBooking?.toTime || 
        item.ToTime || 
        item.toTime || 
        '6:00 PM';

    // ✅ Calculate number of days between dates (INCLUSIVE)
    const calculateDays = (from, to) => {
        if (!from || !to) return 0;
        
        // Parse dates (handle DD-MM-YYYY format)
        const parseDate = (dateStr) => {
            if (!dateStr) return null;
            
            if (dateStr.includes('-')) {
                const parts = dateStr.split('-');
                if (parts.length === 3) {
                    // DD-MM-YYYY format
                    return new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
            return new Date(dateStr);
        };

        const startDate = parseDate(from);
        const endDate = parseDate(to);
        
        if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return 0;
        }
        
        // Calculate difference in days
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // ✅ ADD 1 to include both start and end dates
        return diffDays + 1;
    };

    // ✅ Get vehicle type with fallback (handle both spelling variations)
    const vehicleType = 
        item.type || 
        item.vehicleType || 
        item.rawBooking?.vechileType || 
        item.rawBooking?.vehicleType || 
        'Vehicle';

    // ✅ Calculate hours between two times
    const calculateHoursBetweenTimes = (fromTime, toTime, fromDate, toDate) => {
        if (!fromTime || !toTime || !fromDate || !toDate) return 0;
        
        try {
            // Parse time string (e.g., "01:30 AM", "06 PM")
            const parseTime = (timeStr) => {
                if (!timeStr) return { hours: 0, minutes: 0 };
                
                // Handle formats like "06 PM" or "01:30 AM"
                const cleanTime = timeStr.trim();
                const parts = cleanTime.split(/[:\s]+/);
                
                let hours = 0;
                let minutes = 0;
                let isPM = cleanTime.toLowerCase().includes('pm');
                
                if (parts.length >= 1) {
                    hours = parseInt(parts[0]) || 0;
                    if (parts.length >= 2 && !isNaN(parseInt(parts[1]))) {
                        minutes = parseInt(parts[1]) || 0;
                    }
                }
                
                // Convert to 24-hour format
                if (isPM && hours !== 12) hours += 12;
                if (!isPM && hours === 12) hours = 0;
                
                return { hours, minutes };
            };
            
            const fromTimeParsed = parseTime(fromTime);
            const toTimeParsed = parseTime(toTime);
            
            // Calculate days difference
            const days = calculateDays(fromDate, toDate);
            
            // Calculate total hours
            const fromTotalMinutes = fromTimeParsed.hours * 60 + fromTimeParsed.minutes;
            const toTotalMinutes = toTimeParsed.hours * 60 + toTimeParsed.minutes;
            
            // For multi-day bookings: (days - 1) * 24 + time difference
            let totalHours = 0;
            if (days > 1) {
                // Full days in between + partial hours on first and last day
                const timeDiffMinutes = toTotalMinutes - fromTotalMinutes;
                totalHours = ((days - 1) * 24) + (timeDiffMinutes / 60);
            } else {
                // Same day booking
                totalHours = (toTotalMinutes - fromTotalMinutes) / 60;
            }
            
            return Math.max(0, Math.ceil(totalHours));
        } catch (error) {

            return 0;
        }
    };

    // ✅ Get the booking rate and calculate pricing
    const getPricingInfo = () => {
        const days = calculateDays(item.fromDate, item.toDate);
        
        // Get base rates from item
        const pricePerDay = Number(item.pricePerDay || item.rawBooking?.pricePerDay || 0);
        const pricePerHour = Number(item.pricePerHour || item.rawBooking?.pricePerHour || 0);
        const pricePerKm = Number(item.pricePerKm || item.rawBooking?.pricePerKm || 0);
        const totalPrice = Number(item.totalPrice || item.rawBooking?.totalPrice || 0);
        const totalHoursFromBackend = Number(item.totalHours || item.rawBooking?.totalHours || 0);
        

        // CARS: Show per day rate and calculate total based on days
        if (pricePerDay > 0) {
            const calculatedTotal = pricePerDay * days;
            

            return {
                rateAmount: `₹${pricePerDay.toLocaleString('en-IN')}`,
                rateUnit: '/day',
                days: days,
                daysText: `${days} ${days === 1 ? 'day' : 'days'}`,
                calculatedTotal: calculatedTotal,
                totalAmount: calculatedTotal, // ✅ Always use calculated total for daily bookings
                showCalculation: true
            };
        }

        // CARS: Show per hour rate and calculate based on actual hours
        if (pricePerHour > 0) {
            // Calculate actual hours from time difference
            const calculatedHours = calculateHoursBetweenTimes(fromTime, toTime, item.fromDate, item.toDate);
            
            // Use backend hours if available, otherwise use calculated
            const hoursToUse = totalHoursFromBackend > 0 ? totalHoursFromBackend : calculatedHours;
            const calculatedTotal = pricePerHour * hoursToUse;
            

            return {
                rateAmount: `₹${pricePerHour.toLocaleString('en-IN')}`,
                rateUnit: '/hr',
                days: hoursToUse,
                daysText: `${hoursToUse} ${hoursToUse === 1 ? 'hour' : 'hours'}`,
                calculatedTotal: calculatedTotal,
                totalAmount: calculatedTotal, // ✅ Always use calculated total for hourly bookings
                showCalculation: true
            };
        }

        // BIKES/AUTOS: Show per km rate (use backend total)
        if (pricePerKm > 0) {
            return {
                rateAmount: `₹${pricePerKm.toLocaleString('en-IN')}`,
                rateUnit: '/km',
                days: 0,
                daysText: null,
                calculatedTotal: 0,
                totalAmount: totalPrice, // Use backend total for per-km bookings
                showCalculation: false
            };
        }

        // Fallback: Just show total
        return {
            rateAmount: `₹${totalPrice.toLocaleString('en-IN')}`,
            rateUnit: '/total',
            days: 0,
            daysText: null,
            calculatedTotal: 0,
            totalAmount: totalPrice,
            showCalculation: false
        };
    };

    const pricingInfo = getPricingInfo();

    // ✅ Format mobile number to show only last 2 digits
    const formatMobileNumber = (mobile) => {
        if (!mobile) return 'N/A';
        const mobileStr = String(mobile);
        if (mobileStr.length < 2) return mobileStr;
        const lastTwo = mobileStr.slice(-2);
        // Always show exactly 8 X's followed by last 2 digits
        return 'XXXXXXXX' + lastTwo;
    };

    // ✅ Format price with Indian currency format
    const formatPrice = (price) => {
        if (!price || price === 0) return '₹0';
        return `₹${Number(price).toLocaleString('en-IN')}`;
    };

    // ✅ Get customer name with fallback
    const customerName = item.customerName || item.contactName || item.rawBooking?.contactName || 'Customer';

    // ✅ Get mobile number with fallback
    const mobileNo = item.mobileNo || item.contactNumber || item.rawBooking?.contactNumber || '';

    // ✅ Get status with fallback
    const status = item.status || item.rawBooking?.status || 'Pending';

    return (
        <TouchableOpacity
            style={styles.historyItem}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <View style={styles.historyHeader}>
                <Image
                    source={require('../../assets/Icons/phone_outline.png')}
                    style={styles.phoneIcon}
                />
                <Text style={styles.customerName}>{customerName}</Text>
                
                {/* ✅ Vehicle Type Badge
                <View style={styles.vehicleTypeBadge}>
                    <Text style={styles.vehicleTypeText}>{vehicleType}</Text>
                </View> */}
            </View>

            <View style={styles.dateTimeContainer}>
                {/* Date Row */}
                <View style={styles.dateTimeRow}>
                    <Image
                        source={require('../../assets/Icons/calender.png')}
                        style={styles.calendarIcon}
                    />
                    <Text style={styles.dateLabel}>From: </Text>
                    <Text style={styles.dateText}>{item.fromDate || 'N/A'}</Text>
                    <View style={styles.verticalDivider} />
                    <Image
                        source={require('../../assets/Icons/calender.png')}
                        style={styles.calendarIcon}
                    />
                    <Text style={styles.dateLabel}>To: </Text>
                    <Text style={styles.dateText}>{item.toDate || 'N/A'}</Text>
                </View>

                {/* Time Row - Shows actual user-selected times */}
                <View style={styles.dateTimeRow}>
                    <Image
                        source={require('../../assets/Icons/clock.png')}
                        style={styles.clockIcon}
                    />
                    <Text style={styles.dateLabel}>From: </Text>
                    <Text style={styles.timeText}>{fromTime}</Text>
                    <View style={styles.verticalDivider} />
                    <Image
                        source={require('../../assets/Icons/clock.png')}
                        style={styles.clockIcon}
                    />
                    <Text style={styles.dateLabel}>To: </Text>
                    <Text style={styles.timeText}>{toTime}</Text>
                </View>
            </View>

            {/* Mobile Number Row */}
            <View style={styles.mobileRow}>
                <Text style={styles.mobileLabel}>Mobile No: </Text>
                <Text style={styles.mobileText}>
                    {formatMobileNumber(mobileNo)}
                </Text>
            </View>

            {/* ✅ Rate Per Day/Hour/Km Row */}
            <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Rate: </Text>
                <View style={styles.rateValue}>
                    <Text style={styles.rateAmount}>{pricingInfo.rateAmount}</Text>
                    <Text style={styles.rateUnit}>{pricingInfo.rateUnit}</Text>
                    {/* {pricingInfo.daysText && (
                        <Text style={styles.rateSubText}> × {pricingInfo.daysText}</Text>
                    )} */}
                </View>
            </View>

            {/* ✅ Total Amount Row - Shows Calculated Total */}
            {pricingInfo.totalAmount > 0 && (
                <View style={styles.totalPriceRow}>
                    <Text style={styles.totalPriceLabel}>Total Amount: </Text>
                    <View style={styles.totalPriceContainer}>
                        <Text style={styles.totalPriceValue}>
                            {formatPrice(pricingInfo.totalAmount)}
                        </Text>
                        {/* {pricingInfo.showCalculation && pricingInfo.days > 0 && (
                            <Text style={styles.calculationText}>
                                ({pricingInfo.rateAmount} × {pricingInfo.days})
                            </Text>
                        )} */}
                    </View>
                </View>
            )}

            {/* ✅ STATUS BADGE */}
            <View style={styles.statusContainer}>
                <Text style={styles.statusLabel}>Status: </Text>
                <View
                    style={[
                        styles.statusBadge,
                        status === 'Confirmed' && styles.statusConfirmed,
                        status === 'Pending' && styles.statusPending,
                        (status === 'Cancelled' || status === 'AutoCancelled') && styles.statusCancelled,
                        status === 'Completed' && styles.statusCompleted,
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            status === 'Confirmed' && styles.statusTextConfirmed,
                            status === 'Pending' && styles.statusTextPending,
                            (status === 'Cancelled' || status === 'AutoCancelled') && styles.statusTextCancelled,
                            status === 'Completed' && styles.statusTextCompleted,
                        ]}
                    >
                        {status}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    historyItem: {
        backgroundColor: Colors.white,
        borderRadius: normalize(10),
        marginBottom: Spacing.sm,
        padding: Spacing.sm,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    historyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    phoneIcon: {
        width: normalize(18),
        height: normalize(18),
        marginRight: Spacing.xs,
    },
    customerName: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.semiBold,
        flex: 1,
    },
    // ✅ Vehicle Type Badge Styles
    vehicleTypeBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: normalize(8),
        paddingVertical: normalize(4),
        borderRadius: normalize(12),
        marginLeft: Spacing.xs,
    },
    vehicleTypeText: {
        fontSize: normalize(10),
        fontWeight: '600',
        color: '#1976D2',
        fontFamily: Typography.fontFamily.semiBold,
        textTransform: 'capitalize',
    },
    dateTimeContainer: {
        marginBottom: normalize(4),
    },
    dateTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(3),
    },
    calendarIcon: {
        width: normalize(12),
        height: normalize(12),
        marginRight: normalize(3),
        tintColor: Colors.text.secondary,
    },
    clockIcon: {
        width: normalize(12),
        height: normalize(12),
        marginRight: normalize(3),
        tintColor: Colors.text.secondary,
    },
    dateLabel: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    dateText: {
        fontSize: normalize(11),
        color: Colors.black,
        fontFamily: Typography.fontFamily.medium,
        fontWeight: Typography.fontWeight.semiBold,
    },
    timeText: {
        fontSize: normalize(11),
        color: Colors.black,
        fontFamily: Typography.fontFamily.medium,
        fontWeight: Typography.fontWeight.semiBold,
    },
    verticalDivider: {
        width: normalize(1),
        height: normalize(12),
        backgroundColor: Colors.text.secondary,
        marginHorizontal: Spacing.sm,
    },
    mobileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(4),
    },
    mobileLabel: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    mobileText: {
        fontSize: normalize(11),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        fontWeight: Typography.fontWeight.semiBold,
    },
    // ✅ Rate Row Styles
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(4),
        paddingTop: normalize(2),
    },
    rateLabel: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    rateValue: {
        flexDirection: 'row',
        alignItems: 'baseline',
        flex: 1,
    },
    rateAmount: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: '#1976D2',
        fontFamily: Typography.fontFamily.bold,
    },
    rateUnit: {
        fontSize: normalize(11),
        color: '#1976D2',
        fontFamily: Typography.fontFamily.medium,
        marginLeft: normalize(2),
    },
    rateSubText: {
        fontSize: normalize(10),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginLeft: normalize(4),
    },
    // ✅ Total Price Row Styles
    totalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: normalize(6),
        paddingTop: normalize(2),
    },
    totalPriceLabel: {
        fontSize: normalize(12),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.medium,
    },
    totalPriceContainer: {
        flex: 1,
        alignItems: 'flex-start',
    },
    totalPriceValue: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: '#2E7D32',
        fontFamily: Typography.fontFamily.bold,
    },
    calculationText: {
        fontSize: normalize(9),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginTop: normalize(1),
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    statusBadge: {
        backgroundColor: '#D4F8D4',
        paddingHorizontal: Spacing.xs,
        paddingVertical: normalize(3),
        borderRadius: normalize(4),
        marginLeft: Spacing.xs,
    },
    statusText: {
        fontSize: normalize(11),
        color: '#4CAF50',
        fontFamily: Typography.fontFamily.semiBold,
        fontWeight: Typography.fontWeight.semiBold,
    },
    statusConfirmed: {
        backgroundColor: '#D4F8D4',
    },
    statusTextConfirmed: {
        color: '#4CAF50',
    },
    statusPending: {
        backgroundColor: '#FFF3CD',
    },
    statusTextPending: {
        color: '#FFA500',
    },
    statusCancelled: {
        backgroundColor: '#FFE5E5',
    },
    statusTextCancelled: {
        color: '#E53935',
    },
    statusCompleted: {
        backgroundColor: '#E8F5E9',
    },
    statusTextCompleted: {
        color: '#2E7D32',
    },
});

export default BookingHistoryItem;