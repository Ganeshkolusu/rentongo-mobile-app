import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const Toast = ({ visible, message, type = 'info', onHide, duration = 3000 }) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show toast
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

            // Auto hide after duration
            const timer = setTimeout(() => {
                hideToast();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hideToast = () => {
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
            if (onHide) onHide();
        });
    };

    const getGradientColors = () => {
        switch (type) {
            case 'success':
                return ['#4CAF50', '#2E7D32'];
            case 'error':
                return ['#F44336', '#C62828'];
            case 'warning':
                return ['#FF9800', '#F57C00'];
            case 'info':
            default:
                return Colors.gradient.primary || ['#63C8FF', '#141248'];
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return 'checkmark-circle';
            case 'error':
                return 'close-circle';
            case 'warning':
                return 'warning';
            case 'info':
            default:
                return 'information-circle';
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
                },
            ]}
        >
            <LinearGradient
                colors={getGradientColors()}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    <Icon name={getIcon()} size={24} color={Colors.white} />
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity onPress={hideToast} style={styles.closeButton}>
                        <Icon name="close" size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: Spacing.md,
        right: Spacing.md,
        zIndex: 9999,
        elevation: 10,
    },
    gradient: {
        borderRadius: BorderRadius.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    message: {
        flex: 1,
        color: Colors.white,
        fontSize: normalize(14),
        fontFamily: Typography.fontFamily.medium,
        fontWeight: '500',
        marginLeft: Spacing.sm,
        marginRight: Spacing.sm,
    },
    closeButton: {
        padding: Spacing.xs,
    },
});

export default Toast;
