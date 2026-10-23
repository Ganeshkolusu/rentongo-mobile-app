import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../constants/Dimensions';
import Header from '../components/Header/Header';
import Button from '../components/Button/Button';
import { useAuth } from '../context/AuthContext';
import { addReview } from '../api/reviewApi';

const AddReviewScreen = ({ navigation, route }) => {
    const { vehicleType, vehicleId, bookingId, vehicleName } = route.params || {};
    const { user } = useAuth();

    const [rating, setRating] = useState(0);
    const [reviewText, setReviewText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleStarPress = (star) => {
        setRating(star);
    };

    const validateForm = () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a rating');
            return false;
        }
        if (!reviewText.trim()) {
            Alert.alert('Error', 'Please enter your review');
            return false;
        }
        if (reviewText.length < 10) {
            Alert.alert('Error', 'Review must be at least 10 characters long');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const reviewData = {
                userId: user?.userId || user?._id,
                vechileType: vehicleType,
                VechileId: vehicleId,
                BookingId: bookingId,
                review: reviewText.trim(),
                rating: rating,
            };


            const response = await addReview(reviewData);

            if (response && response.success) {
                Alert.alert(
                    'Success',
                    'Thank you for your review!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response?.message || 'Failed to submit review');
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to submit review. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handleStarPress(star)}
                        style={styles.starButton}
                    >
                        <Image
                            source={require('../assets/Icons/star.png')}
                            style={[
                                styles.starIcon,
                                star <= rating ? styles.starFilled : styles.starEmpty,
                            ]}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Header
                onBackPress={() => navigation.goBack()}
                title={'Leave Feedback'}
                useGradient={false}
                showIconBackground={true}
            />

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Vehicle Info Card */}
                <View style={styles.vehicleInfoCard}>
                    <Text style={styles.vehicleLabel}>{'Description'}</Text>
                    <Text style={styles.vehicleName}>
                        {vehicleName || `${vehicleType || 'Vehicle'}`}
                    </Text>
                    {bookingId && (
                        <Text style={styles.bookingId}>{'Booking'} ID: {bookingId}</Text>
                    )}
                </View>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{'Your Rating'} *</Text>
                    <Text style={styles.sectionSubtitle}>Tap to rate</Text>
                    {renderStars()}
                    {rating > 0 && (
                        <Text style={styles.ratingText}>
                            {rating === 1 && 'Poor'}
                            {rating === 2 && 'Fair'}
                            {rating === 3 && 'Good'}
                            {rating === 4 && 'Very Good'}
                            {rating === 5 && 'Excellent'}
                        </Text>
                    )}
                </View>

                {/* Review Text Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{'Description'} *</Text>
                    <Text style={styles.sectionSubtitle}>
                        Tell us about your experience (minimum 10 characters)
                    </Text>
                    <TextInput
                        style={styles.reviewInput}
                        placeholder="Share your thoughts about this vehicle..."
                        placeholderTextColor={Colors.gray}
                        value={reviewText}
                        onChangeText={setReviewText}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    <Text style={styles.charCount}>
                        {reviewText.length}/500
                    </Text>
                </View>

                {/* Tips Section */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡 Tips for a helpful review:</Text>
                    <Text style={styles.tipItem}>
                        • Share specific details about the vehicle condition
                    </Text>
                    <Text style={styles.tipItem}>
                        • Mention the service quality and cleanliness
                    </Text>
                    <Text style={styles.tipItem}>
                        • Comment on the overall experience
                    </Text>
                    <Text style={styles.tipItem}>
                        • Be honest and constructive
                    </Text>
                </View>

                {/* Submit Button */}
                <Button
                    title={loading ? 'Submitting...' : 'Submit'}
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.submitButton}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingText}>{'Submitting...'}</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 30,
    },
    vehicleInfoCard: {
        backgroundColor: Colors.primary + '10',
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginVertical: Spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    vehicleLabel: {
        fontSize: normalize(12),
        color: Colors.gray,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    vehicleName: {
        fontSize: normalize(18),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    bookingId: {
        fontSize: normalize(12),
        color: Colors.gray,
        marginTop: Spacing.xs,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: normalize(16),
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
        fontSize: normalize(13),
        color: Colors.gray,
        marginBottom: Spacing.md,
    },
    starsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
    },
    starButton: {
        padding: Spacing.xs,
    },
    starIcon: {
        width: normalize(44),
        height: normalize(44),
    },
    starFilled: {
        tintColor: '#FFD700',
    },
    starEmpty: {
        tintColor: '#DDD',
    },
    ratingText: {
        fontSize: normalize(16),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.primary,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    reviewInput: {
        backgroundColor: Colors.background || '#F5F5F5',
        borderWidth: 1,
        borderColor: Colors.border || '#E0E0E0',
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: normalize(15),
        color: Colors.text.primary,
        height: 140,
    },
    charCount: {
        fontSize: normalize(12),
        color: Colors.gray,
        textAlign: 'right',
        marginTop: Spacing.xs,
    },
    tipsCard: {
        backgroundColor: '#FFF9E6',
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    tipsTitle: {
        fontSize: normalize(14),
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    tipItem: {
        fontSize: normalize(13),
        color: Colors.text.secondary,
        marginBottom: Spacing.xs,
        lineHeight: 20,
    },
    submitButton: {
        marginVertical: Spacing.md,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.sm,
    },
    loadingText: {
        marginLeft: Spacing.sm,
        fontSize: normalize(14),
        color: Colors.gray,
    },
});

export default AddReviewScreen;
