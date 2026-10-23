import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { deleteTicket, getTicketsByUser } from '../api/supportApi';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';

const TicketDetailsScreen = ({ navigation }) => {
    const { userId, isAuthenticated, loading: authLoading } = useAuth();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Refresh tickets when screen comes into focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            if (isAuthenticated && userId) {
                fetchTickets();
            }
        });
        return unsubscribe;
    }, [navigation, isAuthenticated, userId]);

    useEffect(() => {
        if (isAuthenticated && userId) {
            fetchTickets();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, userId]);

    const fetchTickets = async () => {
        try {
            setLoading(true);

            const ticketsArray = await getTicketsByUser(userId);
            
            setTickets(ticketsArray);
            
        } catch (error) {
            // Check for specific backend configuration error
            if (error.message.includes('BACKEND_CONFIG_ERROR')) {
                Alert.alert(
                    'Server Issue',
                    'There is a technical issue with the server. Please try again later.',
                    [
                        { text: 'Try Again', onPress: () => fetchTickets() },
                        { text: 'OK', style: 'cancel' }
                    ]
                );
            }
            // API endpoint doesn't exist
            else if (error.message.includes('API_ERROR') || error.message.includes('HTML instead of JSON')) {
                Alert.alert(
                    'Connection Error',
                    'Unable to connect to the server. Please check your internet connection.',
                    [
                        { text: 'Retry', onPress: () => fetchTickets() },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }
            // Parse error
            else if (error.message.includes('PARSE_ERROR')) {
                Alert.alert(
                    'Data Format Error',
                    'Received invalid data from server. Please try again.',
                    [
                        { text: 'Retry', onPress: () => fetchTickets() },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }
            // Network errors
            else if (error.message.includes('Network request failed') ||
                     error.message.includes('Failed to fetch')) {
                Alert.alert(
                    'Network Error',
                    'Could not connect to the server. Please check your internet connection.',
                    [
                        { text: 'Retry', onPress: () => fetchTickets() },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }
            // Generic error
            else {
                Alert.alert(
                    'Error Loading Tickets',
                    `Could not load your tickets. Please try again.\n\nError: ${error.message.substring(0, 100)}`,
                    [
                        { text: 'Retry', onPress: () => fetchTickets() },
                        { text: 'Cancel', style: 'cancel' }
                    ]
                );
            }
            
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTickets();
        setRefreshing(false);
    }, [userId]);

    const handleCreateTicket = () => {
        try {
            navigation.navigate('RiseTicketScreen', { mode: 'create' });
        } catch (error) {
            Alert.alert('Navigation Error', `Could not navigate to ticket creation screen: ${error.message}`);
        }
    };

    const handleEditTicket = (ticket) => {
        try {
            navigation.navigate('RiseTicket', { 
                mode: 'edit',
                ticketData: ticket 
            });
        } catch (error) {
            navigation.navigate('RiseTicketScreen', { 
                mode: 'edit',
                ticketData: ticket 
            });
        }
    };

    const handleDeleteTicket = (ticket) => {
        Alert.alert(
            'Delete Ticket',
            'Are you sure you want to delete this ticket?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteTicket(ticket._id);
                            Alert.alert('Success', 'Ticket deleted successfully');
                            fetchTickets();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete ticket');
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return Colors.warning || '#FFA500';
            case 'closed':
                return Colors.success || '#4CAF50';
            case 'in progress':
                return Colors.info || '#2196F3';
            default:
                return Colors.grey;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return '#FF5252';
            case 'medium':
                return '#FFA726';
            case 'low':
                return '#66BB6A';
            default:
                return Colors.grey;
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const renderTicketCard = ({ item }) => {
    // Helper function to check if bookingId is valid (not all zeros)
    const isValidBookingId = (bookingId) => {
        if (!bookingId) return false;
        // Check if it's not all zeros
        return bookingId.replace(/0/g, '') !== '';
    };

    return (
        <View style={styles.ticketCard}>
            {/* Header with Subject only - ID removed */}
            <View style={styles.ticketHeader}>
                <View style={styles.ticketTitleContainer}>
                    <Text style={styles.ticketSubject}>{item.subject || 'No Subject'}</Text>
                </View>
            </View>

            {/* Description */}
            <Text style={styles.ticketDescription} numberOfLines={3}>
                {item.description || 'No description provided'}
            </Text>

            {/* Additional Info - Only show if there's valid data */}
            {(item.vehicleType || isValidBookingId(item.bookingId)) && (
                <View style={styles.ticketAdditionalInfo}>
                    {item.vehicleType && (
                        <View style={styles.infoItem}>
                            <Ionicons name="car-outline" size={14} color={Colors.grey} />
                            <Text style={styles.infoText}>{item.vehicleType}</Text>
                        </View>
                    )}
                    {isValidBookingId(item.bookingId) && (
                        <View style={styles.infoItem}>
                            <Ionicons name="document-text-outline" size={14} color={Colors.grey} />
                            <Text style={styles.infoText}>Booking: {item.bookingId.slice(-6)}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Images if available */}
            {item.images && item.images.length > 0 && (
                <View style={styles.imageContainer}>
                    <Ionicons name="image-outline" size={16} color={Colors.primary} />
                    <Text style={styles.imageText}>{item.images.length} photo(s) attached</Text>
                </View>
            )}

            {/* Review and Rating if available */}
            {(item.review || item.rating > 0) && (
                <View style={styles.reviewContainer}>
                    {item.rating > 0 && (
                        <View style={styles.ratingRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Ionicons
                                    key={star}
                                    name={star <= item.rating ? 'star' : 'star-outline'}
                                    size={14}
                                    color="#FFD700"
                                />
                            ))}
                        </View>
                    )}
                    {item.review && (
                        <Text style={styles.reviewText} numberOfLines={2}>
                            {item.review}
                        </Text>
                    )}
                </View>
            )}

            {/* Footer with Priority and Date */}
            <View style={styles.ticketFooter}>
                <View style={styles.ticketInfo}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                        <Text style={styles.priorityText}>{item.priority || 'Low'}</Text>
                    </View>
                    <Text style={styles.ticketDate}>{formatDate(item.createdAt)}</Text>
                </View>
            </View>
        </View>
    );
};
    if (authLoading) {
        return (
            <View style={styles.container}>
                <Header
                    title="Support Tickets"
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
                    title="Support Tickets"
                    onBackPress={() => navigation.goBack()}
                    showMoreButton={false}
                    useGradient={true}
                    showIconBackground={false}
                    gradientColors={Colors.gradient.primary}
                />
                <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed-outline" size={64} color={Colors.grey} />
                    <Text style={styles.emptyText}>Please login to view your tickets</Text>
                    <TouchableOpacity
                        style={styles.loginButtonWrapper}
                        onPress={() => navigation.navigate('Login')}
                    >
                        <LinearGradient
                            colors={Colors.gradient.primary}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginButton}
                        >
                            <Text style={styles.loginButtonText}>Login</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                title="Support Tickets"
                onBackPress={() => navigation.goBack()}
                showMoreButton={false}
                useGradient={true}
                showIconBackground={false}
                gradientColors={Colors.gradient.primary}
            />

            {/* Create Ticket Button */}
            <View style={styles.createButtonContainer}>
                <TouchableOpacity
                    style={styles.createTicketButtonWrapper}
                    onPress={handleCreateTicket}
                >
                    <LinearGradient
                        colors={Colors.gradient.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.createTicketButton}
                    >
                        <Ionicons name="add-circle-outline" size={24} color={Colors.white} />
                        <Text style={styles.createTicketButtonText}>Create New Ticket</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* View Tickets Section */}
            <View style={styles.viewTicketsSection}>
                <Text style={styles.sectionTitle}>My Tickets</Text>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Loading tickets...</Text>
                    </View>
                ) : tickets.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                        <Ionicons name="ticket-outline" size={64} color={Colors.grey} />
                        <Text style={styles.emptyStateText}>No tickets found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            Create your first support ticket to get started
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={tickets}
                        renderItem={renderTicketCard}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    emptyText: {
        fontSize: normalize(16),
        color: Colors.grey,
        marginTop: Spacing.md,
        marginBottom: Spacing.xl,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.medium,
    },
    loginButtonWrapper: {
        width: '80%',
        borderRadius: normalize(12),
        overflow: 'hidden',
    },
    loginButton: {
        paddingVertical: normalize(14),
        alignItems: 'center',
    },
    loginButtonText: {
        color: Colors.white,
        fontSize: normalize(16),
        fontWeight: '700',
        fontFamily: Typography.fontFamily.bold,
    },
    createButtonContainer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    createTicketButtonWrapper: {
        borderRadius: normalize(12),
        overflow: 'hidden',
    },
    createTicketButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(16),
        gap: Spacing.xs,
    },
    createTicketButtonText: {
        color: Colors.white,
        fontSize: normalize(16),
        fontWeight: '700',
        fontFamily: Typography.fontFamily.bold,
    },
    viewTicketsSection: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: Colors.black,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.md,
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    emptyStateText: {
        fontSize: normalize(18),
        fontWeight: '600',
        color: Colors.grey,
        marginTop: Spacing.md,
        fontFamily: Typography.fontFamily.semiBold,
    },
    emptyStateSubtext: {
        fontSize: normalize(14),
        color: Colors.grey,
        marginTop: Spacing.xs,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.regular,
    },
    listContent: {
        paddingBottom: Spacing.xl,
    },
    ticketCard: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.md,
        marginBottom: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    ticketTitleContainer: {
        flex: 1,
    },
    ticketSubject: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Colors.black,
        marginBottom: 4,
        fontFamily: Typography.fontFamily.bold,
    },
    ticketDescription: {
        fontSize: normalize(14),
        color: Colors.grey,
        marginBottom: Spacing.md,
        fontFamily: Typography.fontFamily.regular,
    },
    ticketFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ticketInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    priorityBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: normalize(4),
    },
    priorityText: {
        color: Colors.white,
        fontSize: normalize(10),
        fontWeight: '600',
        textTransform: 'uppercase',
        fontFamily: Typography.fontFamily.semiBold,
    },
    ticketDate: {
        fontSize: normalize(12),
        color: Colors.grey,
        fontFamily: Typography.fontFamily.regular,
    },
    ticketAdditionalInfo: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.lightGrey || '#F5F5F5',
        paddingHorizontal: Spacing.xs,
        paddingVertical: 4,
        borderRadius: normalize(6),
    },
    infoText: {
        fontSize: normalize(12),
        color: Colors.grey,
        fontFamily: Typography.fontFamily.regular,
    },
    imageContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xxxs,
        backgroundColor: Colors.primary + '10',
        paddingHorizontal: Spacing.xs,
        paddingVertical: 6,
        borderRadius: normalize(6),
        marginBottom: Spacing.sm,
        alignSelf: 'flex-start',
    },
    imageText: {
        fontSize: normalize(12),
        color: Colors.primary,
        fontWeight: '600',
        fontFamily: Typography.fontFamily.semiBold,
    },
    reviewContainer: {
        backgroundColor: Colors.lightGrey || '#F5F5F5',
        padding: Spacing.sm,
        borderRadius: normalize(8),
        marginBottom: Spacing.sm,
    },
    ratingRow: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: Spacing.xxxs,
    },
    reviewText: {
        fontSize: normalize(13),
        color: Colors.grey,
        fontStyle: 'italic',
        fontFamily: Typography.fontFamily.regular,
    },
});

export default TicketDetailsScreen;