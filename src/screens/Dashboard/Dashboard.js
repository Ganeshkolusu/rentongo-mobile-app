import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StatusBar, StyleSheet, View } from "react-native";
import { AppTour } from "../../components/AppTour";
import { useAppTour } from "../../components/AppTour/useAppTour";
import { Colors } from "../../constants/Colors";
import { BorderRadius, normalize } from "../../constants/Dimensions";
import NavBar from "../../navigations/NavBar";
import { renderScreen } from "../../navigations/TabConfig";
import TopNavbar from "../../navigations/TopNavbar";
import { checkLocationPermission, getCurrentLocationWithAddress } from "../../utils/location";
import { requestAllPermissions } from "../../utils/permissions";

const SELECTED_LOCATION_KEY = 'selectedUserLocation';
const PERMISSIONS_REQUESTED_KEY = 'permissionsRequested';

const Dashboard = ({ navigation, route }) => {
    const [activeTab, setActiveTab] = useState("Rental");
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [permissionsReady, setPermissionsReady] = useState(false);

    // ============================================
    // APP TOUR INTEGRATION
    // ============================================

    // Refs to navbar components (using forwardRef pattern)
    const topNavbarRef = useRef(null);
    const navBarRef = useRef(null);

    // Determine if TopNavbar should be visible (moved up for tour)
    const showTopNavbar = activeTab !== "Listed" && activeTab !== "Account" && activeTab !== "MyBookings";

    // Initialize App Tour hook - pass options based on what's visible
    const {
        isTourVisible,
        currentStep,
        steps,
        goToNextStep,
        goToPrevStep,
        skipTour,
        finishTour,
        startTourIfNeeded,
        isLoading: isTourLoading,
    } = useAppTour('Dashboard', {
        showTopNavSteps: showTopNavbar,
        showBottomNavSteps: true,
    });

    // Collect all tour target refs from child components
    // This is called after components mount and expose their refs
    const targetRefs = useMemo(() => {
        const refs = {};

        // Get refs from TopNavbar (if visible and mounted)
        if (topNavbarRef.current) {
            const topNavRefs = topNavbarRef.current;
            if (topNavRefs.locationSelector) refs.locationSelector = topNavRefs.locationSelector;
            if (topNavRefs.notificationButton) refs.notificationButton = topNavRefs.notificationButton;
            if (topNavRefs.searchBar) refs.searchBar = topNavRefs.searchBar;
            if (topNavRefs.filterButton) refs.filterButton = topNavRefs.filterButton;
        }

        // Get refs from NavBar (always visible)
        if (navBarRef.current) {
            const navRefs = navBarRef.current;
            if (navRefs.rentalTab) refs.rentalTab = navRefs.rentalTab;
            if (navRefs.listedTab) refs.listedTab = navRefs.listedTab;
            if (navRefs.addButton) refs.addButton = navRefs.addButton;
            if (navRefs.myBookingsTab) refs.myBookingsTab = navRefs.myBookingsTab;
            if (navRefs.accountTab) refs.accountTab = navRefs.accountTab;
        }

        return refs;
    }, [isTourVisible, currentStep, showTopNavbar]);

    // Start tour immediately after permissions are handled and refs are ready
    useEffect(() => {
        if (!isTourLoading && showTopNavbar && permissionsReady) {
            // Minimal delay to ensure refs are measured - tour shows immediately after permissions
            const timer = setTimeout(() => {
                startTourIfNeeded(0);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isTourLoading, showTopNavbar, startTourIfNeeded, permissionsReady]);

    // Save location to AsyncStorage
    const saveLocationToStorage = async (location) => {
        try {
            if (location) {
                await AsyncStorage.setItem(SELECTED_LOCATION_KEY, JSON.stringify(location));
            }
        } catch (error) {
            // Silent fail
        }
    };

    // Load saved location from AsyncStorage
    const loadSavedLocation = async () => {
        try {
            const savedLocation = await AsyncStorage.getItem(SELECTED_LOCATION_KEY);
            if (savedLocation) {
                return JSON.parse(savedLocation);
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    useEffect(() => {
        if (route.params?.activeTab) {
            setActiveTab(route.params.activeTab);
        }
    }, [route.params?.activeTab]);

    useEffect(() => {
        if (route.params?.selectedAddress) {
            setSelectedAddress(route.params.selectedAddress);
            saveLocationToStorage(route.params.selectedAddress);
        }
    }, [route.params?.selectedAddress]);

    // Request permissions first, then initialize location
    useEffect(() => {
        const initDashboard = async () => {
            // Step 1: Request permissions if not already requested
            try {
                const alreadyRequested = await AsyncStorage.getItem(PERMISSIONS_REQUESTED_KEY);
                if (!alreadyRequested) {
                    await requestAllPermissions();
                    await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
                }
            } catch (error) {
                // Silent fail on permission request
            }

            // Mark permissions as ready immediately after permissions are handled
            // This allows the tour to show right away while location loads in background
            setPermissionsReady(true);

            // Step 2: Load saved location or fetch current location (happens after tour can start)
            const savedLocation = await loadSavedLocation();
            if (savedLocation) {
                setSelectedAddress(savedLocation);
                return;
            }

            // If no saved location, fetch current location (permissions should be granted now)
            try {
                const hasPermission = await checkLocationPermission();
                if (hasPermission) {
                    const locationAddress = await getCurrentLocationWithAddress();
                    if (locationAddress) {
                        setSelectedAddress(locationAddress);
                        saveLocationToStorage(locationAddress);
                    }
                }
            } catch (error) {
                // Silent fail on location fetch
            }
        };

        initDashboard();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (route.params?.selectedAddress) {
                setSelectedAddress(route.params.selectedAddress);
                saveLocationToStorage(route.params.selectedAddress);
            }
        }, [route.params?.selectedAddress])
    );

    const handleFilterPress = () => {
        const userLocation = selectedAddress?.latitude && selectedAddress?.longitude
            ? { latitude: selectedAddress.latitude, longitude: selectedAddress.longitude }
            : { latitude: 17.4417, longitude: 78.4416 };
        navigation.navigate('FilterScreen', { userLocation, selectedAddress });
    };

    const handleNotificationPress = () => {
        navigation.navigate('NotificationScreen');
    };

    const handleLocationPress = () => {
        navigation.navigate('ChangeLocationScreen');
    };

    const handleSearchTextChange = (text) => {
        setSearchText(text);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />

            {showTopNavbar && (
                <TopNavbar
                    ref={topNavbarRef}
                    onFilterPress={handleFilterPress}
                    onNotificationPress={handleNotificationPress}
                    onLocationPress={handleLocationPress}
                    onSearchTextChange={handleSearchTextChange}
                    selectedAddress={selectedAddress}
                />
            )}

            {/* Main content area */}
            <View style={[styles.content, !showTopNavbar && styles.contentFullHeight]}>
                {renderScreen(activeTab, navigation, route, searchText, selectedAddress)}
            </View>

            <NavBar
                ref={navBarRef}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />

            {/* App Tour Overlay */}
            <AppTour
                visible={isTourVisible}
                steps={steps}
                currentStep={currentStep}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
                onSkip={skipTour}
                onFinish={finishTour}
                targetRefs={targetRefs}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        marginTop: Platform.OS !== 'ios' ? normalize(10) : normalize(4),
    },
    contentFullHeight: {
        marginTop: 0,
    },
});

export default Dashboard;
