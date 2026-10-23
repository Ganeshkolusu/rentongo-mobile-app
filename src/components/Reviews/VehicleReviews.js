import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getReviews as getReviewsApi } from '../../api/reviewApi';
import { getUserById } from '../../api/userApi';
import { Colors } from '../../constants/Colors';

// Default avatar image
const DEFAULT_AVATAR = require('../../assets/Icons/user-avatar.png');
const DROPDOWN_ICON = require('../../assets/Icons/dropdown.png');

// Transform review data for UI display
const transformReviews = async (apiReviews) => {
    if (!Array.isArray(apiReviews)) return [];

    // Fetch customer data for all reviews
    const reviewsWithCustomerData = await Promise.all(
        apiReviews.map(async (review) => {
            const formatDate = (dateString) => {
                if (!dateString) return 'N/A';
                const date = new Date(dateString);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                return `${day}-${month}-${year}`;
            };

            let customerName = 'Anonymous User';
            let customerProfilePic = null;
            let customerLocation = '';

            // Try multiple sources for customer ID
            const customerId = 
                review.customerId || 
                review.userId?._id || 
                review.userId || 
                review.CustomerId ||
                review.UserId;
            
            // First priority: Fetch from API if we have an ID
            if (customerId && typeof customerId === 'string') {
                try {
                    const customerData = await getUserById(customerId);
                    
                    // API returns { user: {...} } not { data: {...} }
                    const userData = customerData.user || customerData.data;
                    
                    if (customerData && userData) {
                        customerName = userData.name || userData.Name || 'Anonymous User';
                        customerProfilePic = userData.profilePic || userData.ProfilePic || null;
                        customerLocation = 
                            userData.location || 
                            userData.city || 
                            userData.address || 
                            userData.Location ||
                            userData.City ||
                            userData.Address || 
                            '';
                    }
                } catch (error) {
                    // Error fetching customer data
                }
            }
            
            // Second priority: Use embedded userId data if API call failed or no ID
            if (customerName === 'Anonymous User' && review.userId && typeof review.userId === 'object') {
                customerName = review.userId.name || review.userId.Name || 'Anonymous User';
                customerProfilePic = review.userId.profilePic || review.userId.ProfilePic || null;
                customerLocation = 
                    review.userId.location || 
                    review.userId.city || 
                    review.userId.address ||
                    review.userId.Location ||
                    review.userId.City ||
                    review.userId.Address || 
                    '';
            }

            // Third priority: Check for direct name fields in review
            if (customerName === 'Anonymous User') {
                customerName = 
                    review.customerName || 
                    review.userName || 
                    review.name ||
                    review.CustomerName ||
                    review.UserName ||
                    review.Name ||
                    'Anonymous User';
            }

            return {
                id: review._id,
                customerId: review.customerId,
                userId: review.userId?._id || review.userId,
                userName: customerName,
                userProfilePic: customerProfilePic,
                userLocation: customerLocation,
                vehicleType: review.vechileType || review.vehicleType,
                vehicleId: review.VechileId || review.vehicleId,
                bookingId: review.BookingId || review.bookingId,
                reviewText: review.review || review.Review,
                rating: review.rating || review.Rating || 0,
                date: formatDate(review.createdAt),
                timestamp: review.createdAt,
                isActive: review.isActive !== false,
            };
        })
    );

    return reviewsWithCustomerData;
};

