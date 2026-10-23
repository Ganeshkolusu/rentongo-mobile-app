import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';

const PhotoUpload = ({ onPress, style }) => {
    return (
        <TouchableOpacity style={[styles.container, style]} onPress={onPress}>
            <View style={styles.uploadArea}>
                <View style={styles.uploadIconContainer}>
                    <View style={styles.uploadIconSquare}>
                        <Image
                            source={require('../assets/Icons/imageUpload.png')}
                            style={styles.uploadArrow}
                        />
                    </View>
                </View>
                <Text style={styles.uploadText}>Add photos</Text>
            </View>
            <Text style={styles.description}>
                Photos: 0/4. Select a main image and add supporting pictures to highlight your car.
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.xl,
    },
    uploadArea: {
        borderWidth: 2,
        borderColor: Colors.border,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        minHeight: 120,
        marginBottom: Spacing.sm,
    },
    uploadIconContainer: {
        marginBottom: Spacing.sm,
    },
    uploadIconSquare: {
        width: 32,
        height: 32,
        borderWidth: 1.5,
        borderColor: Colors.text.primary,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.white,
    },
    uploadArrow: {
        width: 20,
        height: 20,
        tintColor: Colors.black,
    },
    uploadText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.black,
        fontFamily: Typography.fontFamily.medium,
    },
    description: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.regular,
    },
});

export default PhotoUpload;