import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../constants/Dimensions';
import Header from '../components/Header/Header';
import { getPendingBookingsOfOwner, confirmBooking } from '../api/bookingApi';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const PendingBookingsScreen = ({ navigation }) => {
    const { userId } = useAuth();

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingIds, setProcessingIds] = useState([]);

    useEffect(() => {
        fetchPendingBookings();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            fetchPendingBookings();
        }, [userId])
    );

    const fetchPendingBookings = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }

            if (!userId) {
                Alert.alert('Error', 'User not authenticated');
                setBookings([]);
                setLoading(false);
                return;
            }

            const response = await getPendingBookingsOfOwner(userId);

            if (response && response.success) {
                setBookings(response.data || []);
            } else {
                setBookings([]);
            }
        } catch (error) {
            // Silent catch
            Alert.alert('Error', 'Failed to load pending bookings');
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPendingBookings(true);
    };

    const handleConfirmBooking = (bookingId, vehicleName) => {
        Alert.alert(
            'Confirm Booking',
            `Accept booking for ${vehicleName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        await processBooking(bookingId, 'conform', vehicleName);
                    },
                },
            ]
        );
    };

    const handleRejectBooking = (bookingId, vehicleName) => {
        Alert.alert(
            'Reject Booking',
            `Reject booking for ${vehicleName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        await processBooking(bookingId, 'reject', vehicleName);
                    },
                },
            ]
        );
    };

    const processBooking = async (bookingId, action, vehicleName) => {
        try {
            setProcessingIds((prev) => [...prev, bookingId]);

            const response = await confirmBooking(bookingId, action);

            if (response && response.success) {
                Alert.alert(
                    'Success',
                    `Booking for ${vehicleName} has been ${action === 'conform' ? 'accepted' : 'rejected'}`
                );

                // Remove the booking from the list
                setBookings((prev) => prev.filter((b) => b._id !== bookingId));
            } else {
                Alert.alert('Error', response?.message || `Failed to ${action} booking`);
            }
        } catch (error) {
            // Silent catch
            Alert.alert('Error', `Failed to ${action} booking. Please try again.`);
        } finally {
            setProcessingIds((prev) => prev.filter((id) => id !== bookingId));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch (error) {
            return dateString;
        }
    };

    const getVehicleImage = (booking) => {
        if (booking.carImages && booking.carImages.length > 0) {
            return { uri: booking.carImages[0] };
        }
        if (booking.bikeImages && booking.bikeImages.length > 0) {
            return { uri: booking.bikeImages[0] };
        }
        if (booking.autoImages && booking.autoImages.length > 0) {
            return { uri: booking.autoImages[0] };
        }
        return require('../assets/Icons/car.png');
    };

    const getVehicleName = (booking) => {
        if (booking.CarName) {
            return `${booking.CarName} ${booking.CarModel || ''}`.trim();
        }
        if (booking.BikeName) {
            return `${booking.BikeName} ${booking.BikeModel || ''}`.trim();
        }
        if (booking.AutoName) {
            return `${booking.AutoName} ${booking.AutoModel || ''}`.trim();
        }
        return 'Vehicle';
    };

    const getVehicleDetails = (booking) => {
        const details = [];
        if (booking.fuelType) details.push(booking.fuelType);
        if (booking.transmissionType) details.push(booking.transmissionType);
        if (booking.seatsAvailable) details.push(`${booking.seatsAvailable} Seats`);
        return details.join(' | ');
    };

    const renderBookingItem = ({ item }) => {
        const isProcessing = processingIds.includes(item._id);
        const vehicleName = getVehicleName(item);
        const vehicleDetails = getVehicleDetails(item);
        const customerName = item.userName || 'Customer';
        const rentAmount = item.RentPerDay || item.RentPerHour || 0;
        const rentUnit = item.RentPerDay ? '/day' : '/hour';

        return (
            <View style={styles.bookingCard}>
                {/* Vehicle Image and Info */}
                <View style={styles.vehicleSection}>
                    <Image
                        source={getVehicleImage(item)}
                        style={styles.vehicleImage}
                        resizeMode="cover"
                    />
                    <View style={styles.vehicleInfo}>
                        <Text style={styles.vehicleName}>{vehicleName}</Text>
                        {vehicleDetails && (
                            <Text style={styles.vehicleDetails}>{vehicleDetails}</Text>
                        )}
                        <Text style={styles.rentPrice}>₹{rentAmount}{rentUnit}</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Customer Info */}
                <View style={styles.customerSection}>
                    <View style={styles.infoRow}>
                        <Icon name="person" size={20} color={Colors.gray} />
                        <Text style={styles.infoLabel}>Customer:</Text>
                        <Text style={styles.infoValue}>{customerName}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="event" size={20} color={Colors.gray} />
                        <Text style={styles.infoLabel}>Pickup:</Text>
                        <Text style={styles.infoValue}>{formatDate(item.pickUpDate)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Icon name="event" size={20} color={Colors.gray} />
                        <Text style={styles.infoLabel}>Dropoff:</Text>
                        <Text style={styles.infoValue}>{formatDate(item.dropOffDate)}</Text>
                    </View>

                    {item.pickupArea && (
                        <View style={styles.infoRow}>
                            <Icon name="location-on" size={20} color={Colors.gray} />
                            <Text style={styles.infoLabel}>Location:</Text>
                            <Text style={styles.infoValue}>{item.pickupArea}</Text>
                        </View>
                    )}

                    {item.TotalAmount && (
                        <View style={styles.totalSection}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalAmount}>₹{item.TotalAmount}</Text>
                        </View>
                    )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.rejectButton,
                            isProcessing && styles.disabledButton,
                        ]}
                        onPress={() => handleRejectBooking(item._id, vehicleName)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Icon name="close" size={20} color={Colors.white} />
                                <Text style={styles.actionButtonText}>Reject</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            styles.acceptButton,
                            isProcessing && styles.disabledButton,
                        ]}
                        onPress={() => handleConfirmBooking(item._id, vehicleName)}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Icon name="check" size={20} color={Colors.white} />
                                <Text style={styles.actionButtonText}>Accept</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>PENDING</Text>
                </View>
            </View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="inbox" size={80} color={Colors.gray} />
            <Text style={styles.emptyTitle}>No Pending Bookings</Text>
            <Text style={styles.emptySubtitle}>
                You don't have any pending booking requests at the moment.
            </Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Header
                    onBackPress={() => navigation.goBack()}
                    title="Pending Bookings"
                    useGradient={false}
                    showIconBackground={true}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading pending bookings...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                onBackPress={() => navigation.goBack()}
                title="Pending Bookings"
                useGradient={false}
                showIconBackground={true}
            />

            <FlatList
                data={bookings}
                renderItem={renderBookingItem}
                keyExtractor={(item) => item._id?.toString()}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: normalize(14),
        color: Colors.gray,
    },
    listContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    bookingCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border || '#E0E0E0',
        marginBottom: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    vehicleSection: {
        flexDirection: 'row',
        padding: Spacing.md,
    },
    vehicleImage: {
        width: 100,
        height: 80,
        borderRadius: BorderRadius.md,
        marginRight: Spacing.md,
    },
    vehicleInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    vehicleName: {
        fontSize: normalize(16),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    vehicleDetails: {
        fontSize: normalize(12),
        color: Colors.gray,
        marginBottom: 4,
    },
    rentPrice: {
        fontSize: normalize(15),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.primary,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border || '#E0E0E0',
        marginHorizontal: Spacing.md,
    },
    customerSection: {
        padding: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    infoLabel: {
        fontSize: normalize(13),
        color: Colors.gray,
        marginLeft: Spacing.xs,
        width: 75,
    },
    infoValue: {
        fontSize: normalize(13),
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.medium,
        flex: 1,
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.border || '#E0E0E0',
    },
    totalLabel: {
        fontSize: normalize(15),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
    },
    totalAmount: {
        fontSize: normalize(18),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.primary,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.xs,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    disabledButton: {
        opacity: 0.6,
    },
    actionButtonText: {
        color: Colors.white,
        fontSize: normalize(15),
        fontWeight: Typography.fontWeight.semiBold,
    },
    statusBadge: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        backgroundColor: '#FFA000',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        color: Colors.white,
        fontSize: normalize(11),
        fontWeight: Typography.fontWeight.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: normalize(80),
    },
    emptyTitle: {
        fontSize: normalize(20),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.xs,
    },
    emptySubtitle: {
        fontSize: normalize(14),
        color: Colors.gray,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
});

export default PendingBookingsScreen;
