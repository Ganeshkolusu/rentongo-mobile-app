import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const ReviewCard = ({ review }) => {

    const renderStars = (rating) => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(
                <Image
                    key={i}
                    source={require('../../assets/Icons/star.png')}
                    style={styles.starIcon}
                />
            );
        }

        if (hasHalfStar) {
            stars.push(
                <Image
                    key="half"
                    source={require('../../assets/Icons/star-half.png')}
                    style={styles.starIcon}
                />
            );
        }

        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars.push(
                <Image
                    key={`empty-${i}`}
                    source={require('../../assets/Icons/star.png')}
                    style={[styles.starIcon, { opacity: 0.2 }]}
                />
            );
        }

        return stars;
    };

    return (
        <View style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
                <Image source={review.avatar} style={styles.reviewAvatar} />
                <View style={styles.reviewInfo}>
                    <View style={styles.nameAndRating}>
                        <Text style={styles.reviewerName} numberOfLines={1}>{review.name}</Text>
                        <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                        </View>
                    </View>
                    <Text style={styles.reviewerLocation}>{review.location}</Text>
                    <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    reviewCard: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.border,
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
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    reviewAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: Spacing.md,
    },
    reviewInfo: {
        flex: 1,
    },
    nameAndRating: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    reviewerName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        flex: 1,
    },
    reviewStars: {
        flexDirection: 'row',
        marginLeft: Spacing.sm,
        flexShrink: 0,
    },
    starIcon: {
        width: normalize(16),
        height: normalize(16),
        marginHorizontal: 1,
        tintColor: '#FFD700',
    },
    reviewerLocation: {
        fontSize: Typography.fontSize.sm,
        color: Colors.black,
        fontWeight: Typography.fontWeight.regular,
        marginBottom: Spacing.sm,
    },
    reviewComment: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        lineHeight: Typography.lineHeight.sm,
        fontWeight: Typography.fontWeight.regular,
    },
});

export default ReviewCard;