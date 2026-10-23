import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing } from '../constants/Dimensions';
import BottomDrawer from './BottomDrawer';
import Button from '../components/Button/Button';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addReview } from '../api/reviewApi'; // ✅ Use the review API

const FeedbackPopUp = ({
    visible,
    onClose,
    vehicleId,
    bookingId,
    vehicleType = "Car",
    onSuccess, // Optional callback after successful submission
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleStarPress = (starIndex) => {
        setRating(starIndex + 1);
    };

    const handleSubmit = async () => {
        // Validation
        if (!rating || rating === 0) {
            Alert.alert('Rating Required', 'Please select a star rating before submitting.');
            return;
        }

        if (!comment.trim()) {
            Alert.alert('Review Required', 'Please write a review before submitting.');
            return;
        }

        if (!bookingId) {
            Alert.alert('Error', 'Booking ID is missing. Cannot submit review.');
            return;
        }

        try {
            setSubmitting(true);

            // Get userId from AsyncStorage
            const userId = await AsyncStorage.getItem('userId');
            if (!userId) {
                Alert.alert('Error', 'User not logged in. Please login to submit a review.');
                setSubmitting(false);
                return;
            }

            const reviewData = {
                userId,
                vechileType: vehicleType,
                VechileId: vehicleId,
                BookingId: bookingId,
                review: comment.trim(),
                rating,
            };


            // ✅ Use the addReview function from reviewApi
            const result = await addReview(reviewData);

            if (result.success) {

                Alert.alert(
                    '🎉 Thank You!', 
                    'Your feedback has been submitted successfully.',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Reset form
                                setRating(0);
                                setComment('');
                                
                                // Call success callback if provided
                                if (onSuccess) {
                                    onSuccess(result.data);
                                }
                                
                                // Close drawer
                                onClose();
                            }
                        }
                    ]
                );
            } else {

                Alert.alert('Submission Failed', result.message || 'Failed to submit feedback. Please try again.');
            }
        } catch (error) {

            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Reset form
        setRating(0);
        setComment('');
        onClose();
    };

    // Get rating description
    const getRatingDescription = () => {
        switch (rating) {
            case 1: return 'Poor';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Very Good';
            case 5: return 'Excellent';
            default: return 'Tap to rate';
        }
    };

    return (
        <BottomDrawer
            visible={visible}
            onClose={handleCancel}
            showHandle={true}
            showCloseButton={false}
            height={630}
        >
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
            >
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>We Value Your Feedback</Text>
                        <Text style={styles.subtitle}>
                            Rate your experience with this booking
                        </Text>
                    </View>

                    {/* ⭐ Rating Section */}
                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>Your Rating</Text>
                        <View style={styles.starsContainer}>
                            {[0, 1, 2, 3, 4].map((starIndex) => (
                                <TouchableOpacity
                                    key={starIndex}
                                    onPress={() => handleStarPress(starIndex)}
                                    style={styles.starButton}
                                    activeOpacity={0.7}
                                >
                                    <Icon
                                        name={starIndex < rating ? 'star' : 'star-outline'}
                                        size={40}
                                        color={starIndex < rating ? '#FFD700' : '#b1adadff'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.ratingDescription}>
                            {getRatingDescription()}
                        </Text>
                    </View>

                    {/* ✍️ Comment Section */}
                    <View style={styles.commentSection}>
                        <Text style={styles.commentLabel}>Your Review</Text>
                        <View style={styles.commentInputContainer}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder="Tell us about your experience..."
                                placeholderTextColor="#999"
                                value={comment}
                                onChangeText={setComment}
                                multiline={true}
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={1000}
                            />
                            <View style={styles.pencilIconContainer}>
                                <FontAwesome name="pencil-square-o" size={20} color="#999" />
                            </View>
                        </View>
                        <Text style={styles.characterCount}>
                            {comment.length}/1000 characters
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                            disabled={submitting}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <Button
                            title={submitting ? 'Submitting...' : 'Submit Review'}
                            onPress={handleSubmit}
                            disabled={submitting || !rating || !comment.trim()}
                            variant="filled"
                            style={[
                                styles.submitButton,
                                (submitting || !rating || !comment.trim()) && styles.submitButtonDisabled
                            ]}
                        />
                    </View>

                    {/* Loading Indicator */}
                    {submitting && (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={Colors.primary} />
                            <Text style={styles.loadingText}>Submitting your review...</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </BottomDrawer>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: Spacing.lg,
    },
    container: {
        flex: 1,
    },
    header: {
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary || Colors.black,
    },
    ratingSection: {
        marginBottom: Spacing.xl,
        alignItems: 'center',
    },
    ratingLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: Spacing.sm,
    },
    starButton: {
        padding: Spacing.xs,
        marginHorizontal: 4,
    },
    ratingDescription: {
        fontSize: Typography.fontSize.md,
        color: Colors.primary,
        fontWeight: Typography.fontWeight.medium,
        marginTop: Spacing.xs,
    },
    commentSection: {
        marginBottom: Spacing.xl,
    },
    commentLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    commentInputContainer: {
        position: 'relative',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        paddingRight: 50,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        minHeight: 150,
        backgroundColor: '#F8F9FA',
    },
    pencilIconContainer: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    characterCount: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary || '#999',
        marginTop: Spacing.xs,
        textAlign: 'right',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.primary,
    },
    submitButton: {
        flex: 1,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.md,
    },
    loadingText: {
        marginLeft: Spacing.sm,
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary || '#999',
    },
});

export default FeedbackPopUp;