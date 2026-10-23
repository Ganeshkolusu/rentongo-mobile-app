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
import { getReviews, transformReviews, deleteReview } from '../api/reviewApi';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const ReviewsListScreen = ({ navigation, route }) => {
    const { vehicleType, vehicleId, vehicleName, canAddReview } = route.params || {};
    const { user } = useAuth();

    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);

    useEffect(() => {
        fetchReviews();
    }, [vehicleType, vehicleId]);

    useFocusEffect(
        React.useCallback(() => {
            fetchReviews();
        }, [vehicleType, vehicleId])
    );

    const fetchReviews = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }

            const response = await getReviews(vehicleType, vehicleId);

            if (response && response.success) {
                const transformedReviews = transformReviews(response.data || []);
                setReviews(transformedReviews);
                setAverageRating(response.averageRating || 0);
                setTotalReviews(response.totalReviews || transformedReviews.length);
            } else {
                setReviews([]);
                setAverageRating(0);
                setTotalReviews(0);
            }
        } catch (error) {
            // Silent catch
            Alert.alert('Error', 'Failed to load reviews');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchReviews(true);
    };

    const handleDeleteReview = (reviewId) => {
        Alert.alert(
            'Delete',
            'Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await deleteReview(reviewId);

                            if (response && response.success) {
                                Alert.alert('Success', 'Review deleted successfully');
                                fetchReviews();
                            } else {
                                Alert.alert('Error', response?.message || 'Failed to delete review');
                            }
                        } catch (error) {
                            // Silent catch
                            Alert.alert('Error', 'Failed to delete review');
                        }
                    },
                },
            ]
        );
    };

    const handleEditReview = (review) => {
        navigation.navigate('EditReviewScreen', {
            reviewId: review.id,
            currentRating: review.rating,
            currentReviewText: review.reviewText,
            vehicleType: vehicleType,
            vehicleId: vehicleId,
            vehicleName: vehicleName,
        });
    };

    const handleAddReview = () => {
        navigation.navigate('AddReviewScreen', {
            vehicleType: vehicleType,
            vehicleId: vehicleId,
            vehicleName: vehicleName,
        });
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Image
                    key={i}
                    source={require('../assets/Icons/star.png')}
                    style={styles.starIcon}
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Image
                    key="half"
                    source={require('../assets/Icons/star-half.png')}
                    style={styles.starIcon}
                />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Image
                    key={`empty-${i}`}
                    source={require('../assets/Icons/star.png')}
                    style={[styles.starIcon, { opacity: 0.2 }]}
                />
            );
        }

        return stars;
    };

    const renderReviewItem = ({ item }) => {
        const isMyReview = item.userId === (user?.userId || user?._id);

        return (
            <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.userInfo}>
                        {item.userProfilePic ? (
                            <Image
                                source={{ uri: item.userProfilePic }}
                                style={styles.userAvatar}
                            />
                        ) : (
                            <View style={styles.userAvatarPlaceholder}>
                                <Text style={styles.userAvatarText}>
                                    {item.userName?.charAt(0)?.toUpperCase() || 'U'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{item.userName}</Text>
                            <Text style={styles.reviewDate}>{item.date}</Text>
                        </View>
                    </View>

                    {isMyReview && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleEditReview(item)}
                            >
                                <Icon name="edit" size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => handleDeleteReview(item.id)}
                            >
                                <Icon name="delete" size={20} color={Colors.error || '#E53935'} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.ratingRow}>
                    {renderStars(item.rating)}
                    <Text style={styles.ratingNumber}>{item.rating.toFixed(1)}</Text>
                </View>

                <Text style={styles.reviewText}>{item.reviewText}</Text>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerSection}>
            <View style={styles.summaryCard}>
                <View style={styles.summaryLeft}>
                    <Text style={styles.averageRatingNumber}>
                        {averageRating.toFixed(1)}
                    </Text>
                    <View style={styles.summaryStars}>
                        {renderStars(averageRating)}
                    </View>
                    <Text style={styles.totalReviewsText}>
                        {totalReviews} {totalReviews === 1 ? 'Review' : 'Reviews'}
                    </Text>
                </View>

                {canAddReview && (
                    <TouchableOpacity
                        style={styles.addReviewButton}
                        onPress={handleAddReview}
                    >
                        <Icon name="rate-review" size={20} color={Colors.white} />
                        <Text style={styles.addReviewButtonText}>Leave Feedback</Text>
                    </TouchableOpacity>
                )}
            </View>

            {vehicleName && (
                <Text style={styles.vehicleNameText}>
                    Reviews for {vehicleName}
                </Text>
            )}
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Icon name="rate-review" size={80} color={Colors.gray} />
            <Text style={styles.emptyTitle}>No Reviews Yet</Text>
            <Text style={styles.emptySubtitle}>
                Be the first to review this {vehicleType?.toLowerCase() || 'vehicle'}!
            </Text>
            {canAddReview && (
                <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={handleAddReview}
                >
                    <Text style={styles.emptyButtonText}>Leave Feedback</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <Header
                    onBackPress={() => navigation.goBack()}
                    title="Reviews"
                    useGradient={false}
                    showIconBackground={true}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                onBackPress={() => navigation.goBack()}
                title="Reviews"
                useGradient={false}
                showIconBackground={true}
            />

            <FlatList
                data={reviews}
                renderItem={renderReviewItem}
                keyExtractor={(item) => item.id?.toString()}
                ListHeaderComponent={renderHeader}
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
        paddingBottom: 30,
    },
    headerSection: {
        marginVertical: Spacing.lg,
    },
    summaryCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    summaryLeft: {
        alignItems: 'center',
    },
    averageRatingNumber: {
        fontSize: normalize(36),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
    },
    summaryStars: {
        flexDirection: 'row',
        marginVertical: Spacing.xs,
    },
    totalReviewsText: {
        fontSize: normalize(13),
        color: Colors.gray,
    },
    addReviewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    addReviewButtonText: {
        color: Colors.white,
        fontSize: normalize(14),
        fontWeight: Typography.fontWeight.semiBold,
        marginLeft: Spacing.xs,
    },
    vehicleNameText: {
        fontSize: normalize(16),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border || '#E0E0E0',
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginRight: Spacing.md,
    },
    userAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    userAvatarText: {
        fontSize: normalize(18),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.primary,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: normalize(15),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    reviewDate: {
        fontSize: normalize(12),
        color: Colors.gray,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    actionButton: {
        padding: Spacing.xs,
        marginLeft: Spacing.xs,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    starIcon: {
        width: normalize(16),
        height: normalize(16),
        marginRight: 2,
        tintColor: '#FFD700',
    },
    ratingNumber: {
        fontSize: normalize(14),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginLeft: Spacing.sm,
    },
    reviewText: {
        fontSize: normalize(14),
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: normalize(60),
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
        marginBottom: Spacing.xl,
    },
    emptyButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    emptyButtonText: {
        color: Colors.white,
        fontSize: normalize(15),
        fontWeight: Typography.fontWeight.semiBold,
    },
});

export default ReviewsListScreen;
