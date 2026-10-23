// src/components/AppTour/useAppTour.js
// Hook for managing App Tour state with responsive support and orientation handling
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWindowDimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTourSteps, getStepsForScreen } from './tourSteps';

const APP_TOUR_COMPLETED_KEY = 'appTourCompleted';

// Debounce delay for dimension changes (orientation, etc.)
const DIMENSION_CHANGE_DEBOUNCE = 150;

/**
 * Hook for managing App Tour state
 * Automatically handles responsive step generation based on screen dimensions
 * Includes debouncing for smooth orientation changes
 *
 * @param {string} screenName - Optional screen name to filter steps
 * @param {object} options - Configuration options
 * @param {boolean} options.showTopNavSteps - Whether to include top navbar steps (default: true)
 * @param {boolean} options.showBottomNavSteps - Whether to include bottom navbar steps (default: true)
 * @returns Tour state and control functions
 */
export const useAppTour = (screenName = 'Dashboard', options = {}) => {
    const {
        showTopNavSteps = true,
        showBottomNavSteps = true,
    } = options;
    // Get current dimensions for responsive steps
    const { width: screenWidth, height: screenHeight } = useWindowDimensions();
    const insets = useSafeAreaInsets();

    // Track previous dimensions to detect significant changes
    const prevDimensionsRef = useRef({ width: screenWidth, height: screenHeight });
    const dimensionDebounceRef = useRef(null);

    const [isTourVisible, setIsTourVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [tourCompleted, setTourCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [debouncedDimensions, setDebouncedDimensions] = useState({
        width: screenWidth,
        height: screenHeight,
    });

    // Debounce dimension changes to prevent rapid re-renders during orientation change
    useEffect(() => {
        const hasSignificantChange =
            Math.abs(screenWidth - prevDimensionsRef.current.width) > 10 ||
            Math.abs(screenHeight - prevDimensionsRef.current.height) > 10;

        if (hasSignificantChange) {
            // Clear any pending debounce
            if (dimensionDebounceRef.current) {
                clearTimeout(dimensionDebounceRef.current);
            }

            // Debounce the dimension update
            dimensionDebounceRef.current = setTimeout(() => {
                setDebouncedDimensions({ width: screenWidth, height: screenHeight });
                prevDimensionsRef.current = { width: screenWidth, height: screenHeight };
            }, DIMENSION_CHANGE_DEBOUNCE);
        }

        return () => {
            if (dimensionDebounceRef.current) {
                clearTimeout(dimensionDebounceRef.current);
            }
        };
    }, [screenWidth, screenHeight]);

    // Step IDs for top and bottom navigation
    const TOP_NAV_STEP_IDS = ['location', 'notification', 'search', 'filter'];
    const BOTTOM_NAV_STEP_IDS = ['rental', 'listed', 'addListing', 'myBookings', 'account'];

    // Generate responsive steps based on debounced dimensions
    // This prevents flickering during rapid orientation changes
    const steps = useMemo(() => {
        let allSteps;
        if (screenName) {
            allSteps = getStepsForScreen(
                screenName,
                debouncedDimensions.width,
                debouncedDimensions.height,
                insets
            );
        } else {
            allSteps = getTourSteps(debouncedDimensions.width, debouncedDimensions.height, insets);
        }

        // Filter steps based on visibility options
        return allSteps.filter(step => {
            // If top nav is hidden, exclude top nav steps
            if (!showTopNavSteps && TOP_NAV_STEP_IDS.includes(step.id)) {
                return false;
            }
            // If bottom nav is hidden, exclude bottom nav steps
            if (!showBottomNavSteps && BOTTOM_NAV_STEP_IDS.includes(step.id)) {
                return false;
            }
            return true;
        });
    }, [screenName, debouncedDimensions.width, debouncedDimensions.height, insets, showTopNavSteps, showBottomNavSteps]);

    // Check if tour has been completed before
    useEffect(() => {
        const checkTourStatus = async () => {
            try {
                const completed = await AsyncStorage.getItem(APP_TOUR_COMPLETED_KEY);
                setTourCompleted(completed === 'true');
                setIsLoading(false);
            } catch (error) {
                setIsLoading(false);
            }
        };
        checkTourStatus();
    }, []);

    // Reset step to 0 if current step exceeds steps length (safety check)
    // Also handle case when steps are filtered out (e.g., TopNavbar hidden)
    useEffect(() => {
        if (steps.length === 0) {
            // No steps available, hide the tour
            if (isTourVisible) {
                setIsTourVisible(false);
            }
            return;
        }
        if (currentStep >= steps.length) {
            setCurrentStep(0);
        }
    }, [steps.length, currentStep, isTourVisible]);

    // Start tour automatically if not completed
    const startTourIfNeeded = useCallback((delay = 0) => {
        // Only start if there are steps to show
        if (!tourCompleted && !isLoading && steps.length > 0) {
            if (delay > 0) {
                setTimeout(() => {
                    setIsTourVisible(true);
                }, delay);
            } else {
                setIsTourVisible(true);
            }
        }
    }, [tourCompleted, isLoading, steps.length]);

    // Force start tour (for settings/help menu)
    const startTour = useCallback(() => {
        if (steps.length > 0) {
            setCurrentStep(0);
            setIsTourVisible(true);
        }
    }, [steps.length]);

    // Go to next step
    const goToNextStep = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        }
    }, [currentStep, steps.length]);

    // Go to previous step
    const goToPrevStep = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    }, [currentStep]);

    // Skip tour
    const skipTour = useCallback(async () => {
        setIsTourVisible(false);
        setCurrentStep(0);
        try {
            await AsyncStorage.setItem(APP_TOUR_COMPLETED_KEY, 'true');
            setTourCompleted(true);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Finish tour
    const finishTour = useCallback(async () => {
        setIsTourVisible(false);
        setCurrentStep(0);
        try {
            await AsyncStorage.setItem(APP_TOUR_COMPLETED_KEY, 'true');
            setTourCompleted(true);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Reset tour (for testing or settings)
    const resetTour = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(APP_TOUR_COMPLETED_KEY);
            setTourCompleted(false);
            setCurrentStep(0);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Go to specific step
    const goToStep = useCallback((stepIndex) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            setCurrentStep(stepIndex);
        }
    }, [steps.length]);

    // Pause tour temporarily (e.g., during orientation change)
    const pauseTour = useCallback(() => {
        setIsTourVisible(false);
    }, []);

    // Resume tour
    const resumeTour = useCallback(() => {
        if (!tourCompleted) {
            setIsTourVisible(true);
        }
    }, [tourCompleted]);

    return {
        // State
        isTourVisible,
        currentStep,
        tourCompleted,
        isLoading,
        steps, // Now returns responsive steps

        // Actions
        startTour,
        startTourIfNeeded,
        goToNextStep,
        goToPrevStep,
        skipTour,
        finishTour,
        resetTour,
        goToStep,
        pauseTour,
        resumeTour,

        // Dimensions (for components that need them)
        screenWidth: debouncedDimensions.width,
        screenHeight: debouncedDimensions.height,
        insets,
    };
};
