import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, Stop, LinearGradient as SvgGradient } from 'react-native-svg';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CircularTimer = ({ timeLeft, totalTime = 120 }) => {
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(1);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * progress.value,
  }));

  React.useEffect(() => {
    // Progress goes from 0 to 1 as time runs out
    progress.value = withTiming(1 - (timeLeft / totalTime), { duration: 500 });
  }, [timeLeft, totalTime]);

  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Defs>
        <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={Colors.gradient.primary[0]} />
          <Stop offset="100%" stopColor={Colors.gradient.primary[1]} />
        </SvgGradient>
      </Defs>

      {/* Background Circle */}
      <Circle
        cx="60"
        cy="60"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth={strokeWidth}
        fill="none"
      />

      {/* Progress Circle - rotated to start from top and go clockwise */}
      <AnimatedCircle
        cx="60"
        cy="60"
        r={radius}
        stroke="url(#grad)"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
        fill="none"
        rotation={-90}
        origin="60, 60"
      />

      {/* Center clock icon */}
      <SvgGradient id="clockGrad" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0%" stopColor="#1A2980" />
        <Stop offset="100%" stopColor="#26D0CE" />
      </SvgGradient>
      <View style={{ position: 'absolute', top: 35, left: 35 }}>
        <Image
          source={require('../assets/Icons/clock1.png')}
          style={{ width: 50, height: 50, resizeMode: 'contain' }}
        />
      </View>
    </Svg>
  );
};

const WaitingPopup = ({ timer, onCancel, totalTime = 120 }) => {
  // No sounds in WaitingPopup - purely visual component
  // Parent component handles all sound logic

  return (
    <>
      {/* Top Blur */}
      <BlurView intensity={60} tint="dark" style={styles.topBlur} />

      {/* Bottom Popup */}
      <View style={styles.waitingBox}>
        <Text style={styles.waitingTitle}>Waiting for response!</Text>

        <View style={styles.greyLine} />

        {/* Gradient bar segments */}
        <View style={styles.dashedLine}>
          <View style={styles.dashMask}>
            {[...Array(4)].map((_, i) => (
              <LinearGradient
                key={i}
                colors={Colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.barSegment}
              />
            ))}
          </View>
        </View>

        {/* Circular Timer */}
        <View style={styles.circleWrapper}>
          <CircularTimer timeLeft={timer} totalTime={totalTime} />
        </View>

        <Text style={styles.timerBelowText}>{timer} sec</Text>

        {/* Cancel Button */}
        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel Booking</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default WaitingPopup;

const styles = StyleSheet.create({
  topBlur: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    height: '75%',
    zIndex: 2,
    overflow: 'hidden',
  },
  waitingBox: {
    backgroundColor: Colors.white,
    width: Dimensions.get('window').width,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  waitingTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 5,
  },
  dashedLine: {
    width: '90%',
    height: 5,
    marginBottom: 30,
    position: 'relative',
    borderColor: Colors.gradient.primary,
  },
  dashMask: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 35,
  },
  barSegment: {
    flex: 1,
    height: 6,
    borderRadius: 10,
    marginHorizontal: 3,
    backgroundColor: '#B0B0B0',
  },
  circleWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  timerBelowText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: 5,
  },
  greyLine: {
    width: Dimensions.get('window').width,
    height: 1,
    backgroundColor: Colors.text.light,
    marginVertical: 20,
    marginTop: 0,
  },
  cancelButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: normalize(12),
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.error || '#E53935',
    backgroundColor: Colors.white,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.error || '#E53935',
    textAlign: 'center',
  },
});