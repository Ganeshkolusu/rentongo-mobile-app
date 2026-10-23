// src/components/AppTour/TourContext.js
// Context for coordinating app tour across multiple screens/components
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_TOUR_COMPLETED_KEY = 'appTourCompleted';

// Define all tour steps with their screen/component assignment
export const TOUR_STEPS = [
    // TopNavbar steps (0-3)
    { id: 'location', screen: 'TopNavbar', title: 'Location', description: 'Tap here to change your location and find vehicles near you.', tooltipPosition: 'below' },
    { id: 'notification', screen: 'TopNavbar', title: 'Notifications', description: 'View your booking updates, messages, and important alerts.', tooltipPosition: 'below' },
    { id: 'search', screen: 'TopNavbar', title: 'Search', description: 'Search for specific cars or bikes by name, brand, or model.', tooltipPosition: 'below' },
    { id: 'filter', screen: 'TopNavbar', title: 'Filters', description: 'Apply filters to find vehicles that match your preferences.', tooltipPosition: 'below' },
    // Content steps (4)
    { id: 'vehicleType', screen: 'RentalContent', title: 'Vehicle Types', description: 'Switch between Cars and Bikes to browse different vehicle categories.', tooltipPosition: 'below' },
    // BottomNavbar steps (5-9)
    { id: 'rental', screen: 'BottomNavbar', title: 'Rental', description: 'Browse and book available vehicles for rent near your location.', tooltipPosition: 'above' },
    { id: 'listed', screen: 'BottomNavbar', title: 'My Booking', description: 'View and manage your current and past bookings.', tooltipPosition: 'above' },
    { id: 'addListing', screen: 'BottomNavbar', title: 'Add Listing', description: 'List your own car or bike for rent and start earning.', tooltipPosition: 'above' },
    { id: 'myBookings', screen: 'BottomNavbar', title: 'Listed', description: 'View and manage all the vehicles you have listed for rent.', tooltipPosition: 'above' },
    { id: 'account', screen: 'BottomNavbar', title: 'Account', description: 'Access your profile, settings, and account preferences.', tooltipPosition: 'above' },
];

const TourContext = createContext(null);

export const TourProvider = ({ children }) => {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [tourCompleted, setTourCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Get current step
    const currentStep = TOUR_STEPS[currentStepIndex] || null;
    const totalSteps = TOUR_STEPS.length;

    // Check if tour was completed before
    useEffect(() => {
        const checkTourStatus = async () => {
            try {
                const completed = await AsyncStorage.getItem(APP_TOUR_COMPLETED_KEY);
                setTourCompleted(completed === 'true');
            } catch (error) {
                // Silent fail
            } finally {
                setIsLoading(false);
            }
        };
        checkTourStatus();
    }, []);

    // Start tour
    const startTour = useCallback(() => {
        setCurrentStepIndex(0);
        setIsTourActive(true);
    }, []);

    // Start tour if not completed
    const startTourIfNeeded = useCallback((delay = 0) => {
        if (!tourCompleted && !isLoading) {
            if (delay > 0) {
                setTimeout(() => {
                    setCurrentStepIndex(0);
                    setIsTourActive(true);
                }, delay);
            } else {
                setCurrentStepIndex(0);
                setIsTourActive(true);
            }
        }
    }, [tourCompleted, isLoading]);

    // Go to next step
    const nextStep = useCallback(() => {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [currentStepIndex]);

    // Go to previous step
    const prevStep = useCallback(() => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStepIndex]);

    // Skip tour
    const skipTour = useCallback(async () => {
        setIsTourActive(false);
        setCurrentStepIndex(0);
        try {
            await AsyncStorage.setItem(APP_TOUR_COMPLETED_KEY, 'true');
            setTourCompleted(true);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Finish tour
    const finishTour = useCallback(async () => {
        setIsTourActive(false);
        setCurrentStepIndex(0);
        try {
            await AsyncStorage.setItem(APP_TOUR_COMPLETED_KEY, 'true');
            setTourCompleted(true);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Reset tour (for testing)
    const resetTour = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(APP_TOUR_COMPLETED_KEY);
            setTourCompleted(false);
            setCurrentStepIndex(0);
        } catch (error) {
            // Silent fail
        }
    }, []);

    // Check if a specific step should be shown by a screen
    const shouldShowStep = useCallback((screen, stepId) => {
        if (!isTourActive || !currentStep) return false;
        return currentStep.screen === screen && currentStep.id === stepId;
    }, [isTourActive, currentStep]);

    // Get steps for a specific screen
    const getStepsForScreen = useCallback((screen) => {
        return TOUR_STEPS.filter(step => step.screen === screen);
    }, []);

    // Check if current step belongs to a screen
    const isScreenActive = useCallback((screen) => {
        if (!isTourActive || !currentStep) return false;
        return currentStep.screen === screen;
    }, [isTourActive, currentStep]);

    const value = {
        // State
        isTourActive,
        currentStepIndex,
        currentStep,
        totalSteps,
        tourCompleted,
        isLoading,

        // Actions
        startTour,
        startTourIfNeeded,
        nextStep,
        prevStep,
        skipTour,
        finishTour,
        resetTour,

        // Helpers
        shouldShowStep,
        getStepsForScreen,
        isScreenActive,

        // Step info
        isFirstStep: currentStepIndex === 0,
        isLastStep: currentStepIndex === TOUR_STEPS.length - 1,
    };

    return (
        <TourContext.Provider value={value}>
            {children}
        </TourContext.Provider>
    );
};

// Hook to use tour context
export const useTour = () => {
    const context = useContext(TourContext);
    if (!context) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
};

export default TourContext;
