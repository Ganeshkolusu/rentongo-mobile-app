import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const FeedbackNotificationCard = ({
    timeAgo = "6 min ago",
    onFeedbackPress,
    isOwner = false
}) => {
    // Different text for owner vs customer
    const headerText = isOwner 
        ? 'Booking completed! Please rate your renter\'s experience.' 
        : 'Your ride has been completed!\nHow was your experience?';
    
    const buttonText = isOwner 
        ? 'Give Feedback' 
        : 'Give Feedback';

    return (
        <View style={styles.card}>
            {/* Header Row */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image
                        source={require('../../assets/Icons/gis_car.png')}
                        style={styles.headerIcon}
                    />
                    <Text style={styles.headerTitle}>
                        {headerText}
                    </Text>
                </View>
                <Text style={styles.timeAgo}>{timeAgo}</Text>
            </View>

            {/* Give Feedback Button */}
            <TouchableOpacity
                onPress={onFeedbackPress}
                activeOpacity={0.8}
            >
                <LinearGradient
                    colors={['#63C8FF', '#1E3A5F']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.feedbackButton}
                >
                    <Text style={styles.feedbackButtonText}>{buttonText}</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    headerIcon: {
        width: 40,
        height: 40,
        resizeMode: 'contain',
        marginRight: Spacing.md,
    },
    headerTitle: {
        fontSize: normalize(15),
        fontWeight: '600',
        color: Colors.text.primary,
        flex: 1,
        lineHeight: 22,
    },
    timeAgo: {
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    feedbackButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedbackButtonText: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: Colors.white,
    },
});

export default FeedbackNotificationCard;