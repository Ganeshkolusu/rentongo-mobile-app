import React from 'react';
import {
  KeyboardAvoidingView,
  FlatList,
  Platform,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

/**
 * KeyboardAwareFlatList - Reusable wrapper for FlatList with keyboard handling
 *
 * Use this for screens with dynamic lists (chat, notifications, etc.)
 */

const KeyboardAwareFlatList = ({
  data,
  renderItem,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  dismissKeyboardOnTap = true,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  keyExtractor,
  inverted = false,
  ...props
}) => {
  const dismissKeyboard = () => {
    if (dismissKeyboardOnTap) {
      Keyboard.dismiss();
    }
  };

  const getKeyboardBehavior = () => {
    return Platform.OS === 'ios' ? 'padding' : 'height';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={getKeyboardBehavior()}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <View style={styles.flatListContainer}>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[
              styles.flatListContent,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={showsVerticalScrollIndicator}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode="on-drag"
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            ListEmptyComponent={ListEmptyComponent}
            inverted={inverted}
            bounces={false}
            overScrollMode="never"
            {...props}
          />
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flatListContainer: {
    flex: 1,
  },
  flatListContent: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
  },
});

export default KeyboardAwareFlatList;
