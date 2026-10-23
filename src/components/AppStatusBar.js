import React from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { Colors } from '../constants/Colors';

/**
 * AppStatusBar - A reusable StatusBar component that handles platform differences
 *
 * @param {string} barStyle - 'light-content' for dark backgrounds, 'dark-content' for light backgrounds
 * @param {string} backgroundColor - The background color of the status bar (Android only)
 * @param {boolean} translucent - Whether the app can draw under the status bar (Android only)
 */
const AppStatusBar = ({
    barStyle = 'dark-content',
    backgroundColor = Colors.white,
    translucent = true
}) => {
    return (
        <StatusBar
            barStyle={barStyle}
            backgroundColor={translucent ? 'transparent' : backgroundColor}
            translucent={translucent}
            animated={true}
        />
    );
};

// Pre-configured variants for common use cases
export const LightStatusBar = () => (
    <AppStatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
    />
);

export const DarkStatusBar = () => (
    <AppStatusBar
        barStyle="dark-content"
        backgroundColor={Colors.white}
        translucent={true}
    />
);

export const GradientStatusBar = () => (
    <AppStatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
    />
);

export default AppStatusBar;
