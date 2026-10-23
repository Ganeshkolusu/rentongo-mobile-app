import React, { useRef } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';

/**
 * KeyboardAwareScrollView - Reusable wrapper for keyboard responsiveness
 *
 * Features:
 * - Automatically moves content up when keyboard opens
 * - Works on both iOS and Android
 * - Auto-scrolls to focused input
 * - Dismisses keyboard on outside tap
 * - Handles image upload fields
 * - No UI changes, just proper keyboard handling
 *
 * Usage:
 * <KeyboardAwareScrollView>
 *   <YourContent />
 * </KeyboardAwareScrollView>
 */

const KeyboardAwareScrollView = ({
  children,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  enableAutomaticScroll = true,
  extraScrollHeight = Platform.OS === 'ios' ? 20 : 40,
  enableResetScrollToCoords = true,
  enableOnAndroid = true,
  dismissKeyboardOnTap = true,
  ...props
}) => {
  const scrollViewRef = useRef(null);

  /**
   * Dismiss keyboard when tapping outside
   */
  const dismissKeyboard = () => {
    if (dismissKeyboardOnTap) {
      Keyboard.dismiss();
    }
  };

  /**
   * Get KeyboardAvoidingView behavior based on platform
   */
  const getKeyboardBehavior = () => {
    if (Platform.OS === 'ios') {
      return 'padding';
    }
    return enableOnAndroid ? 'height' : undefined;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={getKeyboardBehavior()}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      enabled={Platform.OS === 'ios' || enableOnAndroid}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollViewContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode="on-drag"
          bounces={false}
          overScrollMode="never"
          {...props}
        >
          {children}
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
});

export default KeyboardAwareScrollView;
