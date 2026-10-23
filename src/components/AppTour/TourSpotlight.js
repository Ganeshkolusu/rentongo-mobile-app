// src/components/AppTour/TourSpotlight.js
// Reusable spotlight component for individual tour steps
// Each screen renders its own TourSpotlight for its elements
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Modal,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { clamp, getBottomSafeArea, getDeviceType, getStatusBarHeight, normalizeMeasurement } from './tourUtils';

const TourSpotlight = ({
    visible,
    targetRef,
    title,
    description,
    stepNumber,
    totalSteps,
    onNext,
    onPrev,
    onSkip,
    onFinish,
    isFirstStep = false,
    isLastStep = false,
    tooltipPosition = 'auto', // 'above', 'below', 'auto'
    spotlightPadding: customPadding,
    stepId = '', // Step ID for conditional styling
}) => {
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    const [targetLayout, setTargetLayout] = useState(null);
    const [tooltipMeasuredHeight, setTooltipMeasuredHeight] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const measureTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    // Device type for responsive sizing
    const deviceType = useMemo(() => getDeviceType(screenWidth), [screenWidth]);

    // Screen size category
    const screenSizeCategory = useMemo(() => {
        if (screenHeight < 600) return 'verySmall';
        if (screenHeight < 700) return 'small';
        if (screenHeight < 800) return 'medium';
        if (screenHeight < 900) return 'large';
        return 'veryLarge';
    }, [screenHeight]);

    // Responsive scaling
    const scaleW = useCallback((size) => {
        const scale = screenWidth / 375;
        return Math.round(size * Math.min(Math.max(scale, 0.8), 1.5));
    }, [screenWidth]);

    const wp = useCallback((percent) => Math.round((percent * screenWidth) / 100), [screenWidth]);
    const hp = useCallback((percent) => Math.round((percent * screenHeight) / 100), [screenHeight]);

    // Safe area values
    const bottomSafeArea = getBottomSafeArea(insets);
    const statusBarHeight = getStatusBarHeight(insets);
    const androidStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

    // Responsive values
    const tooltipHorizontalMargin = useMemo(() => {
        if (deviceType === 'tablet') return wp(8);
        if (deviceType === 'small') return wp(3);
        return wp(4);
    }, [deviceType, wp]);

    // Different steps need different gaps
    const BOTTOM_NAV_IDS = ['rental', 'listed', 'addListing', 'myBookings', 'account'];
    const CONTENT_IDS = ['vehicleType'];
    const isBottomNavStep = stepId && BOTTOM_NAV_IDS.includes(stepId);
    const isContentStep = stepId && CONTENT_IDS.includes(stepId);

    const tooltipGap = useMemo(() => {
        const gaps = { verySmall: hp(1.5), small: hp(2), medium: hp(2.5), large: hp(3), veryLarge: hp(3.5) };
        const baseGap = Math.max(12, gaps[screenSizeCategory]);
        // Add extra gap for bottom nav to push tooltip well above spotlight
        if (isBottomNavStep) return baseGap + hp(50);
        // Standard gap for vehicleType - tooltip appears above spotlight
        if (isContentStep) return baseGap;
        return baseGap;
    }, [screenSizeCategory, hp, isBottomNavStep, isContentStep]);

    const tooltipEstimatedHeight = useMemo(() => {
        const heights = { verySmall: hp(28), small: hp(26), medium: hp(25), large: hp(24), veryLarge: hp(22) };
        return Math.min(280, Math.max(180, heights[screenSizeCategory]));
    }, [screenSizeCategory, hp]);

    const tooltipHeight = tooltipMeasuredHeight > 0 ? tooltipMeasuredHeight : tooltipEstimatedHeight;

    const fontSizes = useMemo(() => ({
        title: scaleW(deviceType === 'tablet' ? 22 : screenSizeCategory === 'verySmall' ? 16 : 18),
        description: scaleW(deviceType === 'tablet' ? 15 : screenSizeCategory === 'verySmall' ? 12 : 13),
        counter: scaleW(deviceType === 'tablet' ? 13 : screenSizeCategory === 'verySmall' ? 10 : 11),
        button: scaleW(deviceType === 'tablet' ? 15 : screenSizeCategory === 'verySmall' ? 12 : 13),
    }), [deviceType, screenSizeCategory, scaleW]);

    const spacing = useMemo(() => ({
        xs: scaleW(3), sm: scaleW(6), md: scaleW(12), lg: scaleW(18), xl: scaleW(24),
    }), [scaleW]);

    const spotlightPadding = customPadding || useMemo(() => {
        if (deviceType === 'tablet') return scaleW(10);
        if (screenSizeCategory === 'verySmall') return scaleW(4);
        return scaleW(6);
    }, [deviceType, screenSizeCategory, scaleW]);

    const borderRadius = useMemo(() => ({
        spotlight: scaleW(10),
        tooltip: scaleW(deviceType === 'tablet' ? 20 : 16),
        button: scaleW(18),
    }), [deviceType, scaleW]);

    const arrowSize = useMemo(() => {
        return scaleW(deviceType === 'tablet' ? 14 : screenSizeCategory === 'verySmall' ? 10 : 12);
    }, [deviceType, screenSizeCategory, scaleW]);

    // Measure target element
    const measureTarget = useCallback(() => {
        if (!targetRef?.current) return;

        if (measureTimeoutRef.current) {
            clearTimeout(measureTimeoutRef.current);
        }

        targetRef.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
                const normalized = normalizeMeasurement(x, y, width, height, insets);
                setTargetLayout(normalized);
                retryCountRef.current = 0;
            } else if (retryCountRef.current < 3) {
                retryCountRef.current += 1;
                measureTimeoutRef.current = setTimeout(measureTarget, 100);
            }
        });
    }, [targetRef, insets]);

    // Effects
    useEffect(() => {
        return () => {
            if (measureTimeoutRef.current) clearTimeout(measureTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (visible) {
            retryCountRef.current = 0;
            setTargetLayout(null);
            const timer = setTimeout(measureTarget, 50);
            return () => clearTimeout(timer);
        }
    }, [visible, measureTarget]);

    useEffect(() => {
        if (visible && targetLayout) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible, targetLayout, fadeAnim, scaleAnim]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(measureTarget, 100);
            return () => clearTimeout(timer);
        }
    }, [visible, screenWidth, screenHeight, measureTarget]);

    const onTooltipLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) setTooltipMeasuredHeight(height);
    }, []);

    // Early return
    if (!visible || !targetLayout) return null;

    // Coordinate adjustment for Android
    const getAdjustedY = (y) => Platform.OS === 'android' ? y - androidStatusBarHeight : y;

    // Spotlight vertical offset - for different step categories
    const TOP_NAV_STEPS = ['location', 'notification', 'search', 'filter'];
    const CONTENT_STEPS = ['vehicleType'];
    const BOTTOM_NAV_STEPS = ['rental', 'listed', 'addListing', 'myBookings', 'account'];

    const getSpotlightYOffset = () => {
        if (stepId && TOP_NAV_STEPS.includes(stepId)) {
            return 80; // Fixed 70px down for top nav
        }
        if (stepId && CONTENT_STEPS.includes(stepId)) {
            return 0; // No offset - use actual measured position
        }
        if (stepId && BOTTOM_NAV_STEPS.includes(stepId)) {
            return 70; // Fixed 70px down for bottom nav tabs
        }
        return 0;
    };
    const spotlightYOffset = getSpotlightYOffset();

    // Spotlight calculation
    const spotlight = {
        left: Math.max(0, targetLayout.x - spotlightPadding),
        top: Math.max(0, getAdjustedY(targetLayout.y) - spotlightPadding + spotlightYOffset),
        width: targetLayout.width + spotlightPadding * 2,
        height: targetLayout.height + spotlightPadding * 2,
    };

    // Overlay regions
    const safeSpotlight = {
        left: Math.max(0, spotlight.left),
        top: Math.max(0, spotlight.top),
        width: Math.min(spotlight.width, screenWidth - Math.max(0, spotlight.left)),
        height: Math.min(spotlight.height, screenHeight - Math.max(0, spotlight.top)),
    };

    const overlayRegions = {
        top: { top: 0, left: 0, right: 0, height: Math.max(0, safeSpotlight.top) },
        left: { top: safeSpotlight.top, left: 0, width: Math.max(0, safeSpotlight.left), height: safeSpotlight.height },
        right: { top: safeSpotlight.top, left: safeSpotlight.left + safeSpotlight.width, right: 0, height: safeSpotlight.height },
        bottom: { top: safeSpotlight.top + safeSpotlight.height, left: 0, right: 0, height: Math.max(0, screenHeight - (safeSpotlight.top + safeSpotlight.height)) },
    };

    // Tooltip position calculation
    const tooltipWidth = screenWidth - tooltipHorizontalMargin * 2;

    const getTooltipPositionCalc = () => {
        const spotlightBottom = spotlight.top + spotlight.height;
        const spotlightTop = spotlight.top;
        const arrowHeight = arrowSize + 4;

        const targetCenterX = targetLayout.x + targetLayout.width / 2;
        const arrowLeftPercent = clamp(((targetCenterX - tooltipHorizontalMargin) / tooltipWidth) * 100, 15, 85);

        const spaceAbove = spotlightTop - statusBarHeight - hp(2);
        const spaceBelow = screenHeight - spotlightBottom - bottomSafeArea - hp(2);
        const minSpaceNeeded = tooltipHeight + tooltipGap + arrowHeight;

        let placement;
        // Force 'above' for vehicleType step
        if (stepId === 'vehicleType') {
            placement = 'above';
        } else if (tooltipPosition === 'above') {
            placement = spaceAbove >= minSpaceNeeded ? 'above' : 'below';
        } else if (tooltipPosition === 'below') {
            placement = spaceBelow >= minSpaceNeeded ? 'below' : 'above';
        } else {
            placement = spaceBelow >= spaceAbove ? 'below' : 'above';
        }

        if (placement === 'below') {
            const topPosition = spotlightBottom + tooltipGap + arrowHeight;
            const maxTop = screenHeight - tooltipHeight - bottomSafeArea - hp(2);
            return { top: Math.min(topPosition, maxTop), arrowPosition: 'top', arrowLeft: arrowLeftPercent };
        } else {
            const bottomPosition = screenHeight - spotlightTop + tooltipGap + arrowHeight;
            const maxBottom = screenHeight - statusBarHeight - hp(2);
            return { bottom: Math.min(bottomPosition, maxBottom), arrowPosition: 'bottom', arrowLeft: arrowLeftPercent };
        }
    };

    const tooltipPos = getTooltipPositionCalc();

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onSkip}>
            <View style={styles.overlay}>
                {/* Dark overlay */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                    <View style={[styles.darkOverlay, overlayRegions.top]} />
                    <View style={[styles.darkOverlay, overlayRegions.left]} />
                    <View style={[styles.darkOverlay, overlayRegions.right]} />
                    <View style={[styles.darkOverlay, overlayRegions.bottom]} />
                </Animated.View>

                {/* Spotlight border */}
                <Animated.View
                    style={[
                        styles.spotlightBorder,
                        {
                            left: spotlight.left,
                            top: spotlight.top,
                            width: spotlight.width,
                            height: spotlight.height,
                            borderRadius: borderRadius.spotlight,
                            borderWidth: scaleW(2.5),
                            opacity: fadeAnim,
                        },
                    ]}
                />

                {/* Tooltip */}
                <Animated.View
                    style={[
                        styles.tooltipWrapper,
                        { left: tooltipHorizontalMargin, right: tooltipHorizontalMargin, maxHeight: hp(45) },
                        tooltipPos.top !== undefined && { top: tooltipPos.top },
                        tooltipPos.bottom !== undefined && { bottom: tooltipPos.bottom },
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                    onLayout={onTooltipLayout}
                >
                    {/* Arrow up */}
                    {tooltipPos.arrowPosition === 'top' && (
                        <View style={[styles.arrowContainer, { left: `${tooltipPos.arrowLeft}%` }]}>
                            <View style={[styles.arrowUp, { borderLeftWidth: arrowSize, borderRightWidth: arrowSize, borderBottomWidth: arrowSize + 2, marginTop: -arrowSize }]} />
                        </View>
                    )}

                    <View style={[styles.tooltipContainer, { borderRadius: borderRadius.tooltip, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
                        <Text style={[styles.tooltipTitle, { fontSize: fontSizes.title, marginBottom: spacing.xs }]} numberOfLines={1} adjustsFontSizeToFit>
                            {title}
                        </Text>

                        <Text style={[styles.tooltipDescription, { fontSize: fontSizes.description, lineHeight: fontSizes.description * 1.4, marginBottom: spacing.sm, paddingHorizontal: spacing.sm }]} numberOfLines={3}>
                            {description}
                        </Text>

                        <Text style={[styles.stepCounter, { fontSize: fontSizes.counter, marginBottom: spacing.md }]}>
                            {stepNumber} of {totalSteps}
                        </Text>

                        <View style={[styles.buttonContainer, { paddingHorizontal: spacing.xs }]}>
                            <TouchableOpacity style={[styles.skipButton, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]} onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Text style={[styles.skipButtonText, { fontSize: fontSizes.button }]}>Skip</Text>
                            </TouchableOpacity>

                            <View style={styles.navButtons}>
                                {!isFirstStep && (
                                    <TouchableOpacity style={[styles.prevButton, { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.button, marginRight: spacing.sm }]} onPress={onPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                        <Text style={[styles.prevButtonText, { fontSize: fontSizes.button }]}>Prev</Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity style={[styles.nextButton, { paddingVertical: spacing.sm, paddingHorizontal: spacing.xl, borderRadius: borderRadius.button }]} onPress={isLastStep ? onFinish : onNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Text style={[styles.nextButtonText, { fontSize: fontSizes.button }]}>{isLastStep ? 'Done' : 'Next'}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Arrow down */}
                    {tooltipPos.arrowPosition === 'bottom' && (
                        <View style={[styles.arrowContainerBottom, { left: `${tooltipPos.arrowLeft}%` }]}>
                            <View style={[styles.arrowDown, { borderLeftWidth: arrowSize, borderRightWidth: arrowSize, borderTopWidth: arrowSize + 2, marginBottom: -arrowSize }]} />
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1 },
    darkOverlay: { position: 'absolute', backgroundColor: 'rgba(0, 0, 0, 0.75)' },
    spotlightBorder: { position: 'absolute', borderColor: '#4DA6FF', backgroundColor: 'transparent', zIndex: 10 },
    tooltipWrapper: { position: 'absolute', zIndex: 99 },
    arrowContainer: { position: 'absolute', top: 0, marginLeft: -14, zIndex: 101 },
    arrowContainerBottom: { position: 'absolute', bottom: 0, marginLeft: -14, zIndex: 101 },
    arrowUp: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: Colors.white },
    arrowDown: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: Colors.white },
    tooltipContainer: { backgroundColor: Colors.white, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 15, alignItems: 'center' },
    tooltipTitle: { fontWeight: Typography?.fontWeight?.bold || '700', color: Colors.dark, textAlign: 'center' },
    tooltipDescription: { color: Colors.gray, textAlign: 'center' },
    stepCounter: { color: Colors.gray },
    buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    skipButton: {},
    skipButtonText: { color: Colors.gray, fontWeight: Typography?.fontWeight?.medium || '500' },
    navButtons: { flexDirection: 'row', alignItems: 'center' },
    prevButton: { borderWidth: 1, borderColor: Colors.border || '#E0E0E0' },
    prevButtonText: { color: Colors.dark, fontWeight: Typography?.fontWeight?.medium || '500' },
    nextButton: { backgroundColor: Colors.dotActive || '#4DA6FF' },
    nextButtonText: { color: Colors.white, fontWeight: Typography?.fontWeight?.semiBold || '600' },
});

export default TourSpotlight;
