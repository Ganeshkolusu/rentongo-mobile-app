import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { normalize, wp, hp, Spacing, BorderRadius } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const BookingOptionsPopup = ({
    visible,
    onClose,
    options = [],
    position = { top: 0, right: 0 }
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[styles.popup, { top: position.top, right: position.right }]}>
                            {options.map((option, index) => (
                                <View key={option.id || index}>
                                    <TouchableOpacity
                                        style={styles.option}
                                        onPress={() => {
                                            option.onPress();
                                            onClose();
                                        }}
                                    >
                                        <Image
                                            source={option.icon}
                                            style={[
                                                styles.iconImage,
                                                option.isDelete && styles.deleteIcon
                                            ]}
                                        />
                                        <Text style={[
                                            styles.optionText,
                                            option.isDelete && styles.deleteText
                                        ]}>
                                            {option.title}
                                        </Text>
                                        {option.showArrow && (
                                            <Image
                                                source={require('../assets/Icons/rightArrow.png')}
                                                style={styles.arrowIcon}
                                            />
                                        )}
                                    </TouchableOpacity>
                                    {index < options.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    popup: {
        position: 'absolute',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        minWidth: wp(40),
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    iconImage: {
        width: normalize(20),
        height: normalize(20),
        marginRight: Spacing.md,
        tintColor: Colors.text.primary,
    },
    deleteIcon: {
        tintColor: Colors.error,
    },
    optionText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
    },
    deleteText: {
        color: Colors.error,
    },
    arrowIcon: {
        width: normalize(16),
        height: normalize(16),
        tintColor: Colors.black,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.md,
    },
});

export default BookingOptionsPopup;