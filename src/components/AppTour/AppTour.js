// src/components/AppTour/AppTour.js
// Production-ready, fully responsive App Tour component
// Positions adapt to ALL screen sizes: small phones, large phones, tablets
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
import {
    clamp,
    getBottomSafeArea,
    getDeviceType,
    getStatusBarHeight,
    normalizeMeasurement,
} from './tourUtils';

const AppTour = ({
    visible,
    steps,
    currentStep,
    onNext,
    onPrev,
    onSkip,
    onFinish,
    targetRefs,
}) => {
    // ============================================
    // RESPONSIVE DIMENSIONS - Core of responsiveness
    // ============================================
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Device classification for responsive breakpoints
    const deviceType = useMemo(() => getDeviceType(screenWidth), [screenWidth]);

    // Screen size category for height-based adjustments
    const screenSizeCategory = useMemo(() => {
        if (screenHeight < 600) return 'verySmall';  // Very small phones
        if (screenHeight < 700) return 'small';       // Small phones
        if (screenHeight < 800) return 'medium';      // Medium phones
        if (screenHeight < 900) return 'large';       // Large phones
        return 'veryLarge';                           // Tablets/Large devices
    }, [screenHeight]);

    // ============================================
    // RESPONSIVE SCALING FUNCTIONS
    // ============================================

    // Scale based on screen width (horizontal elements)
    const scaleW = useCallback((size) => {
        const scale = screenWidth / 375; // Base: iPhone X width
        return Math.round(size * Math.min(Math.max(scale, 0.8), 1.5));
    }, [screenWidth]);

    // Percentage of screen width
    const wp = useCallback((percent) => {
        return Math.round((percent * screenWidth) / 100);
    }, [screenWidth]);

    // Percentage of screen height
    const hp = useCallback((percent) => {
        return Math.round((percent * screenHeight) / 100);
    }, [screenHeight]);

    // ============================================
    // STATE & REFS
    // ============================================
    const [targetLayout, setTargetLayout] = useState(null);
    const [tooltipMeasuredHeight, setTooltipMeasuredHeight] = useState(0);
    const [measureRetryCount, setMeasureRetryCount] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const measureTimeoutRef = useRef(null);

    // ============================================
    // RESPONSIVE VALUES - All based on screen size
    // ============================================

    // Safe area values
    const bottomSafeArea = getBottomSafeArea(insets);
    const statusBarHeight = getStatusBarHeight(insets);
    const androidStatusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

    // Tooltip horizontal margin - percentage based
    const tooltipHorizontalMargin = useMemo(() => {
        if (deviceType === 'tablet') return wp(8);
        if (deviceType === 'small') return wp(3);
        return wp(4);
    }, [deviceType, wp]);

    // Derived values - MUST be defined before tooltipGap uses step
    const step = steps?.[currentStep];
    const isLastStep = currentStep === (steps?.length || 0) - 1;
    const isFirstStep = currentStep === 0;

    // Tooltip gap from spotlight - height responsive
    // Different steps need different gaps
    const BOTTOM_NAV_IDS = ['rental', 'listed', 'addListing', 'myBookings', 'account'];
    const CONTENT_IDS = ['vehicleType'];
    const isBottomNavStep = step?.id && BOTTOM_NAV_IDS.includes(step.id);
    const isContentStep = step?.id && CONTENT_IDS.includes(step.id);

    const tooltipGap = useMemo(() => {
        // Platform-specific base gap - Android needs more gap
        const platformMultiplier = Platform.OS === 'android' ? 4 : 1;
        const gaps = {
            verySmall: hp(0.3) * platformMultiplier,
            small: hp(0.5) * platformMultiplier,
            medium: hp(0.6) * platformMultiplier,
            large: hp(0.8) * platformMultiplier,
            veryLarge: hp(1) * platformMultiplier,
        };
        const baseGap = Math.max(4, gaps[screenSizeCategory]);
        // Add extra gap for bottom nav to push tooltip well above spotlight
        if (isBottomNavStep) return baseGap + hp(1) * platformMultiplier;
        // Add extra gap for vehicleType to push tooltip up
        if (isContentStep) return baseGap + hp(1) * platformMultiplier;
        return baseGap;
    }, [screenSizeCategory, hp, isBottomNavStep, isContentStep]);

    // Tooltip estimated height based on screen
    const tooltipEstimatedHeight = useMemo(() => {
        const heights = {
            verySmall: hp(28),
            small: hp(26),
            medium: hp(25),
            large: hp(24),
            veryLarge: hp(22),
        };
        return Math.min(280, Math.max(180, heights[screenSizeCategory]));
    }, [screenSizeCategory, hp]);

    // Use measured height if available, otherwise estimated
    const tooltipHeight = tooltipMeasuredHeight > 0 ? tooltipMeasuredHeight : tooltipEstimatedHeight;

    // Responsive font sizes
    const fontSizes = useMemo(() => ({
        title: scaleW(deviceType === 'tablet' ? 22 : screenSizeCategory === 'verySmall' ? 16 : 18),
        description: scaleW(deviceType === 'tablet' ? 15 : screenSizeCategory === 'verySmall' ? 12 : 13),
        counter: scaleW(deviceType === 'tablet' ? 13 : screenSizeCategory === 'verySmall' ? 10 : 11),
        button: scaleW(deviceType === 'tablet' ? 15 : screenSizeCategory === 'verySmall' ? 12 : 13),
    }), [deviceType, screenSizeCategory, scaleW]);

    // Responsive spacing
    const spacing = useMemo(() => ({
        xs: scaleW(3),
        sm: scaleW(6),
        md: scaleW(12),
        lg: scaleW(18),
        xl: scaleW(24),
    }), [scaleW]);

    // Spotlight padding - responsive
    const spotlightPadding = useMemo(() => {
        // Larger padding for bottom nav tabs to fill the full box
        if (isBottomNavStep) {
            if (deviceType === 'tablet') return scaleW(48);
            if (screenSizeCategory === 'verySmall') return scaleW(38);
            return scaleW(44);
        }
        if (deviceType === 'tablet') return scaleW(16);
        if (screenSizeCategory === 'verySmall') return scaleW(10);
        return scaleW(12);
    }, [deviceType, screenSizeCategory, scaleW, isBottomNavStep]);

    // Border radius - responsive
    const borderRadius = useMemo(() => ({
        spotlight: scaleW(10),
        tooltip: scaleW(deviceType === 'tablet' ? 20 : 16),
        button: scaleW(18),
    }), [deviceType, scaleW]);

    // Arrow size - responsive
    const arrowSize = useMemo(() => {
        return scaleW(deviceType === 'tablet' ? 14 : screenSizeCategory === 'verySmall' ? 10 : 12);
    }, [deviceType, screenSizeCategory, scaleW]);

    // ============================================
    // MEASUREMENT LOGIC
    // ============================================

    const measureTarget = useCallback(() => {
        if (!step) return;

        if (measureTimeoutRef.current) {
            clearTimeout(measureTimeoutRef.current);
        }

        const ref = targetRefs?.[step.target];

        if (ref?.current) {
            try {
                ref.current.measureInWindow((x, y, width, height) => {
                    try {
                        if (width > 0 && height > 0) {
                            const normalized = normalizeMeasurement(x, y, width, height, insets);
                            setTargetLayout({
                                ...normalized,
                                padding: step.padding || spotlightPadding,
                            });
                            setMeasureRetryCount(0);
                        } else if (measureRetryCount < 3) {
                            measureTimeoutRef.current = setTimeout(() => {
                                setMeasureRetryCount(prev => prev + 1);
                            }, 100);
                        } else if (step.getFallbackPosition) {
                            const fallback = step.getFallbackPosition();
                            setTargetLayout({
                                ...fallback,
                                padding: step.padding || spotlightPadding,
                            });
                        }
                    } catch (callbackError) {
                        // Silently handle callback errors (e.g., during permission dialogs)
                        if (step.getFallbackPosition) {
                            const fallback = step.getFallbackPosition();
                            setTargetLayout({
                                ...fallback,
                                padding: step.padding || spotlightPadding,
                            });
                        }
                    }
                });
            } catch (measureError) {
                // Silently handle measure errors (e.g., ref no longer valid)
                if (step.getFallbackPosition) {
                    const fallback = step.getFallbackPosition();
                    setTargetLayout({
                        ...fallback,
                        padding: step.padding || spotlightPadding,
                    });
                }
            }
        } else if (step.getFallbackPosition) {
            const fallback = step.getFallbackPosition();
            setTargetLayout({
                ...fallback,
                padding: step.padding || spotlightPadding,
            });
        }
    }, [step, targetRefs, insets, spotlightPadding, measureRetryCount]);

    // ============================================
    // EFFECTS
    // ============================================

    useEffect(() => {
        return () => {
            if (measureTimeoutRef.current) {
                clearTimeout(measureTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (measureRetryCount > 0 && measureRetryCount <= 3) {
            measureTarget();
        }
    }, [measureRetryCount, measureTarget]);

    useEffect(() => {
        if (visible && step) {
            const timer = setTimeout(measureTarget, 100);
            return () => clearTimeout(timer);
        }
    }, [visible, screenWidth, screenHeight, measureTarget, step]);

    useEffect(() => {
        if (visible) {
            measureTarget();
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
        }
    }, [visible, currentStep, measureTarget, fadeAnim, scaleAnim]);

    useEffect(() => {
        if (visible) {
            setTargetLayout(null);
            setMeasureRetryCount(0);
            const timer = setTimeout(measureTarget, 50);
            return () => clearTimeout(timer);
        }
    }, [currentStep, visible, measureTarget]);

    const onTooltipLayout = useCallback((event) => {
        const { height } = event.nativeEvent.layout;
        if (height > 0) {
            setTooltipMeasuredHeight(height);
        }
    }, []);

    // ============================================
    // EARLY RETURN
    // ============================================
    if (!visible || !step) return null;

    // ============================================
    // SPOTLIGHT CALCULATION - Responsive
    // ============================================
    const currentSpotlightPadding = targetLayout?.padding || spotlightPadding;

    // Platform-specific Y offset adjustment
    // Android needs additional offset to align spotlight correctly
    const platformYOffset = Platform.OS === 'android' ? 40 : 0;

    // Extra height for bottom nav tabs to fill the full box
    const extraHeight = isBottomNavStep ? 0 : 0;

    // Use measured position directly with platform adjustment
    const spotlight = targetLayout
        ? {
            left: Math.max(0, targetLayout.x - currentSpotlightPadding),
            top: Math.max(0, targetLayout.y - currentSpotlightPadding + platformYOffset),
            width: targetLayout.width + currentSpotlightPadding * 2,
            height: targetLayout.height + currentSpotlightPadding * 2 + extraHeight,
        }
        : null;

    // ============================================
    // OVERLAY REGIONS
    // ============================================
    const getOverlayRegions = () => {
        if (!spotlight) {
            return { fullOverlay: true };
        }

        const safeSpotlight = {
            left: Math.max(0, spotlight.left),
            top: Math.max(0, spotlight.top),
            width: Math.min(spotlight.width, screenWidth - Math.max(0, spotlight.left)),
            height: Math.min(spotlight.height, screenHeight - Math.max(0, spotlight.top)),
        };

        // Calculate common values
        const spotlightBottom = safeSpotlight.top + safeSpotlight.height + (Platform.OS === 'android' ? 10 : 0);
        const spotlightRight = safeSpotlight.left + safeSpotlight.width + 0;

        // Use explicit dimensions for Android, right:0/bottom:0 for iOS
        if (Platform.OS === 'android') {
            // Overlap to eliminate white space
            const overlap = 0;
            // Height for left/right regions should match spotlightBottom - safeSpotlight.top
            const sideHeight = spotlightBottom - safeSpotlight.top;
            return {
                top: { top: 0, left: 0, width: screenWidth, height: Math.max(0, safeSpotlight.top + overlap) },
                left: { top: safeSpotlight.top, left: 0, width: Math.max(0, safeSpotlight.left + overlap), height: sideHeight },
                right: { top: safeSpotlight.top, left: spotlightRight - overlap, width: screenWidth - spotlightRight + overlap, height: sideHeight },
                bottom: { top: spotlightBottom - overlap, left: 0, width: screenWidth, height: screenHeight - spotlightBottom + 100 + overlap },
            };
        }

        // iOS: Use standard overlay regions with right:0/bottom:0
        return {
            top: { top: 0, left: 0, right: 0, height: Math.max(0, safeSpotlight.top) },
            left: { top: safeSpotlight.top, left: 0, width: Math.max(0, safeSpotlight.left), height: safeSpotlight.height },
            right: { top: safeSpotlight.top, left: spotlightRight, right: 0, height: safeSpotlight.height },
            bottom: { top: spotlightBottom, left: 0, right: 0, bottom: 0 },
        };
    };

    const overlayRegions = getOverlayRegions();

    // ============================================
    // TOOLTIP POSITION - Fully responsive
    // ============================================
    const tooltipWidth = screenWidth - tooltipHorizontalMargin * 2;

    const getTooltipPosition = () => {
        if (!targetLayout || !spotlight) {
            // Center tooltip when no target
            return {
                top: hp(50) - tooltipHeight / 2,
                arrowPosition: 'none',
                arrowLeft: 50,
            };
        }

        const spotlightBottom = spotlight.top + spotlight.height;
        const spotlightTop = spotlight.top;
        const arrowHeight = arrowSize + 4;

        // Calculate arrow horizontal position
        const targetCenterX = targetLayout.x + targetLayout.width / 2;
        const arrowLeftPercent = clamp(
            ((targetCenterX - tooltipHorizontalMargin) / tooltipWidth) * 100,
            15,
            85
        );

        // Calculate available space - responsive to screen height
        const spaceAbove = spotlightTop - statusBarHeight - hp(2); // 2% margin from top
        const spaceBelow = screenHeight - spotlightBottom - bottomSafeArea - hp(2); // 2% margin from bottom

        // Minimum space needed
        const minSpaceNeeded = tooltipHeight + tooltipGap + arrowHeight;

        // Determine placement based on step preference and available space
        const preferredPosition = step.tooltipPosition;
        let placement;

        // Force 'above' for vehicleType step
        if (step?.id === 'vehicleType') {
            placement = 'above';
        } else if (preferredPosition === 'above') {
            placement = spaceAbove >= minSpaceNeeded ? 'above' : (spaceBelow >= minSpaceNeeded ? 'below' : 'above');
        } else if (preferredPosition === 'below') {
            placement = spaceBelow >= minSpaceNeeded ? 'below' : (spaceAbove >= minSpaceNeeded ? 'above' : 'below');
        } else {
            // Auto: choose based on which has more space
            placement = spaceBelow >= spaceAbove ? 'below' : 'above';
        }

        if (placement === 'below') {
            // Position tooltip below spotlight
            const topPosition = spotlightBottom + tooltipGap + arrowHeight;
            // Ensure tooltip doesn't go off screen
            const maxTop = screenHeight - tooltipHeight - bottomSafeArea - hp(2);
            return {
                top: Math.min(topPosition, maxTop),
                arrowPosition: 'top',
                arrowLeft: arrowLeftPercent,
            };
        } else {
            // Position tooltip above spotlight
            const bottomPosition = screenHeight - spotlightTop + tooltipGap + arrowHeight;
            // Ensure tooltip doesn't go off screen
            const maxBottom = screenHeight - statusBarHeight - hp(2);
            return {
                bottom: Math.min(bottomPosition, maxBottom),
                arrowPosition: 'bottom',
                arrowLeft: arrowLeftPercent,
            };
        }
    };

    const tooltipPosition = getTooltipPosition();

    // ============================================
    // PROGRESS DOTS - Responsive
    // ============================================
    const renderProgressDots = () => (
        <View style={styles.progressContainer}>
            {steps.map((_, index) => (
                <View
                    key={index}
                    style={[
                        styles.progressDot,
                        {
                            width: scaleW(7),
                            height: scaleW(7),
                            borderRadius: scaleW(4),
                            marginHorizontal: scaleW(2),
                        },
                        index === currentStep && {
                            width: scaleW(18),
                            backgroundColor: '#4DA6FF',
                        },
                        index < currentStep && styles.progressDotCompleted,
                    ]}
                />
            ))}
        </View>
    );

    // ============================================
    // RENDER
    // ============================================
    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onSkip}
        >
            <View style={styles.overlay}>
                {/* Dark overlay regions */}
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
                    {overlayRegions.fullOverlay ? (
                        <View style={[styles.darkOverlay, { flex: 1 }]} />
                    ) : (
                        <>
                            <View style={[styles.darkOverlay, overlayRegions.top]} />
                            <View style={[styles.darkOverlay, overlayRegions.left]} />
                            <View style={[styles.darkOverlay, overlayRegions.right]} />
                            <View style={[styles.darkOverlay, overlayRegions.bottom]} />
                        </>
                    )}
                </Animated.View>

                {/* Spotlight border */}
                {spotlight && (
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: spotlight.left,
                            top: spotlight.top,
                            width: spotlight.width,
                            height: spotlight.height,
                            borderRadius: borderRadius.spotlight,
                            borderWidth: 2,
                            borderColor: '#4DA6FF',
                            opacity: fadeAnim,
                            backgroundColor: 'transparent',
                        }}
                    />
                )}

                {/* Tooltip */}
                <Animated.View
                    style={[
                        styles.tooltipWrapper,
                        {
                            left: tooltipHorizontalMargin,
                            right: tooltipHorizontalMargin,
                            maxHeight: hp(45), // Max 45% of screen height
                        },
                        tooltipPosition.top !== undefined && { top: tooltipPosition.top },
                        tooltipPosition.bottom !== undefined && { bottom: tooltipPosition.bottom },
                        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}
                    onLayout={onTooltipLayout}
                >
                    {/* Arrow up */}
                    {tooltipPosition.arrowPosition === 'top' && (
                        <View style={[styles.arrowContainer, { left: `${tooltipPosition.arrowLeft}%` }]}>
                            <View
                                style={[
                                    styles.arrowUp,
                                    {
                                        borderLeftWidth: arrowSize,
                                        borderRightWidth: arrowSize,
                                        borderBottomWidth: arrowSize + 2,
                                        marginTop: -arrowSize,
                                    },
                                ]}
                            />
                        </View>
                    )}

                    <View
                        style={[
                            styles.tooltipContainer,
                            {
                                borderRadius: borderRadius.tooltip,
                                paddingHorizontal: spacing.lg,
                                paddingVertical: spacing.md,
                            },
                        ]}
                    >
                        {renderProgressDots()}

                        <Text
                            style={[
                                styles.tooltipTitle,
                                { fontSize: fontSizes.title, marginBottom: spacing.xs },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {step.title}
                        </Text>

                        <Text
                            style={[
                                styles.tooltipDescription,
                                {
                                    fontSize: fontSizes.description,
                                    lineHeight: fontSizes.description * 1.4,
                                    marginBottom: spacing.sm,
                                    paddingHorizontal: spacing.sm,
                                },
                            ]}
                            numberOfLines={3}
                        >
                            {step.description}
                        </Text>

                        <Text
                            style={[
                                styles.stepCounter,
                                { fontSize: fontSizes.counter, marginBottom: spacing.md },
                            ]}
                        >
                            {currentStep + 1} of {steps.length}
                        </Text>

                        <View style={[styles.buttonContainer, { paddingHorizontal: spacing.xs }]}>
                            <TouchableOpacity
                                style={[styles.skipButton, { paddingVertical: spacing.sm, paddingHorizontal: spacing.md }]}
                                onPress={onSkip}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Text style={[styles.skipButtonText, { fontSize: fontSizes.button }]}>
                                    Skip
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.navButtons}>
                                {!isFirstStep && (
                                    <TouchableOpacity
                                        style={[
                                            styles.prevButton,
                                            {
                                                paddingVertical: spacing.sm,
                                                paddingHorizontal: spacing.lg,
                                                borderRadius: borderRadius.button,
                                                marginRight: spacing.sm,
                                            },
                                        ]}
                                        onPress={onPrev}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Text style={[styles.prevButtonText, { fontSize: fontSizes.button }]}>
                                            Prev
                                        </Text>
                                    </TouchableOpacity>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.nextButton,
                                        {
                                            paddingVertical: spacing.sm,
                                            paddingHorizontal: spacing.xl,
                                            borderRadius: borderRadius.button,
                                        },
                                    ]}
                                    onPress={isLastStep ? onFinish : onNext}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Text style={[styles.nextButtonText, { fontSize: fontSizes.button }]}>
                                        {isLastStep ? 'Done' : 'Next'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Arrow down */}
                    {tooltipPosition.arrowPosition === 'bottom' && (
                        <View style={[styles.arrowContainerBottom, { left: `${tooltipPosition.arrowLeft}%` }]}>
                            <View
                                style={[
                                    styles.arrowDown,
                                    {
                                        borderLeftWidth: arrowSize,
                                        borderRightWidth: arrowSize,
                                        borderTopWidth: arrowSize + 2,
                                        marginBottom: -arrowSize,
                                    },
                                ]}
                            />
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
    },
    darkOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
    spotlightBorder: {
        position: 'absolute',
        borderColor: '#4DA6FF',
        backgroundColor: 'transparent',
        zIndex: 10,
    },
    tooltipWrapper: {
        position: 'absolute',
        zIndex: 99,
    },
    arrowContainer: {
        position: 'absolute',
        top: 0,
        marginLeft: -14,
        zIndex: 101,
    },
    arrowContainerBottom: {
        position: 'absolute',
        bottom: 0,
        marginLeft: -14,
        zIndex: 101,
    },
    arrowUp: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: Colors.white,
    },
    arrowDown: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: Colors.white,
    },
    tooltipContainer: {
        backgroundColor: Colors.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 15,
        alignItems: 'center',
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressDot: {
        backgroundColor: Colors.dotInactive || '#E0E0E0',
    },
    progressDotCompleted: {
        backgroundColor: '#4CAF50',
    },
    tooltipTitle: {
        fontWeight: Typography?.fontWeight?.bold || '700',
        color: Colors.dark,
        textAlign: 'center',
    },
    tooltipDescription: {
        color: Colors.gray,
        textAlign: 'center',
    },
    stepCounter: {
        color: Colors.gray,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    skipButton: {},
    skipButtonText: {
        color: Colors.gray,
        fontWeight: Typography?.fontWeight?.medium || '500',
    },
    navButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prevButton: {
        borderWidth: 1,
        borderColor: Colors.border || '#E0E0E0',
    },
    prevButtonText: {
        color: Colors.dark,
        fontWeight: Typography?.fontWeight?.medium || '500',
    },
    nextButton: {
        backgroundColor: Colors.dotActive || '#4DA6FF',
    },
    nextButtonText: {
        color: Colors.white,
        fontWeight: Typography?.fontWeight?.semiBold || '600',
    },
});

export default AppTour;
