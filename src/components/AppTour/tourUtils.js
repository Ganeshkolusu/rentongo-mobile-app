// src/components/AppTour/tourUtils.js
// Responsive utilities for App Tour positioning - Cross-platform compatible
import { Platform, StatusBar, PixelRatio, Dimensions } from 'react-native';

// Base dimensions (iPhone X as reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Get current screen dimensions reactively
 */
export const getScreenDimensions = () => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
};

/**
 * Get responsive scaling factors based on current screen dimensions
 */
export const getScaleFactors = (screenWidth, screenHeight) => {
    const scaleX = screenWidth / BASE_WIDTH;
    const scaleY = screenHeight / BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY);

    return {
        scaleX,
        scaleY,
        scale,
        isSmallDevice: screenWidth < 360,
        isMediumDevice: screenWidth >= 360 && screenWidth < 400,
        isLargeDevice: screenWidth >= 400 && screenWidth < 768,
        isTablet: screenWidth >= 768,
    };
};

/**
 * Get device type for conditional logic
 */
export const getDeviceType = (screenWidth) => {
    if (screenWidth >= 768) return 'tablet';
    if (screenWidth >= 400) return 'large';
    if (screenWidth >= 360) return 'medium';
    return 'small';
};

/**
 * Scale a value responsively based on screen width
 */
