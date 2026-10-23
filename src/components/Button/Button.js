// src/components/PrimaryButton.js
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Layout, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const Button = ({ title, onPress, icon, variant = 'filled', style, disabled = false }) => {
    if (variant === 'outline') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[style, disabled && styles.disabled]}
                disabled={disabled}
            >
                <LinearGradient
                    colors={disabled ? ['#A0A0A0', '#C0C0C0'] : ['#141248', '#63C8FF']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.outlineWrapper}
                >
                    <View style={styles.outlineInner}>
                        <View style={styles.content}>
                            {icon && <View style={styles.iconWrapper}>{icon}</View>}
                            <Text style={[styles.outlineButtonText, disabled && styles.disabledText]}>{title}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    if (variant === 'tertiary') {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.8}
                style={[style, disabled && styles.disabled]}
                disabled={disabled}
            >
                <LinearGradient
                    colors={disabled ? ['#A0A0A0', '#C0C0C0'] : ['#141248', '#63C8FF']}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.outlineWrapper1}
                >
                    <View style={styles.outlineInner}>
                        <View style={styles.content1}>
                            {icon && <View style={styles.iconWrapper}>{icon}</View>}
                            <Text style={[styles.outlineButtonText1, disabled && styles.disabledText]}>{title}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.8}
            style={[style, disabled && styles.disabled]}
            disabled={disabled}
        >
            <LinearGradient
                colors={disabled ? ['#A0A0A0', '#C0C0C0'] : ['#1A1A52', '#5AC8FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
            >
                <View style={styles.content}>
                    {icon && <View style={styles.iconWrapper}>{icon}</View>}
                    <Text style={styles.buttonText}>{title}</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: normalize(50),
        minHeight: normalize(50),
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content1: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineWrapper: {
        height: normalize(50),
        minHeight: normalize(50),
        borderRadius: BorderRadius.lg,
        padding: normalize(2),
    },
    outlineWrapper1: {
        height: normalize(50),
        minHeight: normalize(50),
        borderRadius: BorderRadius.lg,
        padding: normalize(1.5),
        width: normalize(280)
    },
    outlineInner: {
        flex: 1,
        borderRadius: BorderRadius.lg - normalize(2),
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconWrapper: {
        marginRight: Spacing.sm,
    },
    buttonText: {
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.white,
    },
    outlineButton: {
        height: Layout.buttonHeight,
        borderRadius: BorderRadius.lg,
        borderWidth: normalize(1),
        borderColor: '#4A90E2',
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    outlineButtonText: {
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#4A90E2',
    },
    outlineButtonText1: {
        fontSize: Typography.fontSize.md,
        lineHeight: Typography.lineHeight.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#4A90E2',
    },
    disabled: {
        opacity: 0.6,
    },
    disabledText: {
        color: '#888888',
    },
});

export default Button;
