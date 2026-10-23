import React, { useRef } from 'react';
import { TextInput, Platform, findNodeHandle } from 'react-native';

/**
 * AutoScrollInput - TextInput that auto-scrolls to itself when focused
 *
 * Use this instead of regular TextInput for automatic scroll behavior
 */

const AutoScrollInput = React.forwardRef(({ onFocus, ...props }, ref) => {
  const inputRef = useRef(null);

  const handleFocus = (event) => {
    // Small delay to ensure keyboard is up
    setTimeout(() => {
      if (inputRef.current) {
        // Measure the input position
        inputRef.current.measureInWindow((x, y, width, height) => {
          // Get parent ScrollView if exists
          const scrollView = findScrollView(inputRef.current);
          if (scrollView) {
            // Calculate scroll position
            const scrollY = y - (Platform.OS === 'ios' ? 100 : 150);
            scrollView.scrollTo({ y: Math.max(0, scrollY), animated: true });
          }
        });
      }
    }, 100);

    // Call original onFocus if provided
    if (onFocus) {
      onFocus(event);
    }
  };

  /**
   * Find parent ScrollView (helper function)
   */
  const findScrollView = (node) => {
    try {
      let currentNode = node;
      while (currentNode && currentNode._nativeTag) {
        if (currentNode.constructor.name === 'ScrollView') {
          return currentNode;
        }
        currentNode = currentNode._internalFiberInstanceHandleDEV?.return?.stateNode;
      }
    } catch (e) {
      // Silently fail
    }
    return null;
  };

  return (
    <TextInput
      ref={(input) => {
        inputRef.current = input;
        if (typeof ref === 'function') {
          ref(input);
        } else if (ref) {
          ref.current = input;
        }
      }}
      onFocus={handleFocus}
      {...props}
    />
  );
});

AutoScrollInput.displayName = 'AutoScrollInput';

export default AutoScrollInput;
