import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    PanResponder,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';

const { width, height } = Dimensions.get('window');

const BottomDrawer = ({
    visible,
    onClose,
    children,
    title = "",
    height: drawerHeight = height * 0.6,
    showHandle = true,
    showCloseButton = true,
    closeable = true
}) => {
    const slideAnim = useRef(new Animated.Value(drawerHeight)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Show drawer
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            // Hide drawer
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: drawerHeight,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, drawerHeight]);

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
            return Math.abs(gestureState.dy) > 5 && closeable;
        },
        onPanResponderMove: (evt, gestureState) => {
            if (gestureState.dy > 0) {
                slideAnim.setValue(gestureState.dy);
            }
        },
        onPanResponderRelease: (evt, gestureState) => {
            if (gestureState.dy > drawerHeight * 0.3) {
                // Close if dragged down more than 30%
                handleClose();
            } else {
                // Snap back to open position
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        },
    });

    const handleClose = () => {
        if (closeable && onClose) {
            onClose();
        }
    };

    const handleOverlayPress = () => {
        if (closeable) {
            handleClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                {/* Overlay */}
                <TouchableWithoutFeedback onPress={handleOverlayPress}>
                    <Animated.View
                        style={[
                            styles.overlay,
                            {
                                opacity: overlayOpacity,
                            }
                        ]}
                    />
                </TouchableWithoutFeedback>

                {/* Drawer */}
                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            height: drawerHeight,
                            transform: [{ translateY: slideAnim }],
                        }
                    ]}
                    {...(closeable ? panResponder.panHandlers : {})}
                >
                    {/* Handle */}
                    {showHandle && (
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>
                    )}

                    {/* Header */}
                    {(title || showCloseButton) && (
                        <View style={styles.header}>
                            {title ? (
                                <Text style={styles.title}>{title}</Text>
                            ) : (
                                <View />
                            )}
                            {showCloseButton && closeable && (
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={handleClose}
                                >
                                    <Icon name="close" size={24} color="#666" />
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {/* Content */}
                    <View style={styles.content}>
                        {children}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    drawer: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: '100%',
        elevation: 10,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: -5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    handleContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    handle: {
        width: 50,
        height: 7,
        backgroundColor: '#928e8eff',
        borderRadius: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
        flex: 1,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
    },
});

export default BottomDrawer;