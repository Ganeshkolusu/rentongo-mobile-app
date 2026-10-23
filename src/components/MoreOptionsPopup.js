import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback, Image } from 'react-native';
import { Colors } from '../constants/Colors';
import { normalize, wp, hp, Spacing, BorderRadius } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const MoreOptionsPopup = ({
    visible,
    onClose,
    onEdit,
    onDelete,
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
                            <TouchableOpacity style={styles.option} onPress={onEdit}>
                                <Image
                                    source={require('../assets/Icons/edit.png')}
                                    style={styles.iconImage}
                                />
                                <Text style={styles.optionText}>Edit</Text>
                                <Image
                                    source={require('../assets/Icons/rightArrow.png')}
                                    style={styles.arrowIcon}
                                />
                            </TouchableOpacity>

                            <View style={styles.divider} />

                            <TouchableOpacity style={styles.option} onPress={onDelete}>
                                <Image
                                    source={require('../assets/Icons/delete.png')}
                                    style={[styles.iconImage, styles.deleteIcon]}
                                />
                                <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
                            </TouchableOpacity>
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
        minWidth: wp(35),
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: normalize(4) },
        shadowOpacity: 0.15,
        shadowRadius: normalize(8),
        elevation: 8,
        paddingVertical: Spacing.xs,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
    },
    iconImage: {
        width: normalize(18),
        height: normalize(18),
        marginRight: Spacing.sm,
        tintColor: Colors.text.primary,
    },
    deleteIcon: {
        tintColor: Colors.error,
    },
    optionText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.primary,
    },
    deleteText: {
        color: Colors.error,
    },
    arrowIcon: {
        width: normalize(16),
        height: normalize(16),
        tintColor: Colors.text.secondary,
    },
    divider: {
        height: normalize(1),
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.md,
    },
});

export default MoreOptionsPopup;