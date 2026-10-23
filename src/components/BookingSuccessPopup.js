import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';
import Button from './Button/Button';

const { width: screenWidth } = Dimensions.get('window');


const BookingSuccessPopup = ({
    visible,
    onClose,
    title = "Your booking is confirmed with the owner",
    message = "Please meet at the pickup point and complete the process offline.",
    showDocuments = true,
    documents = [
        'Driving License',
        'Aadhar Card',
        'Deposit money :- 10,000'
    ]
}) => {

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                {/* Success Popup */}
                <View style={styles.popupContainer}>
                    {/* Success Icon */}
                    <LinearGradient
                        colors={['#141248', '#63C8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.successIcon}
                    >
                        <Ionicons name="checkmark" size={40} color={Colors.white} />
                    </LinearGradient>
                    
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>
                        {message}
                    </Text>
                    
                    <Button
                        title="Okay"
                        onPress={onClose}
                        variant="filled"
                        style={styles.okayButton}
                    />
                </View>

                {/* Required Documents - Only show if showDocuments is true */}
                {showDocuments && (
                    <View style={styles.documentsContainer}>
                        <Text style={styles.documentsTitle}>Required Documents</Text>

                        {documents.map((document, index) => (
                            <View key={index} style={styles.documentItem}>
                                <View style={styles.bullet} />
                                <Text style={styles.documentText}>{document}</Text>
                            </View>
                        ))}

                        <View style={styles.warningContainer}>
                            <Ionicons name="warning" size={20} color="#FFA500" />
                            <Text style={styles.warningText}>
                                Don't forgot to carry these documents.
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(223, 218, 218, 0.8)',
        paddingHorizontal: 20,
    },
    popupContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        width: screenWidth - 40,
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
    successIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        textAlign: 'center',
        marginBottom: 12,
    },
    message: {
        fontSize: 12,
        color: Colors.text.secondary,
        lineHeight: 20,
        marginBottom: 24,
        textAlign: 'center',
        width: '70%'
    },
    okayButton: {
        width: '100%',
    },
    documentsContainer: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 20,
        width: screenWidth - 40,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    documentsTitle: {
        fontSize: 14,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 16,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.text.primary,
        marginRight: 12,
    },
    documentText: {
        fontSize: 12,
        color: Colors.text.primary,
        flex: 1,
    },
    warningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    warningText: {
        fontSize: 10,
        color: '#FFA500',
        marginLeft: 8,
        flex: 1,
    },
});

export default BookingSuccessPopup;