// src/components/AppTour/index.js
// App Tour module exports

// Main components
export { default as AppTour } from './AppTour';
export { default as TourSpotlight } from './TourSpotlight';

// Context and hooks
export { TourProvider, useTour, TOUR_STEPS } from './TourContext';
export { useAppTour } from './useAppTour';
export { useTourRefs, useTourRefCollector, createTourRefCallback } from './useTourRefs';

// Step configuration
export { getTourSteps, getStepsForScreen } from './tourSteps';

// Utilities
export {
    moderateScale,
    scaleSize,
    widthPercent,
    heightPercent,
    getDeviceType,
    getScaleFactors,
    getStatusBarHeight,
    getBottomSafeArea,
    getTooltipDimensions,
    getTooltipGap,
    getSpotlightPadding,
    calculateTooltipPlacement,
    calculateArrowPosition,
    normalizeMeasurement,
    isElementVisible,
    clamp,
    getScreenDimensions,
    debounce,
    hasDimensionsChanged,
    getElementPadding,
} from './tourUtils';
