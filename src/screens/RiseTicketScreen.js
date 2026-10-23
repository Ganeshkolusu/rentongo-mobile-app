import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { getBookingById, getMyVehicleBookings } from '../api/bookingApi';
import { createTicket, updateTicket } from '../api/supportApi';
import FormDropdown from '../components/FormDropdown';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';

const RiseTicketScreen = ({ navigation, route }) => {
    const { bookingId, vehicleId, mode = 'create', ticketData} = route.params || {};
    const isEditMode = mode === 'edit' && ticketData;

    const { userId, user, isAuthenticated, loading: authLoading } = useAuth();

    const [selectedIssue, setSelectedIssue] = useState({
        label: ticketData?.subject || 'Booking issue',
        value: ticketData?.subject || 'Booking issue'
    });
    const [selectedVehicle, setSelectedVehicle] = useState({
        label: ticketData?.vehicleType || 'Car',
        value: ticketData?.vehicleType || 'Car'
    });
    const [issueDescription, setIssueDescription] = useState(ticketData?.description || '');
    const [mobileNumber, setMobileNumber] = useState('');
    const [name, setName] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ticketId, setTicketId] = useState(ticketData?._id || null);
    const [rating, setRating] = useState(ticketData?.rating || 0);
    const [review, setReview] = useState(ticketData?.review || '');
    const [bookingDetails, setBookingDetails] = useState(null);
    const [vehicleBookings, setVehicleBookings] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchBookingDetails = async (id) => {
        if (!id) return;
        const res = await getBookingById(id);
        if (res.success) setBookingDetails(res.data);
    };

    const fetchVehicleBookings = async (userId, vehicleId) => {
        if (!userId || !vehicleId) return;
        const res = await getMyVehicleBookings(userId, null, vehicleId);
        if (res.success) setVehicleBookings(res.data);
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                if (bookingId) await fetchBookingDetails(bookingId);
                if (vehicleId && userId) await fetchVehicleBookings(userId, vehicleId);
            } catch (error) {
                console.log('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [bookingId, vehicleId, userId]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            Alert.alert(
                'Authentication Required',
                'Please login to raise a ticket',
                [
                    { text: 'Login', onPress: () => navigation.navigate('LoginScreen') },
                    { text: 'Cancel', onPress: () => navigation.goBack(), style: 'cancel' }
                ]
            );
        }
    }, [authLoading, isAuthenticated, navigation]);

    useEffect(() => {
        if (user) {
            setName(user.name || user.username || '');
            setMobileNumber(user.mobile || user.phone || '');
        }
    }, [user]);

    const issueOptions = [
        { label: 'Booking Issue', value: 'Booking Issue' },
        { label: 'Vehicle Issue', value: 'Vehicle Issue' },
        { label: 'Payment Confusion', value: 'Payment Confusion' },
        { label: 'App Bug or Crash', value: 'App Bug or Crash' },
        { label: 'Others', value: 'Others' },
    ];

    const vehicleOptions = [
        { label: 'Car', value: 'Car' },
        { label: 'Bike', value: 'Bike' },
    ];

    const getPriority = (issueType) => {
        switch (issueType) {
            case 'App Bug or Crash':
            case 'Payment/Confusion':
                return 'High';
            case 'Vehicle Issue':
            case 'Booking issue':
                return 'Medium';
            default:
                return 'Low';
        }
    };

    const handleSubmit = async () => {
        if (!issueDescription.trim()) {
            Alert.alert('Error', 'Please describe your issue');
            return;
        }

        if (!name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return;
        }

        if (mobileNumber && mobileNumber.length !== 10) {
            Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
            return;
        }

        if (!userId) {
            Alert.alert(
                'Authentication Required',
                'Please login to raise a ticket',
                [{ text: 'Login', onPress: () => navigation.navigate('Login') }]
            );
            return;
        }

        setIsSubmitting(true);

        try {
            if (isEditMode) {
                const updateData = {
                    subject: selectedIssue?.value || ticketData.subject,
                    description: issueDescription.trim(),
                    priority: getPriority(selectedIssue?.value),
                    review: review.trim(),
                    rating: rating,
                };

                const response = await updateTicket(ticketData._id, updateData);

                if (response) {
                    setTicketId(ticketData._id);
                    setShowSuccessModal(true);
                } else {
                    throw new Error('Failed to update ticket');
                }
            } else {
                const vehicleIdValue = route?.params?.vehicleId ||
                    bookingDetails?.VechileId ||
                    '000000000000000000000000';
                const bookingIdValue = route?.params?.bookingId ||
                    bookingDetails?._id ||
                    bookingDetails?.id ||
                    '000000000000000000000000';

                const newTicketData = {
                    userId: userId,
                    vehicleType: bookingDetails?.vechileType || selectedVehicle?.value || 'Car',
                    vehicleId: vehicleIdValue,
                    bookingId: bookingIdValue,
                    subject: selectedIssue?.value || 'General Issue',
                    description: issueDescription.trim(),
                    priority: getPriority(selectedIssue?.value),
                };

                const response = await createTicket(newTicketData);

                if (response) {
                    if (response.message || response.ticket) {
                        const ticketInfo = response.ticket || response.data || response;
                        setTicketId(ticketInfo?._id || ticketInfo?.ticketId || ticketInfo?.id);
                        setShowSuccessModal(true);
                    } else if (response.success || response.status === 'success' || response.data) {
                        const ticketInfo = response.data || response.ticket || response;
                        setTicketId(ticketInfo?._id || ticketInfo?.ticketId || ticketInfo?.id);
                        setShowSuccessModal(true);
                    } else {
                        const errorMsg = response.message || response.error || 'Failed to create ticket';
                        throw new Error(errorMsg);
                    }
                } else {
                    throw new Error('No response received from server');
                }
            }
        } catch (error) {
            let errorMessage = `Unable to ${isEditMode ? 'update' : 'submit'} your ticket. Please try again later.`;

            if (error.response) {
                errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert(
                `${isEditMode ? 'Update Failed' : 'Submission Failed'}`,
                errorMessage,
                [{ text: 'OK', style: 'cancel' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDone = () => {
        setShowSuccessModal(false);
        navigation.goBack();
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                <Text style={styles.ratingLabel}>Rating (Optional)</Text>
                <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            disabled={isSubmitting}
                        >
                            <Ionicons
                                name={star <= rating ? 'star' : 'star-outline'}
                                size={32}
                                color="#FFD700"
                            />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    if (loading || authLoading) {
        return (
            <View style={styles.container}>
                <Header
                    title={isEditMode ? 'Edit Ticket' : 'Raise a Ticket'}
                    onBackPress={() => navigation.goBack()}
                    showMoreButton={false}
                    useGradient={true}
                    showIconBackground={false}
                    gradientColors={Colors.gradient.primary}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    if (!isAuthenticated) {
        return (
            <View style={styles.container}>
                <Header
                    title={isEditMode ? 'Edit Ticket' : 'Raise a Ticket'}
                    onBackPress={() => navigation.goBack()}
                    showMoreButton={false}
                    useGradient={true}
                    showIconBackground={false}
                    gradientColors={Colors.gradient.primary}
                />
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Please login to continue</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                title={isEditMode ? 'Edit Ticket' : 'Raise a Ticket'}
                onBackPress={() => navigation.goBack()}
                showMoreButton={false}
                useGradient={true}
                showIconBackground={false}
                gradientColors={Colors.gradient.primary}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {isEditMode && (
                    <View style={styles.editModeBanner}>
                        <Ionicons name="create-outline" size={20} color={Colors.primary} />
                        <Text style={styles.editModeText}>
                            Editing Ticket #{ticketData._id.slice(-6)}
                        </Text>
                    </View>
                )}

                {bookingDetails && !isEditMode && (
                    <View style={styles.bookingDetailsCard}>
                        <Text style={styles.sectionTitle}>Booking Details</Text>
                        <Text style={styles.detailText}>
                            Booking ID: {bookingDetails.id || bookingDetails._id}
                        </Text>
                        <Text style={styles.detailText}>
                            Vehicle: {bookingDetails.vehicleName || bookingDetails.vehicleType}
                        </Text>
                        <Text style={styles.detailText}>
                            Date: {bookingDetails.date || bookingDetails.startDate}
                        </Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.labelBold}>Select Issue *</Text>
                    <FormDropdown
                        options={issueOptions}
                        value={selectedIssue}
                        onSelect={setSelectedIssue}
                        placeholder="Select issue type"
                    />
                </View>

                {!isEditMode && (
                    <View style={styles.inputContainer}>
                        <Text style={styles.labelBold}>Select Vehicle (Optional)</Text>
                        <FormDropdown
                            options={vehicleOptions}
                            value={selectedVehicle}
                            onSelect={setSelectedVehicle}
                            placeholder="Select vehicle type"
                        />
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.labelBold}>Describe your issue in detail *</Text>
                    <TextInput
                        style={styles.textArea}
                        value={issueDescription}
                        onChangeText={setIssueDescription}
                        placeholder="Describe your issue..."
                        placeholderTextColor={Colors.grey}
                        multiline
                        textAlignVertical="top"
                        editable={!isSubmitting}
                    />
                </View>

                {isEditMode && (
                    <>
                        {renderStars()}

                        <View style={styles.inputContainer}>
                            <Text style={styles.labelBold}>Review (Optional)</Text>
                            <TextInput
                                style={styles.textArea}
                                value={review}
                                onChangeText={setReview}
                                placeholder="Write your review..."
                                placeholderTextColor={Colors.grey}
                                multiline
                                textAlignVertical="top"
                                editable={!isSubmitting}
                            />
                        </View>
                    </>
                )}

                {!isEditMode && (
                    <>
                        <Text style={styles.sectionTitle}>Contact Information</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.labelBold}>Name *</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={Colors.grey}
                                editable={!isSubmitting}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.labelBold}>Mobile Number (Optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={mobileNumber}
                                onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
                                keyboardType="numeric"
                                maxLength={10}
                                placeholder="Enter mobile number"
                                placeholderTextColor={Colors.grey}
                                editable={!isSubmitting}
                            />
                        </View>
                    </>
                )}

                <View style={styles.submitButtonWrapper}>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={isSubmitting}
                        style={[styles.submitButtonWrapper, isSubmitting && styles.disabledButton]}
                    >
                        {isSubmitting ? (
                            <View style={styles.submitButton}>
                                <ActivityIndicator color={Colors.white} />
                            </View>
                        ) : (
                            <LinearGradient
                                colors={Colors.gradient.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.submitButton}
                            >
                                <Text style={styles.submitButtonText}>
                                    {isEditMode ? 'Update Ticket' : 'Submit Ticket'}
                                </Text>
                            </LinearGradient>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>

            <Modal
                visible={showSuccessModal}
                transparent
                animationType="fade"
                onRequestClose={handleDone}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={Colors.gradient.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.checkmarkCircle}
                        >
                            <Ionicons name="checkmark" size={50} color={Colors.white} />
                        </LinearGradient>

                        <Text style={styles.modalTitle}>
                            {isEditMode ? 'Ticket Updated Successfully!' : 'Ticket Submitted Successfully!'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {ticketId
                                ? `Ticket ID: ${ticketId.slice(-6)}\n\nOur support team will reach out to you shortly.`
                                : 'Our support team will reach out to you shortly.'}
                        </Text>

                        <TouchableOpacity style={styles.doneButtonWrapper} onPress={handleDone}>
                            <LinearGradient
                                colors={Colors.gradient.primary}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.doneButton}
                            >
                                <Text style={styles.doneButtonText}>View My Tickets</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white
    },
    content: {
        flex: 1,
        padding: Spacing.lg
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: normalize(14),
        color: Colors.grey,
        fontFamily: Typography.fontFamily.regular,
    },
    errorText: {
        fontSize: normalize(16),
        color: Colors.grey,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.medium,
    },
    editModeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        padding: Spacing.md,
        borderRadius: normalize(12),
        marginBottom: Spacing.lg,
        gap: Spacing.xs,
    },
    editModeText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Colors.primary,
        fontFamily: Typography.fontFamily.semiBold,
    },
    bookingDetailsCard: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    detailText: {
        fontSize: normalize(14),
        color: Colors.grey,
        marginTop: Spacing.xxxs,
        fontFamily: Typography.fontFamily.regular,
    },
    inputContainer: {
        marginBottom: Spacing.md
    },
    labelBold: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: Colors.black,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.xxxs,
    },
    textArea: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        fontSize: normalize(15),
        color: Colors.black,
        minHeight: normalize(140),
        fontFamily: Typography.fontFamily.regular,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: normalize(15),
        color: Colors.black,
        height: normalize(45),
        fontFamily: Typography.fontFamily.regular,
    },
    starsContainer: {
        marginBottom: Spacing.md,
    },
    ratingLabel: {
        fontSize: normalize(15),
        fontWeight: '700',
        color: Colors.black,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.sm,
    },
    starsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xs,
    },
    submitButtonWrapper: {
        marginTop: Spacing.lg,
        marginBottom: Spacing.md
    },
    submitButton: {
        paddingVertical: normalize(16),
        borderRadius: normalize(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.7,
    },
    submitButtonText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Colors.white,
        fontFamily: Typography.fontFamily.semiBold,
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Colors.black,
        fontFamily: Typography.fontFamily.semiBold,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: normalize(20),
        padding: Spacing.xl,
        alignItems: 'center',
        width: '90%',
        maxWidth: 400,
    },
    checkmarkCircle: {
        width: normalize(100),
        height: normalize(100),
        borderRadius: normalize(50),
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    modalTitle: {
        fontSize: normalize(22),
        fontWeight: '700',
        color: Colors.black,
        textAlign: 'center',
        marginBottom: Spacing.sm,
        fontFamily: Typography.fontFamily.bold,
    },
    modalSubtitle: {
        fontSize: normalize(14),
        color: Colors.grey,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        fontFamily: Typography.fontFamily.regular,
    },
    doneButtonWrapper: {
        width: '100%'
    },
    doneButton: {
        paddingVertical: normalize(16),
        borderRadius: normalize(12),
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Colors.white,
        fontFamily: Typography.fontFamily.bold,
    },
    bottomSpacing: {
        height: normalize(40)
    },
});

export default RiseTicketScreen;