// src/constants/Typography.js
import { Platform } from 'react-native';
import { normalize, ScreenDimensions } from './Dimensions';

const fontFamily = Platform.select({
    ios: 'System',
    android: 'Roboto'
});

// Responsive font sizes based on device type
const getFontSizes = () => {
    const { isSmallDevice, isTablet } = ScreenDimensions;

    if (isSmallDevice) {
        return {
            xs: normalize(8),
            sm: normalize(10),
            md: normalize(12),
            lg: normalize(14),
            xl: normalize(16),
            xxl: normalize(18),
            xxxl: normalize(20),
            huge: normalize(24),
            title: normalize(26)
        };
    } else if (isTablet) {
        return {
            xs: normalize(12),
            sm: normalize(14),
            md: normalize(16),
            lg: normalize(18),
            xl: normalize(20),
            xxl: normalize(24),
            xxxl: normalize(28),
            huge: normalize(32),
            title: normalize(36)
        };
    } else {
        return {
            xs: normalize(10),
            sm: normalize(12),
            md: normalize(14),
            lg: normalize(16),
            xl: normalize(18),
            xxl: normalize(20),
            xxxl: normalize(24),
            huge: normalize(28),
            title: normalize(32)
        };
    }
};

// Responsive line heights
const getLineHeights = () => {
    const { isSmallDevice, isTablet } = ScreenDimensions;

    if (isSmallDevice) {
        return {
            xs: normalize(12),
            sm: normalize(14),
            md: normalize(16),
            lg: normalize(18),
            xl: normalize(20),
            xxl: normalize(22),
            xxxl: normalize(26),
            huge: normalize(30),
            title: normalize(32)
        };
    } else if (isTablet) {
        return {
            xs: normalize(16),
            sm: normalize(18),
            md: normalize(20),
            lg: normalize(22),
            xl: normalize(26),
            xxl: normalize(30),
            xxxl: normalize(34),
            huge: normalize(38),
            title: normalize(44)
        };
    } else {
        return {
            xs: normalize(14),
            sm: normalize(16),
            md: normalize(18),
            lg: normalize(20),
            xl: normalize(24),
            xxl: normalize(28),
            xxxl: normalize(32),
            huge: normalize(36),
            title: normalize(40)
        };
    }
};

export const Typography = {
    fontFamily: {
        regular: fontFamily,
        medium: Platform.select({
            ios: 'System',
            android: 'Roboto-Medium'
        }),
        bold: Platform.select({
            ios: 'System',
            android: 'Roboto-Bold'
        }),
        light: Platform.select({
            ios: 'System',
            android: 'Roboto-Light'
        })
    },
    fontSize: getFontSizes(),
    lineHeight: getLineHeights(),
    fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semiBold: '600',
        bold: '700',
        fullbold: '900'
    }
};