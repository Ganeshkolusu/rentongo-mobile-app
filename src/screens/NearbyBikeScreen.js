import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getVehicleAvailability } from '../api/services/availabilityService';
import Header from '../components/Header/Header';
import BikeCard from '../components/Rental/BikeCard';
import { getSafeImageSource } from '../config/apiConfig';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';
import { useDataCache } from '../context/DataCacheContext';
import NavBar from '../navigations/NavBar';
import { getFilterSummary } from '../utils/filterFormatter';
import { calculateDistance, getCurrentLocation } from '../utils/location';

// Global store to persist filter state across navigations
let persistedBikeFilterState = {
    bikesData: null,
    appliedFilters: null,
    isFiltered: false,
    filterTimestamp: null,
};

// Export function to clear persisted bike filter state (called from FilterScreen)
export const clearPersistedBikeFilterState = () => {
    persistedBikeFilterState = {
        bikesData: null,
        appliedFilters: null,
        isFiltered: false,
        filterTimestamp: null,
    };
};

const NearbyBikeScreen = ({ navigation, route }) => {
    // Use cached data from context
    const { nearbyBikes: cachedBikes, fetchNearbyBikes: fetchCachedBikes, loadingStates, initialLoadDone } = useDataCache();

    // Check if we're coming with new filtered data from FilterScreen
    const hasNewFilteredData = route?.params?.filteredVehicles && route?.params?.filterTimestamp;

    // Determine initial state based on route params or persisted state
    const getInitialState = () => {
        // If coming with new filtered data, use it
        if (hasNewFilteredData) {
            return {
                bikesData: route.params.filteredVehicles,
                isFiltered: true,
                appliedFilters: route.params.appliedFilters,
                filterTimestamp: route.params.filterTimestamp,
                loading: false,
            };
        }
        // If we have persisted filtered state, use it
        if (persistedBikeFilterState.isFiltered && persistedBikeFilterState.bikesData) {
            return {
                bikesData: persistedBikeFilterState.bikesData,
                isFiltered: true,
                appliedFilters: persistedBikeFilterState.appliedFilters,
                filterTimestamp: persistedBikeFilterState.filterTimestamp,
                loading: false,
            };
        }
        // Use cached data if available
        if (cachedBikes && cachedBikes.length > 0) {
            return {
                bikesData: cachedBikes,
                isFiltered: false,
                appliedFilters: null,
                filterTimestamp: null,
                loading: false,
            };
        }
        // Default: no filters, need to fetch
        return {
            bikesData: [],
            isFiltered: false,
            appliedFilters: null,
            filterTimestamp: null,
            loading: !initialLoadDone.nearbyBikes,
        };
    };

    const initialState = getInitialState();

    const [activeTab, setActiveTab] = useState("Rental");
    const [bikesData, setBikesData] = useState(initialState.bikesData);
    const [loading, setLoading] = useState(initialState.loading);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [isFiltered, setIsFiltered] = useState(initialState.isFiltered);
    const [userLocation, setUserLocation] = useState(null);
    const [appliedFilters, setAppliedFilters] = useState(initialState.appliedFilters);
    const [filterInfo, setFilterInfo] = useState(null);
    const filterBannerOpacity = useRef(new Animated.Value(1)).current;

    // Track if initial fetch has been done to prevent re-fetching after filter
    const initialFetchDone = useRef(initialState.isFiltered || (cachedBikes && cachedBikes.length > 0));
    // Track the last processed filter timestamp to avoid re-processing
    const lastFilterTimestamp = useRef(initialState.filterTimestamp);

    // Get selected address from route params (passed from RentalScreen/Dashboard)
    const selectedAddress = route?.params?.selectedAddress;

    // Default location (Hyderabad) - fallback if location permission denied
    const defaultLatitude = 17.4889;
    const defaultLongitude = 78.4889;
    const MAX_DISTANCE_KM = 10; // Only show bikes within 10km

    // Update local state when cached data changes
    useEffect(() => {
        if (!isFiltered && cachedBikes && cachedBikes.length > 0 && !loading) {
            setBikesData(cachedBikes);
        }
    }, [cachedBikes, isFiltered]);

    /**
     * Get location for filtering - prioritizes selected address over GPS
     */
    const getLocationForFiltering = () => {
        if (selectedAddress?.latitude && selectedAddress?.longitude) {
            return {
                latitude: selectedAddress.latitude,
                longitude: selectedAddress.longitude
            };
        }
        return userLocation;
    };

    /**
     * Get user's current location
     */
    // Key changes for NearbyBikeScreen - Same pattern as cars

    // Replace the getUserLocation function:
    const getUserLocation = async () => {
        try {
            const location = await getCurrentLocation();
            setUserLocation(location);
            return location;
        } catch (error) {
            setUserLocation(null);
            throw error; // Throw error instead of returning fallback
        }
    };

    // Update the fetchNearbyBikes function:
    const fetchNearbyBikes = async (isRefreshing = false, forceRefresh = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            setError(null);

            // Priority: selectedAddress > userLocation > GPS
            let location = getLocationForFiltering();
            if (!location) {
                location = await getUserLocation();
            }

            // ADD THIS CHECK - If still no location, don't fetch
            if (!location) {
                setError('Location access required to show nearby bikes');
                setBikesData([]);
                return;
            }

            const params = {
                latitude: location.latitude,
                longitude: location.longitude,
                range: MAX_DISTANCE_KM,
            };
            // Use cached fetch which handles caching automatically
            const bikes = await fetchCachedBikes(params, forceRefresh || isRefreshing);

            if (bikes && Array.isArray(bikes)) {
                // Filter by distance and status
                const nearbyBikes = bikes.filter(bike => {
                    const status = (bike.Status || bike.status || '').toLowerCase().trim();
                    if (status && status !== 'verified' && status !== 'approved') {
                        return false;
                    }

                    const bikeLat = parseFloat(bike.latitude || bike.pickupLatitude);
                    const bikeLon = parseFloat(bike.longitude || bike.pickupLongitude);
                    if (!bikeLat || !bikeLon || isNaN(bikeLat) || isNaN(bikeLon)) {
                        return false;
                    }

                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        bikeLat,
                        bikeLon
                    );

                    return distance <= MAX_DISTANCE_KM;
                });

                setBikesData(nearbyBikes);
                setIsFiltered(false);
            } else {
                setBikesData([]);
            }
        } catch (err) {
            setError(err.message || 'Something went wrong');
            setBikesData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Handle pull-to-refresh
     */
    const onRefresh = () => {
        setRefreshing(true);
        if (isFiltered && appliedFilters) {
            setTimeout(() => setRefreshing(false), 500);
        } else {
            fetchNearbyBikes(true, true); // Force refresh on pull-to-refresh
        }
    };

    /**
     * Check vehicle availability using the API
     */
    const checkVehicleAvailabilityAPI = async (vehicle, filterParams) => {
        try {
            const response = await getVehicleAvailability({
                VechileId: vehicle._id,
                vechileType: 'Bike',
                startDate: filterParams.fromDate,
                endDate: filterParams.toDate,
            });

            if (response?.availability && Array.isArray(response.availability)) {
                const hasUnavailableDate = response.availability.some(slot => {
                    return slot.dateStatus === 'Unavailable' || slot.dateStatus === 'Booked';
                });
                return !hasUnavailableDate;
            }

            return true;
        } catch (error) {
            return true;
        }
    };

    /**
     * Check for filtered results from route params
     */
    useEffect(() => {
        const filteredVehicles = route?.params?.filteredVehicles;
        const filters = route?.params?.appliedFilters;
        const filterTimestamp = route?.params?.filterTimestamp;

        // Check if we have NEW filtered vehicles from FilterScreen
        if (filteredVehicles && filters && filterTimestamp && filterTimestamp !== lastFilterTimestamp.current) {
            lastFilterTimestamp.current = filterTimestamp;
            setBikesData(filteredVehicles);
            setAppliedFilters(filters);
            setIsFiltered(true);
            setLoading(false);
            initialFetchDone.current = true;

            // Set filter info banner
            const filterSummary = getFilterSummary(filters);
            if (filterSummary) {
                setFilterInfo(`Filters Applied: ${filterSummary}`);
            }

            // Persist to global store
            persistedBikeFilterState = {
                bikesData: filteredVehicles,
                appliedFilters: filters,
                isFiltered: true,
                filterTimestamp: filterTimestamp,
            };
            return;
        }

        // If initial state already has filtered data, don't fetch
        if (initialState.isFiltered) {
            setLoading(false);
            return;
        }

        // If we already have cached data, show it immediately
        if (cachedBikes && cachedBikes.length > 0 && !initialFetchDone.current) {
            setBikesData(cachedBikes);
            initialFetchDone.current = true;
            setLoading(false);
            // Background refresh
            fetchNearbyBikes(true, false);
            return;
        }

        const filterByAvailability = route?.params?.filterByAvailability;
        const availabilityParams = {
            fromDate: route?.params?.fromDate,
            toDate: route?.params?.toDate,
            fromTime: route?.params?.fromTime,
            toTime: route?.params?.toTime,
        };

        // Check if we have availability filters
        if (filterByAvailability && availabilityParams.fromDate) {
            const filterBikes = async () => {
                await fetchNearbyBikes();

                setBikesData(currentBikes => {
                    (async () => {
                        const availabilityChecks = await Promise.all(
                            currentBikes.map(bike => checkVehicleAvailabilityAPI(bike, availabilityParams))
                        );
                        const filtered = currentBikes.filter((_, index) => availabilityChecks[index]);
                        setBikesData(filtered);
                        setIsFiltered(true);
                    })();
                    return currentBikes;
                });
            };
            filterBikes();
        } else if (!initialFetchDone.current) {
            // Only fetch on initial mount when no filters and no cached data
            fetchNearbyBikes();
            initialFetchDone.current = true;
        }
    }, [route?.params?.filterTimestamp, cachedBikes]);

    /**
     * Navigation handlers
     */
    const handleBikePress = (bike) => {
        navigation.navigate('BikeDetailsScreen', { bikeId: bike._id || bike.id });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleTabPress = (tabKey) => {
        navigation.navigate('DashBoard', { activeTab: tabKey });
    };

    // FOR NEARBY BIKES SCREEN:
    /**
     * Render bike item with distance calculation
     */
    const renderBikeCard = (bike, index) => {
        const imageSource = getSafeImageSource(
            bike.bikeImages || bike.BikeImages,
            require('../assets/Images/bike.png')
        );

        // Calculate distance from user location to bike location
        const location = getLocationForFiltering() || userLocation || {
            latitude: defaultLatitude,
            longitude: defaultLongitude
        };

        const bikeLat = parseFloat(bike.latitude || bike.pickupLatitude);
        const bikeLon = parseFloat(bike.longitude || bike.pickupLongitude);

        let distance = null;
        if (bikeLat && bikeLon && !isNaN(bikeLat) && !isNaN(bikeLon)) {
            distance = calculateDistance(
                location.latitude,
                location.longitude,
                bikeLat,
                bikeLon
            );
        }

        return (
            <BikeCard
                key={bike._id || `bike-${index}`}
                bike={{
                    _id: bike._id,
                    id: bike._id,
                    bikeName: bike.bikeName || bike.name,
                    name: bike.bikeName || bike.name || 'Bike',
                    rating: parseFloat(bike.averageRating || bike.rating) || 4.4,
                    averageRating: parseFloat(bike.averageRating || bike.rating) || 4.4,
                    speed: bike.maxSpeed || bike.topSpeed || '50 kmph',
                    mileage: bike.mileage || bike.Mileage || '50',
                    pricePerKm: bike.pricePerKm || bike.price || 0,
                    price: bike.pricePerKm || bike.price || 0,
                    image: imageSource,
                    bikeImages: bike.bikeImages || bike.BikeImages,
                    BikeImages: bike.bikeImages || bike.BikeImages,
                    location: bike.pickupCity || bike.pickupArea || bike.location || 'Location not available',
                    pickupCity: bike.pickupCity || 'Location not available',
                    pickupArea: bike.pickupArea || '',
                    distance: distance,
                }}
                onPress={() => handleBikePress(bike)}
            />
        );
    };
    // Combine loading states
    const isLoading = loading || loadingStates.nearbyBikes;

    /**
     * Render UI
     */
    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleBackPress}
                title="Nearby Bikes"
            />

            {filterInfo && (
                <Animated.View style={[styles.filterBanner, { opacity: filterBannerOpacity }]}>
                    <View style={styles.filterBannerContent}>
                        <Text style={styles.filterBannerText}>{filterInfo}</Text>
                    </View>
                </Animated.View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
            >
                {isLoading && !refreshing && bikesData.length === 0 && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator
                            size="large"
                            color={Colors.primary}
                        />
                        <Text style={styles.loadingText}>
                            Loading...
                        </Text>
                    </View>
                )}

                {error && !isLoading && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text
                            style={styles.retryText}
                            onPress={() => fetchNearbyBikes(false, true)}
                        >
                            Try Again
                        </Text>
                    </View>
                )}

                {!isLoading && !error && bikesData.length === 0 && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.noDataText}>
                            {isFiltered ? 'No bikes available' : 'No nearby bikes found'}
                        </Text>
                        <Text style={styles.noDataSubtext}>
                            {isFiltered
                                ? 'Try adjusting your filter criteria'
                                : 'Try adjusting your search radius'
                            }
                        </Text>
                    </View>
                )}

                {!error && bikesData.map(renderBikeCard)}
            </ScrollView>

            <NavBar activeTab={activeTab} setActiveTab={handleTabPress} />
        </View>
    );
};

export default NearbyBikeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    filterBar: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        gap: Spacing.md,
    },
    filterButton: {
        flex: 1,
    },
    clearButton: {
        flex: 1,
    },
    filterIndicatorText: {
        color: Colors.primary || '#141248',
        fontSize: 13,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
        marginTop: Spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 155,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        paddingHorizontal: Spacing.lg,
    },
    loadingText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 12,
    },
    errorText: {
        textAlign: 'center',
        color: Colors.error || '#E53935',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    retryText: {
        textAlign: 'center',
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textDecorationLine: 'underline',
    },
    noDataText: {
        textAlign: 'center',
        color: Colors.textPrimary || '#333',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    noDataSubtext: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    filterBanner: {
        backgroundColor: Colors.primary || '#FFD34D',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    filterBannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterBannerText: {
        color: Colors.textPrimary || '#111827',
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
});
