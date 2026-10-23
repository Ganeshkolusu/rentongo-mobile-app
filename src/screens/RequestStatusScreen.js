import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { confirmBooking, getBookingById, getMyVehicleBookings, getPendingBookingsOfOwner } from '../api/bookingApi';
import Button from '../components/Button/Button';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing, normalize } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { useSocket } from "../context/SocketContext";
import SoundService from '../services/SoundService';

const { width, height } = Dimensions.get('window');

// Auto-close timeout in seconds (must match customer's WaitingPopup timer)
const AUTO_CLOSE_SECONDS = 120;

const RequestStatusScreen = ({ route, navigation }) => {
    const { bookingId: initialBookingId, fromForegroundNotification } = route.params || {};

    // Make socket context optional with error handling
    let socketContext = null;
    try {
        socketContext = useSocket();
    } catch (error) {
        // Socket context not available
    }

    const { userId } = useAuth();

    // State for booking data
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [bookingId, setBookingId] = useState(initialBookingId);
    const [customerId, setCustomerId] = useState(null);
    const [car, setCar] = useState(null);
    const [bike, setBike] = useState(null);

    // Refs
    const autoCloseTimerRef = useRef(null);
    const warningTimerRef = useRef(null);
    const ownerRespondedRef = useRef(false);
    const pollingIntervalRef = useRef(null);

    useEffect(() => {
        if (!bookingId) {
            fetchLatestPendingBooking();
        } else {
            fetchBookingDetails();
        }
    }, [userId, bookingId]);

    // Polling mechanism to check if customer cancelled the booking
    useEffect(() => {
        if (!bookingId || loading || ownerRespondedRef.current) {
            return;
        }

        const checkBookingStatus = async () => {
            if (ownerRespondedRef.current) {
                return;
            }

            try {
                const result = await getBookingById(bookingId);

                if (result.success && result.data) {
                    const status = (result.data.status || '').toLowerCase();

                    if (status === 'cancelled') {
                        ownerRespondedRef.current = true;

                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }

                        SoundService.stopAllSounds();

                        if (autoCloseTimerRef.current) {
                            clearTimeout(autoCloseTimerRef.current);
                            autoCloseTimerRef.current = null;
                        }
                        if (warningTimerRef.current) {
                            clearTimeout(warningTimerRef.current);
                            warningTimerRef.current = null;
                        }

                        navigation.replace('BookingRejectScreen', {
                            status: 'cancelled',
                            bookingId: bookingId
                        });
                    }
                }
            } catch (error) {
                // Silent catch
            }
        };

        pollingIntervalRef.current = setInterval(checkBookingStatus, 2000);
        checkBookingStatus();

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [bookingId, loading, navigation]);

    // Sound cleanup ONLY on actual component unmount (empty dependency array)
    useEffect(() => {
        return () => {
            SoundService.stopAllSounds();
        };
    }, []);

    // Auto-close timer and warning sound timer
    useEffect(() => {
        if (!loading && bookingData) {
            // Warning sound starts 20 seconds before auto-close
            const WARNING_SECONDS = 20;
            const warningDelay = (AUTO_CLOSE_SECONDS - WARNING_SECONDS) * 1000;

            // Start warning timer (stops booking sound and plays autocancel sound at last 20 secs)
            if (AUTO_CLOSE_SECONDS > WARNING_SECONDS) {
                warningTimerRef.current = setTimeout(() => {
                    if (ownerRespondedRef.current) {
                        return;
                    }
                    SoundService.playAutoCancelWarning();
                }, warningDelay);
            }

            // Auto-close timer
            autoCloseTimerRef.current = setTimeout(async () => {
                if (ownerRespondedRef.current) {
                    return;
                }
                SoundService.stopAllSounds();
                navigation.goBack();
            }, AUTO_CLOSE_SECONDS * 1000);
        }

        return () => {
            if (warningTimerRef.current) {
                clearTimeout(warningTimerRef.current);
                warningTimerRef.current = null;
            }
            if (autoCloseTimerRef.current) {
                clearTimeout(autoCloseTimerRef.current);
                autoCloseTimerRef.current = null;
            }
        };
    }, [loading, bookingData]);

    // Listen for customer cancellation via socket
    useEffect(() => {
        if (!socketContext?.socket?.socket) {
            return;
        }

        const socket = socketContext.socket.socket;

        const handleCustomerCancellation = (data) => {
            const cancelledBookingId = data.bookingId || data.booking_id;
            if (cancelledBookingId === bookingId || !bookingId) {
                ownerRespondedRef.current = true;
                SoundService.stopAllSounds();

                if (autoCloseTimerRef.current) {
                    clearTimeout(autoCloseTimerRef.current);
                    autoCloseTimerRef.current = null;
                }
                if (warningTimerRef.current) {
                    clearTimeout(warningTimerRef.current);
                    warningTimerRef.current = null;
                }

                navigation.replace('BookingRejectScreen', {
                    status: 'cancelled',
                    bookingId: cancelledBookingId
                });
            }
        };

        const handleAutoCancellation = (data) => {
            const cancelledBookingId = data.bookingId || data.booking_id;
            if (cancelledBookingId === bookingId || !bookingId) {
                // Mark that owner action is no longer needed
                ownerRespondedRef.current = true;
                
                // Stop all sounds immediately
                SoundService.stopAllSounds();

                // Clear all timers
                if (autoCloseTimerRef.current) {
                    clearTimeout(autoCloseTimerRef.current);
                    autoCloseTimerRef.current = null;
                }
                if (warningTimerRef.current) {
                    clearTimeout(warningTimerRef.current);
                    warningTimerRef.current = null;
                }

                // Close screen
                navigation.goBack();
            }
        };

        // Handler for booking-status-update with cancelled status
        const handleBookingStatusUpdate = (data) => {
            const status = (data.status || '').toLowerCase();
            const updateBookingId = data.bookingId || data.booking_id;

            if (status === 'cancelled') {
                if (updateBookingId === bookingId || !bookingId) {
                    ownerRespondedRef.current = true;
                    SoundService.stopAllSounds();

                    if (autoCloseTimerRef.current) {
                        clearTimeout(autoCloseTimerRef.current);
                        autoCloseTimerRef.current = null;
                    }
                    if (warningTimerRef.current) {
                        clearTimeout(warningTimerRef.current);
                        warningTimerRef.current = null;
                    }

                    navigation.replace('BookingRejectScreen', {
                        status: 'cancelled',
                        bookingId: updateBookingId
                    });
                }
            }
        };

        socket.on('booking-cancelled-by-customer', handleCustomerCancellation);
        socket.on('booking-auto-cancelled', handleAutoCancellation);
        socket.on('booking-status-update', handleBookingStatusUpdate);

        return () => {
            socket.off('booking-cancelled-by-customer', handleCustomerCancellation);
            socket.off('booking-auto-cancelled', handleAutoCancellation);
            socket.off('booking-status-update', handleBookingStatusUpdate);
        };
    }, [socketContext, bookingId, navigation]);


    const fetchLatestPendingBooking = async () => {
        try {
            setLoading(true);

            const maxRetries = 15;
            const getDelay = (attempt) => {
                if (attempt <= 3) return 500;
                if (attempt <= 6) return 1000;
                if (attempt <= 10) return 2000;
                return 3000;
            };

            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                const pendingResult = await getPendingBookingsOfOwner(userId);

                if (pendingResult.success && pendingResult.data && pendingResult.data.length > 0) {
                    const pendingBookings = [...pendingResult.data].sort((a, b) => {
                        const dateA = new Date(a.createdAt || a.CreatedAt || 0);
                        const dateB = new Date(b.createdAt || b.CreatedAt || 0);
                        return dateB - dateA;
                    });

                    const latestBooking = pendingBookings[0];
                    processBookingData(latestBooking);
                    return;
                }

                const vehicleTypes = ['Car', 'Bike', 'Auto'];
                const promises = vehicleTypes.map(vehicleType => {
                    return getMyVehicleBookings(userId, vehicleType);
                });

                const results = await Promise.all(promises);
                let allOwnerBookings = [];

                results.forEach((vehicleResult, index) => {
                    if (vehicleResult.success && vehicleResult.data && vehicleResult.data.length > 0) {
                        allOwnerBookings = [...allOwnerBookings, ...vehicleResult.data];
                    }
                });

                if (allOwnerBookings.length > 0) {
                    const pendingForOwner = allOwnerBookings.filter(booking => {
                        const status = (booking.status || booking.Status || '').toLowerCase();
                        return status === 'pending';
                    });

                    if (pendingForOwner.length > 0) {
                        pendingForOwner.sort((a, b) => {
                            const dateA = new Date(a.createdAt || a.CreatedAt || 0);
                            const dateB = new Date(b.createdAt || b.CreatedAt || 0);
                            return dateB - dateA;
                        });

                        const latestBooking = pendingForOwner[0];
                        processBookingData(latestBooking);
                        return;
                    }
                }

                if (attempt < maxRetries) {
                    const delay = getDelay(attempt);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }

            setLoading(false);
            Alert.alert(
                'No Pending Bookings',
                'Could not find any pending booking requests. The booking may have been cancelled or already processed.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Failed to load booking details', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }
    };

    const processBookingData = (booking) => {
        const foundBookingId = booking._id || booking.booking?._id;
        setBookingId(foundBookingId);
        setBookingData(booking);

        const custId = booking.userId || booking.UserId || booking.customerId;
        setCustomerId(custId);

        const vehicleType = booking.vechileType || booking.vehicleType;

        if (vehicleType === 'Car') {
            setCar({
                _id: booking.VechileId || booking.vehicleId,
                ...booking.vehicleDetails
            });
        } else if (vehicleType === 'Bike') {
            setBike({
                _id: booking.VechileId || booking.vehicleId,
                ...booking.vehicleDetails
            });
        } else if (vehicleType === 'Auto') {
            setCar({
                _id: booking.VechileId || booking.vehicleId,
                ...booking.vehicleDetails
            });
        }

        setLoading(false);
    };

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);

            const result = await getBookingById(bookingId);

            if (result.success && result.data) {
                const booking = result.data;
                setBookingData(booking);

                const custId = booking.userId || booking.UserId || booking.customerId;
                setCustomerId(custId);

                const vehicleType = booking.vechileType || booking.vehicleType;
                if (vehicleType === 'Car') {
                    setCar({
                        _id: booking.VechileId || booking.vehicleId,
                        ...booking.vehicleDetails
                    });
                } else if (vehicleType === 'Bike') {
                    setBike({
                        _id: booking.VechileId || booking.vehicleId,
                        ...booking.vehicleDetails
                    });
                } else if (vehicleType === 'Auto') {
                    setCar({
                        _id: booking.VechileId || booking.vehicleId,
                        ...booking.vehicleDetails
                    });
                }
            } else {
                Alert.alert(
                    'Booking Not Found',
                    'This booking may have already been processed or cancelled.',
                    [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to load booking details', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const emitSocketEvent = async (eventName, data) => {
        try {
            if (!socketContext?.socket) {
                return false;
            }

            const socketService = socketContext.socket;
            const actualSocket = socketService?.socket;

            if (actualSocket && actualSocket.connected) {
                actualSocket.emit(eventName, data);
                return true;
            } else {
                if (socketService && typeof socketService.connect === 'function' && userId) {
                    socketService.connect(userId);
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    if (socketService.socket && socketService.socket.connected) {
                        socketService.socket.emit(eventName, data);
                        return true;
                    }
                }
            }
        } catch (error) {
            // Silent catch
        }
        return false;
    };

    const handleAccept = async () => {
        if (!bookingId || !customerId) {
            Alert.alert('Error', 'Missing booking information. Please try again.');
            return;
        }

        ownerRespondedRef.current = true;

        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }

        SoundService.onAccept();

        try {
            const result = await confirmBooking(bookingId, 'Confirmed');

            if (!result.success) {
                Alert.alert('Error', result.message || 'Failed to accept booking');
                return;
            }

            await emitSocketEvent('booking-status-update', {
                bookingId,
                customerId,
                status: 'accepted'
            });

            await emitSocketEvent('booking_accepted', {
                bookingId,
                customerId,
                ownerId: userId,
                status: 'accepted'
            });

        } catch (error) {
            Alert.alert('Error', 'Failed to accept booking. Please try again.');
            return;
        }

        navigation.goBack();
    };

    const handleReject = async () => {
        if (!bookingId || !customerId) {
            Alert.alert('Error', 'Missing booking information. Please try again.');
            return;
        }

        ownerRespondedRef.current = true;

        if (autoCloseTimerRef.current) {
            clearTimeout(autoCloseTimerRef.current);
            autoCloseTimerRef.current = null;
        }
        if (warningTimerRef.current) {
            clearTimeout(warningTimerRef.current);
            warningTimerRef.current = null;
        }

        SoundService.onReject();

        try {
            const result = await confirmBooking(bookingId, 'Cancelled');

            if (!result.success) {
                Alert.alert('Error', result.message || 'Failed to reject booking');
                return;
            }

            await emitSocketEvent('booking-status-update', {
                bookingId,
                customerId,
                status: 'rejected'
            });

            await emitSocketEvent('booking_rejected', {
                bookingId,
                customerId,
                ownerId: userId,
                status: 'rejected'
            });

        } catch (error) {
            // Silent catch
        }

        navigation.goBack();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading booking details...</Text>
            </View>
        );
    }

    if (!bookingData) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Unable to load booking details</Text>
                <Button
                    title="Go Back"
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                />
            </View>
        );
    }

    const bookingImage = bike
        ? require('../assets/Images/newbooking.png')
        : require('../assets/Images/carnewbooking.png');

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Image
                    source={bookingImage}
                    style={styles.image}
                />

                <Text style={styles.title}>New Booking Request</Text>

                {bookingData?.contactName && (
                    <Text style={styles.customerName}>
                        From: {bookingData.contactName}
                    </Text>
                )}

                <View style={styles.buttonContainer}>
                    <Button
                        title="Accept"
                        onPress={handleAccept}
                        style={styles.acceptButton}
                    />
                    <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={handleReject}
                    >
                        <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default RequestStatusScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.lg,
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
    },
    errorText: {
        fontSize: Typography.fontSize.lg,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.xl,
    },
    backButton: {
        width: '80%',
    },
    card: {
        width: width,
        height: height,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    image: {
        width: normalize(180),
        height: normalize(180),
        resizeMode: 'contain',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize.xxxl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: Spacing.md,
        lineHeight: Typography.lineHeight.xxl,
    },
    customerName: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    buttonContainer: {
        width: '90%',
        gap: Spacing.md,
    },
    acceptButton: {
        width: '100%',
    },
    rejectButton: {
        width: '100%',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        borderWidth: 2,
        borderColor: Colors.error,
        paddingVertical: normalize(12),
        justifyContent: 'center',
        alignItems: 'center',
    },
    rejectButtonText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.error,
    },
});