import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const NotificationCard = ({ icon, title, subtitle, timeAgo, children }) => {
    return (
        <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    {icon}
                </View>
                <View style={styles.contentWrapper}>
                    <View style={styles.titleRow}>
                        <View style={styles.textContent}>
                            <Text style={styles.title}>{title}</Text>
                            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                        </View>
                        <Text style={styles.timeAgo}>{timeAgo}</Text>
                    </View>
                    {children && (
                        <View style={styles.cardContent}>
                            {children}
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.lg,
        padding: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        marginRight: Spacing.md,
        marginTop: 4,
    },
    contentWrapper: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    textContent: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize.md,
        fontWeight: '600',
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        lineHeight: Typography.lineHeight.md,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.regular,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginTop: 2,
        lineHeight: Typography.lineHeight.sm,
    },
    timeAgo: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.regular,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginTop: 2,
    },
    cardContent: {
        marginTop: Spacing.lg,
    },
});

export default NotificationCard;