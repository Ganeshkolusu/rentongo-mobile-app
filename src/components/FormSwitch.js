import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, normalize } from '../constants/Dimensions';

const FormSwitch = ({ label, value, onValueChange, style }) => {
    const animatedValue = React.useRef(new Animated.Value(value ? 1 : 0)).current;

    React.useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [value]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 2],
        outputRange: [2, 26],
    });

    const borderColor = animatedValue.interpolate({
        inputRange: [0, 2],
        outputRange: [Colors.dotInactive, Colors.black],
    });

    const thumbBackgroundColor = animatedValue.interpolate({
        inputRange: [0, 2],
        outputRange: [Colors.dotInactive, Colors.black],
    });

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.switchWrapper}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onValueChange(!value)}
                >
                    <Animated.View style={[styles.track, { borderColor, borderWidth: 2 }]}>
                        <Animated.View
                            style={[
                                styles.thumb,
                                {
                                    backgroundColor: thumbBackgroundColor,
                                    transform: [{ translateX }],
                                },
                            ]}
                        />
                    </Animated.View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    label: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.regular,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.primary,
        flex: 1,
    },
    switchWrapper: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
        padding: 6,
    },
    track: {
        width: normalize(35),
        height: normalize(22),
        borderRadius: normalize(14),
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    thumb: {
        width: normalize(14),
        height: normalize(14),
        borderRadius: normalize(8),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 5,
    },
});

export default FormSwitch;