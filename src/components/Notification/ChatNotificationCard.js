import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const ChatNotificationCard = ({
    title = 'New message',
    message = '',
    vehicleName,
    timeAgo,
    read = false,
    onPress,
    onDeletePress,
}) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={[styles.iconCircle, !read && styles.iconCircleUnread]}>
                <Icon name="chatbubble-ellipses" size={20} color="#4F46E5" />
            </View>

            <View style={styles.body}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={1}>{title}</Text>
                    <Text style={styles.timeAgo}>{timeAgo}</Text>
                </View>
                {!!message && (
                    <Text style={styles.message} numberOfLines={2}>{message}</Text>
                )}
                {!!vehicleName && (
                    <Text style={styles.vehicleName} numberOfLines={1}>{vehicleName}</Text>
                )}
            </View>

            <View style={styles.rightCol}>
                {!read && <View style={styles.unreadDot} />}
                <TouchableOpacity onPress={onDeletePress} style={styles.deleteButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="trash-outline" size={16} color={Colors.text.light} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EEF2FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    iconCircleUnread: {
        backgroundColor: '#E0E7FF',
    },
    body: {
        flex: 1,
        minWidth: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    title: {
        flex: 1,
        fontSize: normalize(14),
        fontWeight: '700',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
        marginRight: Spacing.sm,
    },
    timeAgo: {
        fontSize: normalize(11),
        color: Colors.text.light,
        fontFamily: Typography.fontFamily.regular,
    },
    message: {
        fontSize: normalize(13),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginTop: 2,
    },
    vehicleName: {
        fontSize: normalize(11),
        color: Colors.text.light,
        fontFamily: Typography.fontFamily.regular,
        marginTop: 4,
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginLeft: Spacing.sm,
        minHeight: 40,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4F46E5',
    },
    deleteButton: {
        marginTop: 'auto',
        padding: 2,
    },
});

export default ChatNotificationCard;
