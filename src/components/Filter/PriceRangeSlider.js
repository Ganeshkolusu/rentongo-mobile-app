import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 6;
const SLIDER_HEIGHT = 50;

const PriceRangeSlider = ({ onValueChange, initialValue = 0 }) => {
  const minPrice = 0;
  const maxPrice = 20000;

  const [sliderWidth, setSliderWidth] = useState(0);
  const [displayValue, setDisplayValue] = useState(initialValue);

  // Use Animated.Value for smooth position tracking
  const position = useRef(new Animated.Value(0)).current;
  const currentValue = useRef(initialValue);
  const sliderWidthRef = useRef(0);
  const startPosition = useRef(0);

  // Calculate position from value
  const valueToPosition = (value, width) => {
    if (width === 0) return 0;
    const percentage = (value - minPrice) / (maxPrice - minPrice);
    return percentage * width;
  };

  // Calculate value from position
  const positionToValue = (pos, width) => {
    if (width === 0) return minPrice;
    const percentage = Math.max(0, Math.min(1, pos / width));
    return Math.round(minPrice + percentage * (maxPrice - minPrice));
  };

  // Update position when initialValue changes
  useEffect(() => {
    if (sliderWidthRef.current > 0) {
      const newPosition = valueToPosition(initialValue, sliderWidthRef.current);
      position.setValue(newPosition);
      currentValue.current = initialValue;
      setDisplayValue(initialValue);
    }
  }, [initialValue]);

  // Update position when slider width is set
  useEffect(() => {
    if (sliderWidth > 0) {
      sliderWidthRef.current = sliderWidth;
      const newPosition = valueToPosition(initialValue, sliderWidth);
      position.setValue(newPosition);
    }
  }, [sliderWidth]);

  // PanResponder for ultra smooth dragging
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (evt) => {
      if (sliderWidthRef.current === 0) return false;

      const touchX = evt.nativeEvent.locationX;
      const thumbPos = valueToPosition(currentValue.current, sliderWidthRef.current);
      const distance = Math.abs(touchX - thumbPos);

      // Only respond if touch is near thumb
      if (distance < THUMB_SIZE * 2) {
        startPosition.current = thumbPos;
        return true;
      }
      return false;
    },
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      startPosition.current = valueToPosition(currentValue.current, sliderWidthRef.current);
    },
    onPanResponderMove: (evt, gestureState) => {
      const newPos = Math.max(0, Math.min(sliderWidthRef.current, startPosition.current + gestureState.dx));
      position.setValue(newPos);

      const newValue = positionToValue(newPos, sliderWidthRef.current);
      if (newValue !== currentValue.current) {
        currentValue.current = newValue;
        setDisplayValue(newValue);
      }
    },
    onPanResponderRelease: () => {
      onValueChange?.(currentValue.current);
    },
    onPanResponderTerminate: () => {
      onValueChange?.(currentValue.current);
    },
  }), [onValueChange]);

  const handleLayout = (event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && width !== sliderWidth) {
      setSliderWidth(width);
    }
  };

  // Interpolate for track width percentage
  const trackWidth = sliderWidth > 0 ? position.interpolate({
    inputRange: [0, sliderWidth],
    outputRange: [0, sliderWidth],
    extrapolate: 'clamp',
  }) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Range</Text>

      <View style={styles.priceLabels}>
        <Text style={styles.priceText}>₹{displayValue}</Text>
        <Text style={styles.priceText}>₹{maxPrice}</Text>
      </View>

      <View
        style={styles.sliderWrapper}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
        {/* Track Background */}
        <View style={styles.trackContainer}>
          <View style={styles.trackBackground} />
          {sliderWidth > 0 && (
            <Animated.View style={[styles.gradientTrackWrapper, { width: trackWidth }]}>
              <LinearGradient
                colors={['#63C8FF', '#141248']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientTrack}
              />
            </Animated.View>
          )}
        </View>

        {/* Thumb */}
        {sliderWidth > 0 && (
          <Animated.View
            style={[
              styles.thumbContainer,
              {
                transform: [{ translateX: position }],
              },
            ]}
          >
            <View style={styles.thumbWrapper}>
              <LinearGradient
                colors={['#63C8FF', '#141248']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientThumb}
              />
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: normalize(5),
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  priceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  sliderWrapper: {
    height: SLIDER_HEIGHT,
    justifyContent: 'center',
    marginVertical: Spacing.sm,
  },
  trackContainer: {
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  trackBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: TRACK_HEIGHT / 2,
  },
  gradientTrackWrapper: {
    position: 'absolute',
    height: '100%',
    borderRadius: TRACK_HEIGHT / 2,
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  gradientTrack: {
    flex: 1,
  },
  thumbContainer: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    top: (SLIDER_HEIGHT - THUMB_SIZE) / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
  },
});

export default PriceRangeSlider;