export const scaleSize = (size, screenWidth) => {
    const scale = screenWidth / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale with moderation (less aggressive scaling for readability)
 */
export const moderateScale = (size, screenWidth, factor = 0.5) => {
    const scale = screenWidth / BASE_WIDTH;
    const newSize = size + (size * scale - size) * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Get width as percentage of screen
 */
export const widthPercent = (percent, screenWidth) => {
    return Math.round(PixelRatio.roundToNearestPixel((percent * screenWidth) / 100));
};

/**
 * Get height as percentage of screen
 */
export const heightPercent = (percent, screenHeight) => {
    return Math.round(PixelRatio.roundToNearestPixel((percent * screenHeight) / 100));
};

/**
 * Get status bar height for current platform
 * Uses safe area insets when available for accuracy
 */
export const getStatusBarHeight = (insets) => {
    if (Platform.OS === 'ios') {
        return insets?.top || 44;
    }
    // Android: StatusBar.currentHeight is the actual status bar height
    return StatusBar.currentHeight || 24;
};

/**
 * Get bottom safe area height
 */
export const getBottomSafeArea = (insets) => {
    return insets?.bottom || (Platform.OS === 'ios' ? 34 : 0);
};

/**
 * Get the Y-axis offset needed for measureInWindow coordinates
 * This accounts for how Modal with statusBarTranslucent affects coordinates
 *
 * On Android with statusBarTranslucent Modal:
 * - measureInWindow returns coordinates from top of screen (including status bar)
 * - Modal content starts from top of screen
 * - No adjustment needed
 *
 * On iOS:
 * - measureInWindow returns coordinates from top of screen
 * - Modal with statusBarTranslucent starts from top of screen
 * - No adjustment needed
 */
export const getMeasurementOffset = (insets) => {
    // With statusBarTranslucent Modal, coordinates are already correct
    // No offset needed as both measurement and modal use same coordinate space
    return 0;
};

/**
 * Calculate tooltip dimensions based on device type
 */
export const getTooltipDimensions = (screenWidth, screenHeight) => {
    const deviceType = getDeviceType(screenWidth);

    const dimensions = {
        small: {
            padding: 12,
            borderRadius: 16,
            arrowSize: 12,
            maxWidth: screenWidth - 24,
            minHeight: 160,
        },
        medium: {
            padding: 16,
            borderRadius: 18,
            arrowSize: 14,
            maxWidth: screenWidth - 32,
            minHeight: 180,
        },
        large: {
            padding: 18,
            borderRadius: 20,
            arrowSize: 14,
            maxWidth: screenWidth - 40,
            minHeight: 200,
        },
        tablet: {
            padding: 24,
            borderRadius: 24,
            arrowSize: 16,
            maxWidth: Math.min(screenWidth - 80, 500),
            minHeight: 220,
        },
    };

    return dimensions[deviceType];
};

/**
 * Calculate gap between spotlight and tooltip based on device
 */
export const getTooltipGap = (screenWidth) => {
    const deviceType = getDeviceType(screenWidth);

    const gaps = {
        small: 8,
        medium: 10,
        large: 12,
        tablet: 16,
    };

    return gaps[deviceType];
};

/**
 * Calculate responsive spotlight padding
 */
export const getSpotlightPadding = (basePadding, screenWidth) => {
    const scale = screenWidth / BASE_WIDTH;
    return Math.round(basePadding * Math.min(scale, 1.5));
};

/**
 * Clamp a value between min and max
 */
export const clamp = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
};

/**
 * Calculate optimal tooltip position (above or below target)
 */
export const calculateTooltipPlacement = ({
    targetLayout,
    screenHeight,
    insets,
    tooltipEstimatedHeight = 200,
    gap = 12,
    preferredPosition = 'auto',
}) => {
    if (!targetLayout) {
        return {
            placement: 'center',
            top: screenHeight / 2 - tooltipEstimatedHeight / 2,
        };
    }

    const statusBarHeight = getStatusBarHeight(insets);
    const bottomSafeArea = getBottomSafeArea(insets);

    const targetTop = targetLayout.y;
    const targetBottom = targetLayout.y + targetLayout.height;

    const spaceAbove = targetTop - statusBarHeight;
    const spaceBelow = screenHeight - targetBottom - bottomSafeArea;

    // Respect preferred position if specified
    if (preferredPosition === 'above' && spaceAbove >= tooltipEstimatedHeight + gap) {
        return {
            placement: 'above',
            bottom: screenHeight - targetTop + gap,
        };
    }

    if (preferredPosition === 'below' && spaceBelow >= tooltipEstimatedHeight + gap) {
        return {
            placement: 'below',
            top: targetBottom + gap,
        };
    }

    // Auto placement: prefer placement with more space
    if (spaceBelow >= tooltipEstimatedHeight + gap * 2) {
        return {
            placement: 'below',
            top: targetBottom + gap,
        };
    } else if (spaceAbove >= tooltipEstimatedHeight + gap * 2) {
        return {
            placement: 'above',
            bottom: screenHeight - targetTop + gap,
        };
    } else {
        // Not enough space, place in center with offset
        return {
            placement: 'center',
            top: screenHeight / 2 - tooltipEstimatedHeight / 2,
        };
    }
};

/**
 * Calculate arrow horizontal position relative to tooltip
 */
export const calculateArrowPosition = ({
    targetLayout,
    tooltipLeft,
    tooltipWidth,
}) => {
    if (!targetLayout) return 50;

    const targetCenterX = targetLayout.x + targetLayout.width / 2;
    const arrowPercent = ((targetCenterX - tooltipLeft) / tooltipWidth) * 100;

    return clamp(arrowPercent, 15, 85);
};

/**
 * Normalize measurement from measureInWindow for use in Modal with statusBarTranslucent
 * This is the key function for cross-platform consistency
 *
 * CRITICAL FIX for Android:
 * - measureInWindow returns Y relative to the visible window content area
 * - But the window content starts BELOW the status bar (even with translucent)
 * - Modal with statusBarTranslucent covers the ENTIRE screen from Y=0
 * - So measureInWindow Y values are offset by status bar height
 * - We need to use the raw Y value as-is because Modal coordinate system matches
 *
 * @param {number} x - X coordinate from measureInWindow
 * @param {number} y - Y coordinate from measureInWindow
 * @param {number} width - Width from measureInWindow
 * @param {number} height - Height from measureInWindow
 * @param {object} insets - Safe area insets (unused but kept for API consistency)
 * @returns {object} Normalized coordinates for Modal positioning
 */
export const normalizeMeasurement = (x, y, width, height, insets) => {
    // measureInWindow returns coordinates relative to the window.
    // On both Android and iOS with statusBarTranslucent Modal,
    // these coordinates should work directly.
    //
    // The coordinates from measureInWindow already account for where
    // the element is on screen, so we use them as-is.

    return {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(0, width),
        height: Math.max(0, height),
    };
};

/**
 * Check if element is visible on screen
 */
export const isElementVisible = (layout, screenWidth, screenHeight) => {
    if (!layout) return false;

    return (
        layout.x >= -10 && // Allow small negative for edge elements
        layout.y >= 0 &&
        layout.x + layout.width <= screenWidth + 10 &&
        layout.y + layout.height <= screenHeight &&
        layout.width > 0 &&
        layout.height > 0
    );
};

/**
 * Get responsive element padding based on element type and device
 */
export const getElementPadding = (elementType, screenWidth) => {
    const deviceType = getDeviceType(screenWidth);

    const paddings = {
        small: {
            icon: 4,
            button: 6,
            card: 8,
            container: 10,
        },
        medium: {
            icon: 6,
            button: 8,
            card: 10,
            container: 12,
        },
        large: {
            icon: 6,
            button: 8,
            card: 10,
            container: 12,
        },
        tablet: {
            icon: 8,
            button: 10,
            card: 14,
            container: 16,
        },
    };

    return paddings[deviceType]?.[elementType] || paddings[deviceType]?.button || 8;
};

/**
 * Debounce function for dimension changes
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Check if dimensions have changed significantly (more than threshold)
 */
export const hasDimensionsChanged = (prev, current, threshold = 10) => {
    if (!prev || !current) return true;
    return (
        Math.abs(prev.width - current.width) > threshold ||
        Math.abs(prev.height - current.height) > threshold
    );
};
