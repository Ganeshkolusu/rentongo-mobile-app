import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { BorderRadius, hp, Layout, Spacing } from '../constants/Dimensions';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    // Auto-hide splash after 2 seconds
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#7096e6ff', '#FFFFFF']}
        style={styles.topHalf1}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/Images/Splashlogo.jpg')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </View>
      </LinearGradient>
      <View style={styles.bottomHalf}>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingBottom: Platform.OS === 'android' ? 0 : 0,
  },
  topHalf1: {
    flex: 1.25,
    justifyContent: 'center',
    borderBottomLeftRadius: BorderRadius.small,
    borderBottomRightRadius: BorderRadius.small,
    overflow: 'visible',
  },
  bottomHalf: {
    flex: 0.5,
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingBottom: 0,
    paddingTop: Spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Layout.statusBarHeight + hp(10),
  },
  logoCircle: {
    width: Layout.logoSize,
    height: Layout.logoSize,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    borderRadius: (Layout.logoSize * 1) / 2,
    width: Layout.logoSize * 1,
    height: Layout.logoSize * 1,
  },
});

export default SplashScreen;