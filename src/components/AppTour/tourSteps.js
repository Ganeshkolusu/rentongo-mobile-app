// src/components/AppTour/tourSteps.js
// Dynamic, responsive tour steps configuration - Cross-platform compatible
import { Platform } from 'react-native';
import {
    getBottomSafeArea,
    getDeviceType,
    getStatusBarHeight,
    heightPercent,
    moderateScale,
    widthPercent,
} from './tourUtils';

/**
 * Get responsive layout values based on current screen dimensions
 * All values are calculated dynamically - no hardcoded pixel values
 */
const getLayoutValues = (screenWidth, screenHeight, insets) => {
    const statusBarHeight = getStatusBarHeight(insets);
    const bottomSafeArea = getBottomSafeArea(insets);
    const deviceType = getDeviceType(screenWidth);

    // Responsive navbar heights based on device type
    const topNavbarHeight = (() => {
        switch (deviceType) {
            case 'tablet': return heightPercent(8, screenHeight);
            case 'small': return heightPercent(6, screenHeight);
            default: return heightPercent(7, screenHeight);
        }
    })();

    // Bottom nav height - responsive to screen height
    const bottomNavHeight = (() => {
        switch (deviceType) {
            case 'tablet': return heightPercent(10, screenHeight);
            case 'small': return heightPercent(9, screenHeight);
            default: return heightPercent(9.5, screenHeight);
        }
    })();

    // Standard margins/paddings as percentages
    const horizontalPadding = widthPercent(4, screenWidth);

    // Search bar position - accounts for status bar and top navbar
    const searchBarTopOffset = statusBarHeight + topNavbarHeight + moderateScale(8, screenWidth);

    return {
        statusBarHeight,
        bottomSafeArea,
        topNavbarHeight,
        bottomNavHeight,
        horizontalPadding,
        searchBarTopOffset,
        deviceType,
        // Additional responsive values
        iconSize: moderateScale(deviceType === 'tablet' ? 40 : 32, screenWidth),
        buttonSize: moderateScale(deviceType === 'tablet' ? 48 : 36, screenWidth),
        tabWidth: widthPercent(deviceType === 'tablet' ? 12 : 15, screenWidth),
    };
};

/**
 * Get responsive element padding based on element type
 */
const getElementPadding = (elementType, screenWidth) => {
    const deviceType = getDeviceType(screenWidth);
    const basePadding = {
        icon: deviceType === 'tablet' ? 8 : 6,
        button: deviceType === 'tablet' ? 10 : 8,
        card: deviceType === 'tablet' ? 14 : 10,
        container: deviceType === 'tablet' ? 16 : 12,
        tab: deviceType === 'tablet' ? 6 : 4,
    };
    return moderateScale(basePadding[elementType] || basePadding.button, screenWidth);
};

/**
 * Generate tour steps with responsive fallback positions
 * Fallbacks are only used if the ref measurement fails
 *
 * Key principles:
 * - Use percentage-based positioning where possible
 * - All values scale with screen dimensions
 * - No hardcoded pixel values
 * - Works across all device sizes
 */
