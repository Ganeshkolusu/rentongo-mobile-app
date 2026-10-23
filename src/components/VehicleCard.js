import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { normalize, wp, hp, responsiveValue, Spacing, BorderRadius, Layout } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const VehicleCard = ({ title, icon, onPress, style }) => {

    const handlePress = () => {
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={handlePress}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={Colors.gradient.primary}
                style={styles.iconContainer}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 1 }}
            >
                <Image source={icon} style={styles.icon} />
            </LinearGradient>
            <Text style={styles.title}>{title}</Text>
            <Image
                source={require('../assets/Icons/dropdown.png')}
                style={styles.arrowIcon}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: normalize(2) },
        shadowOpacity: 0.08,
        shadowRadius: normalize(8),
        elevation: 4,
        borderWidth: normalize(1),
        borderColor: Colors.border,
    },
    iconContainer: {
        width: normalize(72),
        height: normalize(72),
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.lg,
        overflow:'hidden'
    },
    icon: {
        width: normalize(40),
        height: normalize(40),
        tintColor: Colors.white,
        resizeMode:'contain'
    },
    title: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
    },
    arrowIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.black,
        transform: [{ rotate: '-90deg' }],
    },
});

export default VehicleCard;