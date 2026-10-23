// src/constants/Dimensions.js
import { Dimensions, PixelRatio } from 'react-native';

const { width, height } = Dimensions.get('window');

// Device type detection
const isSmallDevice = width < 375;
const isMediumDevice = width >= 375 && width < 414;
const isLargeDevice = width >= 414 && width < 768;
const isTablet = width >= 768;
const isLargeTablet = width >= 1024;

// Base dimensions for scaling
const baseWidth = 375; // iPhone X baseline
const baseHeight = 812;

// Scaling functions
const scaleWidth = (size) => (width / baseWidth) * size;
const scaleHeight = (size) => (height / baseHeight) * size;
const scaleFont = (size) => size * PixelRatio.getFontScale();
const moderateScale = (size, factor = 0.5) => size + (scaleWidth(size) - size) * factor;

export const ScreenDimensions = {
    width,
    height,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
    isLargeTablet,
    scale: width / baseWidth,
    fontScale: PixelRatio.getFontScale(),
    pixelRatio: PixelRatio.get()
};

// Responsive scaling utilities
export const wp = (percentage) => {
    const value = (percentage * width) / 100;
    return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const hp = (percentage) => {
    const value = (percentage * height) / 100;
    return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const normalize = (size) => {
    const newSize = moderateScale(size);
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive spacing based on device type
const getSpacing = () => {
    if (isSmallDevice) {
        return {
            xs: 3,
            sm: 6,
            md: 12,
            lg: 18,
            xl: 24,
            xxl: 36,
            xxxl: 42,
            xxxl1: 52,
            xxxxl: 90,
            xxxxxl: 100,
            xl6: 180
        };
    } else if (isTablet) {
        return {
            xs: 6,
            sm: 12,
            md: 24,
            lg: 36,
            xl: 48,
            xxl: 72,
            xxxl: 84,
            xxxl1: 52,
            xxxxl: 180,
            xxxxxl: 200,
            xl6: 320
        };
    } else {
        return {
            xs: 4,
            sm: 8,
            md: 16,
            lg: 24,
            xl: 32,
            xxl: 48,
            xxxl: 52,
            xxxl1: 62,
            xxxxl: 120,
            xxxxxl: 160,
            xl6: 220
        };
    }
};

export const Spacing = getSpacing();

// Responsive border radius
const getBorderRadius = () => {
    const scale = isTablet ? 1.5 : 1;
    return {
        sm: 8 * scale,
        md: 12 * scale,
        lg: 16 * scale,
        xl: 24 * scale,
        xxl: 32 * scale,
        circle: 50 * scale,
        small: normalize(150),
        medium: normalize(700),
        full: 1000
    };
};

export const BorderRadius = getBorderRadius();

// Responsive layout dimensions
export const Layout = {
    logoSize: wp(85),
    logoHeight: hp(30),
    buttonHeight: normalize(56),
    statusBarHeight: normalize(50),
    headerHeight: normalize(60),
    tabBarHeight: normalize(80),
    cardMinHeight: normalize(120),
    inputHeight: normalize(48),
    buttonHeight: normalize(45)
};

// Responsive breakpoints
export const Breakpoints = {
    small: 0,
    medium: 375,
    large: 414,
    tablet: 768,
    largeTablet: 1024
};

export const responsiveValue = (smallValue, mediumValue, largeValue, tabletValue) => {
    if (isTablet && tabletValue !== undefined) return tabletValue;
    if (isLargeDevice && largeValue !== undefined) return largeValue;
    if (isMediumDevice && mediumValue !== undefined) return mediumValue;
    return smallValue;
};