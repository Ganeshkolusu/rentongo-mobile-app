import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';

/**
 * In-App Notification Banner
 * Shows notifications when push notifications are disabled
 */
const InAppNotification = ({
    visible,
    type = 'message', // 'message', 'booking', 'call'
    title,
    message,
    onPress,
    onDismiss,
    duration = 4000,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss after duration
            const timer = setTimeout(() => {
                dismissNotification();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const dismissNotification = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss?.();
        });
    };

    const getIcon = () => {
        switch (type) {
            case 'message':
                return 'chatbubble';
            case 'booking':
                return 'car';
            case 'call':
                return 'call';
            default:
                return 'notifications';
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'message':
                return Colors.primary;
            case 'booking':
                return '#4CAF50';
            case 'call':
                return '#FF5722';
            default:
                return Colors.primary;
        }
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <TouchableOpacity
                style={styles.content}
                onPress={() => {
                    dismissNotification();
                    onPress?.();
                }}
                activeOpacity={0.9}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={getIcon()} size={24} color={Colors.white} />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title} numberOfLines={1}>
                        {title}
                    </Text>
                    <Text style={styles.message} numberOfLines={2}>
                        {message}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={dismissNotification}
                >
                    <Ionicons name="close" size={20} color={Colors.white} />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.white,
        marginBottom: 2,
    },
    message: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    closeButton: {
        padding: Spacing.sm,
    },
});

export default InAppNotification;
