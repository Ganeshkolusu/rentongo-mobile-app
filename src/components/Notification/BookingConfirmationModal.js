import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { confirmBooking } from '../../api/bookingApi';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

// Auto-cancel timeout in minutes (2 minutes as per backend)
const AUTO_CANCEL_MINUTES = 2;

const BookingConfirmationModal = ({ visible, booking, onClose, onSuccess, initialAction = 'confirm' }) => {
    const [modalState, setModalState] = useState('confirm'); // 'confirm', 'confirmed', 'rejected', 'expired', 'reject_confirm'
    const [loading, setLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState(null); // 'accept' or 'reject' - tracks which button is loading
    const [timeRemaining, setTimeRemaining] = useState('');
    const [secondsLeft, setSecondsLeft] = useState(0);

    // Calculate time remaining before auto-cancel
    useEffect(() => {
        if (!visible || !booking?.createdAt) {
            setTimeRemaining('');
            return;
        }

        const calculateTimeRemaining = () => {
            const createdAt = new Date(booking.createdAt);
            const autoCancelTime = new Date(createdAt.getTime() + AUTO_CANCEL_MINUTES * 60 * 1000);
            const now = new Date();
            const diffMs = autoCancelTime - now;

            if (diffMs <= 0) {
                setTimeRemaining('Expired');
                setSecondsLeft(0);
                // Only show expired state for confirm action, not reject
                if (initialAction !== 'reject') {
                    setModalState('expired');
                }
                return;
            }

            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            setSecondsLeft(Math.floor(diffMs / 1000));

            if (minutes > 0) {
                setTimeRemaining(`${minutes}m ${seconds}s`);
            } else {
                setTimeRemaining(`${seconds}s`);
            }
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000); // Update every second

        return () => clearInterval(interval);
    }, [visible, booking?.createdAt, initialAction]);

    // Reset modal state when closed or set based on initialAction
    useEffect(() => {
        if (!visible) {
            setModalState('confirm');
            setLoadingAction(null);
        } else if (initialAction === 'reject') {
            setModalState('reject_confirm');
        } else {
            // Check if already expired before showing confirm
            if (booking?.createdAt) {
                const createdAt = new Date(booking.createdAt);
                const autoCancelTime = new Date(createdAt.getTime() + AUTO_CANCEL_MINUTES * 60 * 1000);
                const now = new Date();
                if (now >= autoCancelTime) {
                    setModalState('expired');
                    return;
                }
            }
            setModalState('confirm');
        }
    }, [visible, initialAction, booking?.createdAt]);

    const handleConfirm = async () => {
        if (!booking?.bookingId) return;
        setLoading(true);
        setLoadingAction('accept'); // Track that Accept button was clicked
        try {
            await confirmBooking(booking.bookingId, 'Confirmed');
            setModalState('confirmed');
            setTimeout(() => {
                onSuccess?.('confirmed');
                onClose();
                setModalState('confirm');
                setLoadingAction(null);
            }, 2000);
        } catch (error) {
            // Silent catch
            alert('Failed to confirm booking. Please try again.');
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    const handleReject = async () => {
        if (!booking?.bookingId) return;
        setLoading(true);
        setLoadingAction('reject'); // Track that Reject button was clicked
        try {
            await confirmBooking(booking.bookingId, 'Cancelled');
            setModalState('rejected');
            setTimeout(() => {
                onSuccess?.('rejected');
                onClose();
                setModalState('confirm');
                setLoadingAction(null);
            }, 2000);
        } catch (error) {
            // Silent catch
            alert('Failed to reject booking. Please try again.');
        } finally {
            setLoading(false);
            setLoadingAction(null);
        }
    };

    const handleClose = () => {
        setModalState('confirm');
        setLoadingAction(null);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                {/* Confirmation Modal */}
                {modalState === 'confirm' && (
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Ionicons name="close" size={24} color={Colors.text.secondary} />
                        </TouchableOpacity>

                        <View style={styles.iconContainer}>
                            <Ionicons name="time-outline" size={40} color={Colors.primary} />
                        </View>

                        <Text style={styles.title}>Review Booking Request</Text>
                        <Text style={styles.subtitle}>
                            Please confirm or reject this customer booking
                        </Text>

                        {timeRemaining && modalState === 'confirm' && (
                            <View style={[styles.autoCancelBanner, secondsLeft <= 30 && styles.autoCancelBannerUrgent]}>
                                <Ionicons name="time" size={16} color={secondsLeft <= 30 ? "#D32F2F" : "#FF6B00"} />
                                <Text style={[styles.autoCancelText, secondsLeft <= 30 && styles.autoCancelTextUrgent]}>
                                    {timeRemaining === 'Expired' ? 'Booking Expired' : `Auto-cancels in ${timeRemaining}`}
                                </Text>
                            </View>
                        )}

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailsTitle}>Booking Details</Text>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Booking ID:</Text>
                                <Text style={styles.detailValue}>
                                    {booking?.bookingId?.substring(0, 12)}...
                                </Text>
                            </View>

                            {booking?.customerName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Customer:</Text>
                                    <Text style={styles.detailValueBold}>{booking.customerName}</Text>
                                </View>
                            )}

                            {booking?.vehicleName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Vehicle:</Text>
                                    <Text style={styles.detailValueBold}>{booking.vehicleName}</Text>
                                </View>
                            )}

                            {booking?.vehicleType && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Type:</Text>
                                    <Text style={styles.detailValue}>{booking.vehicleType}</Text>
                                </View>
                            )}

                            {booking?.transmission && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Transmission:</Text>
                                    <Text style={styles.detailValue}>{booking.transmission}</Text>
                                </View>
                            )}

                            {booking?.fuelType && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Fuel:</Text>
                                    <Text style={styles.detailValue}>{booking.fuelType}</Text>
                                </View>
                            )}

                            {booking?.pickUpDate && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Pick Up:</Text>
                                    <Text style={styles.detailValue}>{booking.pickUpDate}</Text>
                                </View>
                            )}

                            {booking?.dropOffDate && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Drop Off:</Text>
                                    <Text style={styles.detailValue}>{booking.dropOffDate}</Text>
                                </View>
                            )}

                            {booking?.totalAmount && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Amount:</Text>
                                    <Text style={styles.detailValueBold}>Rs. {booking.totalAmount}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, styles.rejectButton]}
                                onPress={handleReject}
                                disabled={loading}
                            >
                                {loadingAction === 'reject' ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="close" size={24} color={Colors.white} />
                                        <Text style={styles.buttonText}>Reject</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.acceptButton]}
                                onPress={handleConfirm}
                                disabled={loading}
                            >
                                {loadingAction === 'accept' ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="checkmark" size={24} color={Colors.white} />
                                        <Text style={styles.buttonText}>Accept</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Reject Confirmation Modal */}
                {modalState === 'reject_confirm' && (
                    <View style={styles.modalContainer}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={handleClose}
                            disabled={loading}
                        >
                            <Ionicons name="close" size={24} color={Colors.text.secondary} />
                        </TouchableOpacity>

                        <View style={[styles.iconContainer, styles.rejectIcon]}>
                            <Ionicons name="alert-circle-outline" size={40} color="#F44336" />
                        </View>

                        <Text style={styles.title}>Reject Booking?</Text>
                        <Text style={styles.subtitle}>
                            Are you sure you want to reject this booking request?
                        </Text>

                        {timeRemaining && timeRemaining !== 'Expired' && (
                            <View style={[styles.autoCancelBanner, secondsLeft <= 30 && styles.autoCancelBannerUrgent]}>
                                <Ionicons name="time" size={16} color={secondsLeft <= 30 ? "#D32F2F" : "#FF6B00"} />
                                <Text style={[styles.autoCancelText, secondsLeft <= 30 && styles.autoCancelTextUrgent]}>
                                    {`Auto-cancels in ${timeRemaining}`}
                                </Text>
                            </View>
                        )}

                        <View style={styles.detailsContainer}>
                            <Text style={styles.detailsTitle}>Booking Details</Text>

                            {booking?.vehicleName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Vehicle:</Text>
                                    <Text style={styles.detailValueBold}>{booking.vehicleName}</Text>
                                </View>
                            )}

                            {booking?.customerName && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Customer:</Text>
                                    <Text style={styles.detailValueBold}>{booking.customerName}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={[styles.button, { backgroundColor: Colors.text.secondary }]}
                                onPress={handleClose}
                                disabled={loading}
                            >
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.rejectButton]}
                                onPress={handleReject}
                                disabled={loading}
                            >
                                {loadingAction === 'reject' ? (
                                    <ActivityIndicator color={Colors.white} size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="close" size={24} color={Colors.white} />
                                        <Text style={styles.buttonText}>Reject</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Confirmed Success Modal */}
                {modalState === 'confirmed' && (
                    <View style={styles.modalContainer}>
                        <View style={[styles.iconContainer, styles.successIcon]}>
                            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                        </View>
                        <Text style={styles.successTitle}>Booking Confirmed!</Text>
                        <Text style={styles.successSubtitle}>
                            The booking has been successfully confirmed.
                        </Text>
                        <View style={styles.statusBox}>
                            <Text style={styles.statusText}>Status: Confirmed</Text>
                            <Text style={styles.statusSubtext}>Customer will be notified shortly</Text>
                        </View>
                    </View>
                )}

                {/* Rejected Modal */}
                {modalState === 'rejected' && (
                    <View style={styles.modalContainer}>
                        <View style={[styles.iconContainer, styles.rejectIcon]}>
                            <Ionicons name="close-circle" size={60} color="#F44336" />
                        </View>
                        <Text style={styles.rejectTitle}>Booking Rejected</Text>
                        <Text style={styles.successSubtitle}>
                            The booking request has been rejected.
                        </Text>
                        <View style={[styles.statusBox, styles.rejectStatusBox]}>
                            <Text style={[styles.statusText, styles.rejectStatusText]}>Status: Rejected</Text>
                            <Text style={styles.statusSubtext}>Customer will be notified shortly</Text>
                        </View>
                    </View>
                )}

                {/* Expired Modal */}
                {modalState === 'expired' && (
                    <View style={styles.modalContainer}>
                        <View style={[styles.iconContainer, styles.expiredIcon]}>
                            <Ionicons name="time" size={60} color="#9E9E9E" />
                        </View>
                        <Text style={styles.expiredTitle}>Booking Expired</Text>
                        <Text style={styles.successSubtitle}>
                            This booking request has been auto-cancelled due to timeout.
                        </Text>
                        <View style={[styles.statusBox, styles.expiredStatusBox]}>
                            <Text style={[styles.statusText, styles.expiredStatusText]}>Status: Auto-Cancelled</Text>
                            <Text style={styles.statusSubtext}>Customer has been notified</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeExpiredButton}
                            onPress={handleClose}
                        >
                            <Text style={styles.closeExpiredButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContainer: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        padding: Spacing.xs,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    successIcon: {
        backgroundColor: '#E8F5E9',
    },
    rejectIcon: {
        backgroundColor: '#FFEBEE',
    },
    title: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    autoCancelBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
        gap: Spacing.xs,
    },
    autoCancelText: {
        fontSize: Typography.fontSize.sm,
        color: '#FF6B00',
        fontWeight: Typography.fontWeight.semibold,
    },
    detailsContainer: {
        backgroundColor: '#F5F5F5',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        width: '100%',
        marginBottom: Spacing.lg,
    },
    detailsTitle: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.secondary,
        textTransform: 'uppercase',
        marginBottom: Spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    detailLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
    },
    detailValue: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.primary,
    },
    detailValueBold: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.xs,
    },
    rejectButton: {
        backgroundColor: '#F44336',
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    buttonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    successTitle: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    rejectTitle: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    successSubtitle: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        marginBottom: Spacing.lg,
        textAlign: 'center',
    },
    statusBox: {
        backgroundColor: '#E8F5E9',
        borderWidth: 2,
        borderColor: '#C8E6C9',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        width: '100%',
        alignItems: 'center',
    },
    rejectStatusBox: {
        backgroundColor: '#FFEBEE',
        borderColor: '#FFCDD2',
    },
    statusText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#2E7D32',
        marginBottom: Spacing.xs,
    },
    rejectStatusText: {
        color: '#C62828',
    },
    statusSubtext: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
    },
    // Urgent timer styles
    autoCancelBannerUrgent: {
        backgroundColor: '#FFEBEE',
    },
    autoCancelTextUrgent: {
        color: '#D32F2F',
    },
    // Expired state styles
    expiredIcon: {
        backgroundColor: '#EEEEEE',
    },
    expiredTitle: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    expiredStatusBox: {
        backgroundColor: '#EEEEEE',
        borderColor: '#BDBDBD',
    },
    expiredStatusText: {
        color: '#757575',
    },
    closeExpiredButton: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xl,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.lg,
    },
    closeExpiredButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
});

export default BookingConfirmationModal;