export const getTourSteps = (screenWidth, screenHeight, insets) => {
    const layout = getLayoutValues(screenWidth, screenHeight, insets);

    return [
        {
            id: 'location',
            target: 'locationSelector',
            title: 'Location',
            description: 'Tap here to change your location and find vehicles near you.',
            tooltipPosition: 'below',
            getFallbackPosition: () => ({
                x: layout.horizontalPadding,
                y: layout.statusBarHeight + moderateScale(8, screenWidth),
                width: widthPercent(65, screenWidth),
                height: moderateScale(50, screenWidth),
            }),
            padding: getElementPadding('container', screenWidth),
        },
        {
            id: 'notification',
            target: 'notificationButton',
            title: 'Notifications',
            description: 'View your booking updates, messages, and important alerts.',
            tooltipPosition: 'below',
            getFallbackPosition: () => ({
                x: screenWidth - moderateScale(52, screenWidth),
                y: layout.statusBarHeight + moderateScale(8, screenWidth),
                width: layout.buttonSize,
                height: layout.buttonSize,
            }),
            padding: getElementPadding('icon', screenWidth),
        },
        {
            id: 'search',
            target: 'searchBar',
            title: 'Search',
            description: 'Search for specific cars or bikes by name, brand, or model.',
            tooltipPosition: 'below',
            getFallbackPosition: () => ({
                x: layout.horizontalPadding,
                y: layout.searchBarTopOffset,
                width: screenWidth - layout.horizontalPadding * 2,
                height: moderateScale(50, screenWidth),
            }),
            padding: getElementPadding('container', screenWidth),
        },
        {
            id: 'filter',
            target: 'filterButton',
            title: 'Filters',
            description: 'Apply filters to find vehicles that match your preferences like price, distance, and fuel type.',
            tooltipPosition: 'below',
            getFallbackPosition: () => ({
                x: screenWidth - moderateScale(60, screenWidth),
                y: layout.searchBarTopOffset + moderateScale(4, screenWidth),
                width: moderateScale(44, screenWidth),
                height: moderateScale(44, screenWidth),
            }),
            padding: getElementPadding('button', screenWidth),
        },
        {
            id: 'vehicleType',
            target: 'vehicleTypeCard',
            title: 'Vehicle Types',
            description: 'Switch between Cars and Bikes to browse different vehicle categories.',
            tooltipPosition: 'above',
            getFallbackPosition: () => {
                // Platform-specific banner height adjustment
                // iOS needs more offset due to safe area, Android needs less
                const bannerHeight = Platform.OS === 'ios'
                    ? moderateScale(243, screenWidth)
                    : moderateScale(220, screenWidth);
                // VehicleTypeCard starts after banner
                const cardY = layout.statusBarHeight + layout.topNavbarHeight + bannerHeight;
                // Card height: title (25px) + cards (110px) + margins (20px) = ~155px
                const cardHeight = moderateScale(130, screenWidth);

                return {
                    x: layout.horizontalPadding + moderateScale(5, screenWidth),
                    y: cardY,
                    // Width for just the 3 vehicle type cards
                    width: screenWidth - layout.horizontalPadding * 2 - moderateScale(10, screenWidth),
                    height: cardHeight,
                };
            },
            // Minimal padding to keep spotlight tight
            padding: moderateScale(4, screenWidth),
        },
        {
            id: 'rental',
            target: 'rentalTab',
            title: 'Rental',
            description: 'Browse and book available vehicles for rent near your location.',
            tooltipPosition: 'above',
            getFallbackPosition: () => ({
                // First tab - approximately 4% from left
                x: widthPercent(4, screenWidth),
                y: screenHeight - layout.bottomNavHeight - layout.bottomSafeArea,
                width: layout.tabWidth,
                height: moderateScale(55, screenWidth),
            }),
            padding: getElementPadding('tab', screenWidth),
        },
        {
            id: 'listed',
            target: 'listedTab',
            title: 'My Booking',
            description: 'View and manage your current and past bookings.',
            tooltipPosition: 'above',
            getFallbackPosition: () => ({
                // Second tab - approximately 22% from left
                x: widthPercent(22, screenWidth),
                y: screenHeight - layout.bottomNavHeight - layout.bottomSafeArea,
                width: layout.tabWidth,
                height: moderateScale(55, screenWidth),
            }),
            padding: getElementPadding('tab', screenWidth),
        },
        {
            id: 'addListing',
            target: 'addButton',
            title: 'Add Listing',
            description: 'List your own car or bike for rent and start earning.',
            tooltipPosition: 'above',
            getFallbackPosition: () => {
                const buttonSize = moderateScale(56, screenWidth);
                return {
                    // Center button (FAB style)
                    x: screenWidth / 2 - buttonSize / 2,
                    y: screenHeight - layout.bottomNavHeight - layout.bottomSafeArea - moderateScale(20, screenWidth),
                    width: buttonSize,
                    height: buttonSize,
                };
            },
            padding: getElementPadding('button', screenWidth),
        },
        {
            id: 'myBookings',
            target: 'myBookingsTab',
            title: 'Listed',
            description: 'View and manage all the vehicles you have listed for rent.',
            tooltipPosition: 'above',
            getFallbackPosition: () => ({
                // Fourth tab - approximately 62% from left
                x: widthPercent(62, screenWidth),
                y: screenHeight - layout.bottomNavHeight - layout.bottomSafeArea,
                width: layout.tabWidth,
                height: moderateScale(55, screenWidth),
            }),
            padding: getElementPadding('tab', screenWidth),
        },
        {
            id: 'account',
            target: 'accountTab',
            title: 'Account',
            description: 'Access your profile, settings, and account preferences.',
            tooltipPosition: 'above',
            getFallbackPosition: () => ({
                // Last tab - approximately 80% from left
                x: widthPercent(80, screenWidth),
                y: screenHeight - layout.bottomNavHeight - layout.bottomSafeArea,
                width: layout.tabWidth,
                height: moderateScale(55, screenWidth),
            }),
            padding: getElementPadding('tab', screenWidth),
        },
    ];
};

/**
 * Get steps for specific screens
 * Uses the current screen dimensions for responsive positioning
 */
export const getStepsForScreen = (screenName, screenWidth, screenHeight, insets) => {
    const allSteps = getTourSteps(screenWidth, screenHeight, insets);

    switch (screenName) {
        case 'Dashboard':
        case 'Rental':
            return allSteps;
        case 'TopNavbar':
            return allSteps.filter(step =>
                ['location', 'notification', 'search', 'filter'].includes(step.id)
            );
        case 'BottomNavbar':
            return allSteps.filter(step =>
                ['rental', 'myBookings', 'addListing', 'listed', 'account'].includes(step.id)
            );
        default:
            return allSteps;
    }
};

// Legacy export for backward compatibility (uses fixed dimensions)
// DEPRECATED: Use getTourSteps() with current dimensions instead
export const TOUR_STEPS = [];
