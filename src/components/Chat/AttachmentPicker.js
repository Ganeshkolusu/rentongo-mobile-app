/**
 * AttachmentPicker Component
 * Modal for selecting attachment type in chat
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../../constants/Dimensions';

const ATTACHMENT_OPTIONS = [
  {
    id: 'camera',
    label: 'Camera',
    icon: 'camera',
    color: '#4CAF50',
    description: 'Take a photo',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    icon: 'images',
    color: '#9C27B0',
    description: 'Choose from photos',
  },
];

const AttachmentPicker = ({
  visible,
  onClose,
  onSelectOption,
  animatedValue,
}) => {
  // Use animated value for smooth transitions
  const translateY = animatedValue?.interpolate?.({
    inputRange: [0, 1],
    outputRange: [300, 0],
  }) || new Animated.Value(0);

  const opacity = animatedValue?.interpolate?.({
    inputRange: [0, 1],
    outputRange: [0, 1],
  }) || new Animated.Value(1);

  const handleOptionPress = (optionId) => {
    onSelectOption(optionId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          {Platform.OS === 'ios' && (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          )}

          <Animated.View
            style={[
              styles.container,
              {
                transform: [{ translateY }],
                opacity,
              },
            ]}
          >
            <TouchableWithoutFeedback>
              <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.handleBar} />
                  <Text style={styles.title}>Share</Text>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  {ATTACHMENT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={styles.optionButton}
                      onPress={() => handleOptionPress(option.id)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: option.color + '15' }]}>
                        <Ionicons name={option.icon} size={28} color={option.color} />
                      </View>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  content: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    minWidth: normalize(90),
  },
  iconCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  optionLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelText: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.secondary,
  },
});

export default AttachmentPicker;
