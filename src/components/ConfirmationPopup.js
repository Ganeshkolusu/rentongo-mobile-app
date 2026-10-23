import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';
import Button from './Button/Button';

const { width: screenWidth } = Dimensions.get('window');

const ConfirmationPopup = ({
    visible,
    onClose,
    onConfirm,
    onCancel,
    title = "Confirmation",
    message = "Are you sure you want to continue?",
    confirmText = "Yes",
    cancelText = "No",
    confirmIcon = <Ionicons name="checkmark" size={20} color={Colors.white} />,
    cancelIcon = <Ionicons name="close" size={20} color="#007BFF" />,
    confirmButtonVariant = "filled",
    cancelButtonVariant = "outline"
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.popupContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        <Button
                            title={confirmText}
                            onPress={onConfirm}
                            variant={confirmButtonVariant}
                            style={styles.confirmButton}
                            icon={confirmIcon}
                        />

                        <Button
                            title={cancelText}
                            onPress={onCancel}
                            variant={cancelButtonVariant}
                            style={styles.cancelButton}
                            icon={cancelIcon}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(193, 186, 186, 0.8)',
    },
    popupContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        marginHorizontal: 10,
        width: screenWidth - 40,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        textAlign: 'left',
        marginBottom: 8,
    },
    message: {
        fontSize: 12,
        color: Colors.black,
        lineHeight: 20,
        marginBottom: 20,
        textAlign: 'left',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    confirmButton: {
        flex: 1,
    },
    cancelButton: {
        flex: 1,
    },
});

export default ConfirmationPopup;