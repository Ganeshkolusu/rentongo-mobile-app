import React, { useState, useEffect } from 'react';
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
import { updateReview } from '../api/reviewApi';

const EditReviewScreen = ({ navigation, route }) => {
    const {
        reviewId,
        currentRating,
        currentReviewText,
        vehicleType,
        vehicleId,
        vehicleName,
    } = route.params || {};

    const [rating, setRating] = useState(currentRating || 0);
    const [reviewText, setReviewText] = useState(currentReviewText || '');
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

    const handleUpdate = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const updateData = {
                reviewText: reviewText.trim(),
                rating: rating,
            };


            const response = await updateReview(reviewId, updateData);

            if (response && response.success) {
                Alert.alert(
                    'Success',
                    'Review updated successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack(),
                        },
                    ]
                );
            } else {
                Alert.alert('Error', response?.message || 'Failed to update review');
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to update review. Please try again.');
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
                title="Edit Review"
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
                    <Text style={styles.vehicleLabel}>Editing Review</Text>
                    <Text style={styles.vehicleName}>
                        {vehicleName || `${vehicleType || 'Vehicle'}`}
                    </Text>
                </View>

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rating *</Text>
                    <Text style={styles.sectionSubtitle}>Tap to change rating</Text>
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
                    <Text style={styles.sectionTitle}>Review *</Text>
                    <Text style={styles.sectionSubtitle}>
                        Update your thoughts (minimum 10 characters)
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

                {/* Update Button */}
                <Button
                    title={loading ? 'Saving...' : 'Update Review'}
                    onPress={handleUpdate}
                    disabled={loading}
                    style={styles.updateButton}
                />

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingText}>Saving...</Text>
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
    updateButton: {
        marginVertical: Spacing.md,
    },
    cancelButton: {
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.gray,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cancelButtonText: {
        color: Colors.gray,
        fontSize: normalize(16),
        fontWeight: Typography.fontWeight.semiBold,
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

export default EditReviewScreen;