const VehicleReviews = ({ vehicleId, vehicleType }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [stats, setStats] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingBreakdown: {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0,
        },
    });

    useEffect(() => {
        fetchReviews();
    }, [vehicleId, vehicleType]);

    const fetchReviews = async () => {
        try {
            setLoading(true);

            const response = await getReviewsApi(vehicleType, vehicleId);

            let reviewsData = [];
            if (response && response.success && response.data && Array.isArray(response.data)) {
                reviewsData = await transformReviews(response.data);
                calculateStats(reviewsData);
            } else {
                setReviews([]);
                calculateStats([]);
            }

            setReviews(reviewsData);
        } catch (error) {
            setReviews([]);
            calculateStats([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (reviewsData) => {
        if (!reviewsData || reviewsData.length === 0) {
            setStats({
                averageRating: 0,
                totalReviews: 0,
                ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            });
            return;
        }

        const totalReviews = reviewsData.length;
        const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

        let totalRating = 0;
        reviewsData.forEach((review) => {
            const rating = Math.round(review.rating || review.Rate || 0);
            if (rating >= 1 && rating <= 5) {
                breakdown[rating] += 1;
                totalRating += rating;
            }
        });

        const averageRating = totalReviews > 0 ? (totalRating / totalReviews).toFixed(1) : 0;

        setStats({
            averageRating: parseFloat(averageRating),
            totalReviews,
            ratingBreakdown: breakdown,
        });
    };

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push(<Text key={i} style={styles.starFilled}>★</Text>);
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push(<Text key={i} style={styles.starHalf}>★</Text>);
            } else {
                stars.push(<Text key={i} style={styles.starEmpty}>★</Text>);
            }
        }

        return <View style={styles.starsContainer}>{stars}</View>;
    };

    const renderRatingBar = (starCount) => {
        const percentage = stats.totalReviews > 0
            ? (stats.ratingBreakdown[starCount] / stats.totalReviews) * 100
            : 0;

        return (
            <View style={styles.ratingBarRow} key={starCount}>
                <Text style={styles.starNumber}>{starCount}</Text>
                <Text style={styles.starIcon}>★</Text>
                <View style={styles.barBackground}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                </View>
                <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
            </View>
        );
    };

    const renderReviewItem = (review, index) => {
        const userName = review.userName || 'Anonymous User';
        const userLocation = review.userLocation || '';
        const reviewText = review.reviewText || '';
        const rating = review.rating || 0;
        const hasProfilePic = review.userProfilePic && review.userProfilePic !== '';

        return (
            <View key={review.id || index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                    <View style={styles.userAvatarContainer}>
                        {hasProfilePic ? (
                            <Image 
                                source={{ uri: review.userProfilePic }} 
                                style={styles.userAvatar}
                                defaultSource={DEFAULT_AVATAR}
                            />
                        ) : (
                            <Image 
                                source={DEFAULT_AVATAR} 
                                style={styles.userAvatar}
                            />
                        )}
                    </View>
                    <View style={styles.reviewContent}>
                        <View style={styles.nameAndStars}>
                            <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
                            <View style={styles.reviewStars}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Text key={star} style={[
                                        styles.reviewStar,
                                        star <= Math.floor(rating) && styles.reviewStarFilled,
                                        star === Math.ceil(rating) && rating % 1 >= 0.5 && styles.reviewStarHalf
                                    ]}>★</Text>
                                ))}
                            </View>
                        </View>
                        {userLocation ? (
                            <Text style={styles.userLocation}>{userLocation}</Text>
                        ) : null}
                        {reviewText ? (
                            <Text style={styles.reviewText}>{reviewText}</Text>
                        ) : null}
                    </View>
                </View>
            </View>
        );
    };

    const handleSeeMore = () => {
        setShowAll(!showAll);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    const displayedReviews = showAll ? reviews : reviews.slice(0, 2);

    return (
        <View style={styles.container}>
            {/* Reviews Title */}
            <Text style={styles.mainTitle}>Reviews</Text>

            {/* Ratings & Reviews Section */}
            <View style={styles.ratingsHeader}>
                <Text style={styles.starIconHeader}>☆</Text>
                <Text style={styles.ratingsHeaderText}>Ratings & Reviews</Text>
            </View>

            {/* Rating Summary */}
            <View style={styles.ratingSummary}>
                <View style={styles.ratingScoreContainer}>
                    <Text style={styles.ratingScore}>{stats.averageRating}</Text>
                    <Text style={styles.reviewCount}>{stats.totalReviews} reviews</Text>
                    <View style={styles.summaryStars}>
                        {[1, 2, 3, 4, 5].map((star) => {
                            const avgRating = stats.averageRating;
                            const isFilled = star <= Math.floor(avgRating);
                            const isHalf = star === Math.ceil(avgRating) && avgRating % 1 >= 0.5;
                            
                            return (
                                <Text key={star} style={[
                                    styles.summaryStar,
                                    isFilled && styles.summaryStarFilled,
                                    isHalf && styles.summaryStarHalf
                                ]}>★</Text>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.ratingBars}>
                    {[5, 4, 3, 2, 1].map(renderRatingBar)}
                </View>
            </View>

            {/* Customers Reviews */}
            <Text style={styles.customersReviewsTitle}>Customers Reviews</Text>

            {reviews.length === 0 ? (
                <View style={styles.noReviewsContainer}>
                    <Text style={styles.noReviewsText}>No reviews yet</Text>
                </View>
            ) : (
                <>
                    {displayedReviews.map(renderReviewItem)}

                    {reviews.length > 2 && (
                        <TouchableOpacity
                            style={styles.seeMoreButton}
                            onPress={handleSeeMore}
                        >
                            <Text style={styles.seeMoreText}>See More</Text>
                            <Image 
                                source={DROPDOWN_ICON} 
                                style={[
                                    styles.dropdownIcon,
                                    showAll && styles.dropdownIconRotated
                                ]}
                            />
                        </TouchableOpacity>
                    )}
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingTop: 24,
        paddingBottom: 16,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    ratingsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    starIconHeader: {
        fontSize: 16,
        color: '#000000',
        marginRight: 6,
    },
    ratingsHeaderText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    ratingSummary: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 24,
    },
    ratingScoreContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 16,
    },
    ratingScore: {
        fontSize: 48,
        fontWeight: '700',
        color: '#000000',
        lineHeight: 56,
    },
    reviewCount: {
        fontSize: 14,
        fontWeight: '400',
        color: '#666666',
        marginTop: 4,
        marginBottom: 8,
    },
    summaryStars: {
        flexDirection: 'row',
        gap: 2,
    },
    summaryStar: {
        fontSize: 16,
        color: '#E0E0E0',
    },
    summaryStarFilled: {
        color: '#FFD700',
    },
    summaryStarHalf: {
        color: '#FFD700',
        opacity: 0.5,
    },
    ratingBars: {
        flex: 1,
        justifyContent: 'center',
        gap: 4,
    },
    ratingBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 2,
    },
    starNumber: {
        fontSize: 14,
        fontWeight: '400',
        color: '#000000',
        width: 12,
    },
    starIcon: {
        fontSize: 14,
        color: '#FFD700',
        marginLeft: 4,
        marginRight: 8,
    },
    barBackground: {
        flex: 1,
        height: 6,
        backgroundColor: '#E8E8E8',
        borderRadius: 3,
        marginRight: 8,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#4A90E2',
        borderRadius: 3,
    },
    percentageText: {
        fontSize: 12,
        fontWeight: '400',
        color: '#666666',
        width: 36,
        textAlign: 'right',
    },
    customersReviewsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    noReviewsContainer: {
        padding: 32,
        alignItems: 'center',
    },
    noReviewsText: {
        fontSize: 16,
        color: '#999999',
    },
    reviewCard: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E8E8E8',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 16,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
    },
    userAvatarContainer: {
        marginRight: 12,
    },
    userAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    reviewContent: {
        flex: 1,
    },
    nameAndStars: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    userName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
        marginRight: 8,
    },
    reviewStars: {
        flexDirection: 'row',
        gap: 1,
    },
    reviewStar: {
        fontSize: 18,
        color: '#E0E0E0',
    },
    reviewStarFilled: {
        color: '#FFD700',
    },
    reviewStarHalf: {
        color: '#FFD700',
        opacity: 0.5,
    },
    userLocation: {
        fontSize: 15,
        fontWeight: '400',
        color: '#666666',
        marginBottom: 8,
    },
    reviewText: {
        fontSize: 15,
        fontWeight: '400',
        color: '#666666',
        lineHeight: 18,
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginHorizontal: 16,
    },
    seeMoreText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginRight: 8,
    },
    dropdownIcon: {
        width: 25,
        height: 20,
        tintColor: '#000000',
    },
    dropdownIconRotated: {
        transform: [{ rotate: '180deg' }],
    },
});

export default VehicleReviews;