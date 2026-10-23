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
import CarCard from '../components/Rental/CarCard';
import { getSafeImageSource } from '../config/apiConfig';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';
import { useDataCache } from '../context/DataCacheContext';
import NavBar from '../navigations/NavBar';
import { getFilterSummary } from '../utils/filterFormatter';
import { calculateDistance, getCurrentLocation } from '../utils/location';
import { clearPersistedFilterData } from './FilterScreen';
import { clearPersistedBikeFilterState } from './NearbyBikeScreen';

// Global store to persist filter state across navigations
let persistedCarFilterState = {
    carsData: null,
    appliedFilters: null,
    isFiltered: false,
    filterTimestamp: null,
};

// Export function to clear persisted car filter state (called from FilterScreen)
export const clearPersistedCarFilterState = () => {
    persistedCarFilterState = {
        carsData: null,
        appliedFilters: null,
        isFiltered: false,
        filterTimestamp: null,
    };
};

const NearbyCarsScreen = ({ navigation, route }) => {
    // Use cached data from context
    const { nearbyCars: cachedCars, fetchNearbyCars: fetchCachedCars, loadingStates, initialLoadDone } = useDataCache();

    // Check if we're coming with new filtered data from FilterScreen
    const hasNewFilteredData = route?.params?.filteredVehicles && route?.params?.filterTimestamp;

    // Determine initial state based on route params or persisted state
    const getInitialState = () => {
        // If coming with new filtered data, use it
        if (hasNewFilteredData) {
            return {
                carsData: route.params.filteredVehicles,
                isFiltered: true,
                appliedFilters: route.params.appliedFilters,
                filterTimestamp: route.params.filterTimestamp,
                loading: false,
            };
        }
        // If we have persisted filtered state, use it
        if (persistedCarFilterState.isFiltered && persistedCarFilterState.carsData) {
            return {
                carsData: persistedCarFilterState.carsData,
                isFiltered: true,
                appliedFilters: persistedCarFilterState.appliedFilters,
                filterTimestamp: persistedCarFilterState.filterTimestamp,
                loading: false,
            };
        }
        // Use cached data if available
        if (cachedCars && cachedCars.length > 0) {
            return {
                carsData: cachedCars,
                isFiltered: false,
                appliedFilters: null,
                filterTimestamp: null,
                loading: false,
            };
        }
        // Default: no filters, need to fetch
        return {
            carsData: [],
            isFiltered: false,
            appliedFilters: null,
            filterTimestamp: null,
            loading: !initialLoadDone.nearbyCars,
        };
    };

    const initialState = getInitialState();

    const [activeTab, setActiveTab] = useState("Rental");
    const [carsData, setCarsData] = useState(initialState.carsData);
    const [loading, setLoading] = useState(initialState.loading);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [isFiltered, setIsFiltered] = useState(initialState.isFiltered);
    const [userLocation, setUserLocation] = useState(null);
    const [appliedFilters, setAppliedFilters] = useState(initialState.appliedFilters);
    const [filterInfo, setFilterInfo] = useState(null);
    const filterBannerOpacity = useRef(new Animated.Value(1)).current;
    // Track if initial fetch has been done to prevent re-fetching after filter
    const initialFetchDone = useRef(initialState.isFiltered || (cachedCars && cachedCars.length > 0));
    // Track the last processed filter timestamp to avoid re-processing
    const lastFilterTimestamp = useRef(initialState.filterTimestamp);

    // Get selected address from route params (passed from RentalScreen/Dashboard)
    const selectedAddress = route?.params?.selectedAddress;

    // Default location (Hyderabad) - fallback if location permission denied
    const defaultLatitude = 17.4417;
    const defaultLongitude = 78.4416;
    const MAX_DISTANCE_KM = 10; // Only show vehicles within 10km

    // Update local state when cached data changes
    useEffect(() => {
        if (!isFiltered && cachedCars && cachedCars.length > 0 && !loading) {
            setCarsData(cachedCars);
        }
    }, [cachedCars, isFiltered]);

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

    // Key changes in getUserLocation function:
    // Replace the existing getUserLocation function with this one

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

    // In the fetchNearbyCars function, add this check after getting location:
    const fetchNearbyCars = async (isRefreshing = false, forceRefresh = false) => {
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
                setError('Location access required to show nearby cars');
                setCarsData([]);
                return;
            }

            const params = {
                latitude: location.latitude,
                longitude: location.longitude,
                range: MAX_DISTANCE_KM,
            };

            // Use cached fetch which handles caching automatically
            const cars = await fetchCachedCars(params, forceRefresh || isRefreshing);

            if (cars && Array.isArray(cars)) {
                // Filter by distance and status
                const nearbyCars = cars.filter(car => {
                    const status = (car.status || car.Status || '').toLowerCase().trim();
                    if (status && status !== 'verified' && status !== 'approved') {
                        return false;
                    }

                    const carLat = parseFloat(car.pickupLatitude || car.latitude);
                    const carLon = parseFloat(car.pickupLongitude || car.longitude);
                    if (!carLat || !carLon || isNaN(carLat) || isNaN(carLon)) {
                        return false;
                    }

                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        carLat,
                        carLon
                    );

                    return distance <= MAX_DISTANCE_KM;
                });

                setCarsData(nearbyCars);
                setIsFiltered(false);
            } else {
                setCarsData([]);
            }
        } catch (err) {
            setError(err.message || 'Failed to load nearby cars');
            setCarsData([]);
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
            fetchNearbyCars(true, true); // Force refresh on pull-to-refresh
        }
    };

    /**
     * Check vehicle availability using the API
     */
    const checkVehicleAvailabilityAPI = async (vehicle, filterParams) => {
        try {
            const response = await getVehicleAvailability({
                VechileId: vehicle._id,
                vechileType: 'Car',
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
            setCarsData(filteredVehicles);
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
            persistedCarFilterState = {
                carsData: filteredVehicles,
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
        if (cachedCars && cachedCars.length > 0 && !initialFetchDone.current) {
            setCarsData(cachedCars);
            initialFetchDone.current = true;
            setLoading(false);
            // Background refresh
            fetchNearbyCars(true, false);
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
            const filterCars = async () => {
                await fetchNearbyCars();

                setCarsData(currentCars => {
                    (async () => {
                        const availabilityChecks = await Promise.all(
                            currentCars.map(car => checkVehicleAvailabilityAPI(car, availabilityParams))
                        );
                        const filtered = currentCars.filter((_, index) => availabilityChecks[index]);
                        setCarsData(filtered);
                        setIsFiltered(true);
                    })();
                    return currentCars;
                });
            };
            filterCars();
        } else if (!initialFetchDone.current) {
            // Only fetch on initial mount when no filters and no cached data
            fetchNearbyCars();
            initialFetchDone.current = true;
        }
    }, [route?.params?.filterTimestamp, cachedCars]);

    /**
     * Navigation handlers
     */
    const handleCarPress = (car) => {
        navigation.navigate('CarDetailsScreen', { carId: car._id || car.id });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleTabPress = (tabKey) => {
        navigation.navigate('DashBoard', { activeTab: tabKey });
    };



    /**
     * Clear Filters - clears ALL filter selections and resets filter screen state
     */
    const handleClearFilters = () => {
        // Same as Remove Filter but also clears FilterScreen state
        setIsFiltered(false);
        setAppliedFilters(null);
        lastFilterTimestamp.current = null;
        initialFetchDone.current = false;

        // Clear persisted state for this screen
        persistedCarFilterState = {
            carsData: null,
            appliedFilters: null,
            isFiltered: false,
            filterTimestamp: null,
        };

        // Clear FilterScreen and NearbyBikeScreen persisted data too
        clearPersistedFilterData();
        clearPersistedBikeFilterState();

        fetchNearbyCars(false, true); // Force refresh
    };

    /**
     * Render car item
     */
    /**
 * Render car item with distance calculation
 */
    const renderCarCard = (car, index) => {
        const imageSource = getSafeImageSource(
            car.carImages || car.CarImages,
            require('../assets/Images/car.png')
        );

        // Calculate distance from user location to car location
        const location = getLocationForFiltering() || userLocation || {
            latitude: defaultLatitude,
            longitude: defaultLongitude
        };

        const carLat = parseFloat(car.pickupLatitude || car.latitude);
        const carLon = parseFloat(car.pickupLongitude || car.longitude);

        let distance = null;
        if (carLat && carLon && !isNaN(carLat) && !isNaN(carLon)) {
            distance = calculateDistance(
                location.latitude,
                location.longitude,
                carLat,
                carLon
            );
        }

        return (
            <CarCard
                key={car._id || `car-${index}`}
                car={{
                    _id: car._id,
                    id: car._id,
                    name: car.CarName || car.name,
                    rating: parseFloat(car.averageRating || car.rating) || 4.4,
                    transmission: car.transmissionType || car.transmission || 'Manual',
                    seats: car.Carseater || car.seats || 4,
                    fuel: car.fuelType || car.fuel || 'Petrol',
                    price: car.RentPerDay || car.price || 0,
                    image: imageSource,
                    carImages: car.carImages || car.CarImages,
                    CarImages: car.carImages || car.CarImages,
                    location: car.pickupCity || car.location || 'Location not available',
                    distance: distance,
                }}
                onPress={() => handleCarPress(car)}
            />
        );
    };
    // Combine loading states
    const isLoading = loading || loadingStates.nearbyCars;

    /**
     * Render UI
     */
    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleBackPress}
                title="Nearby Cars"
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
                {isLoading && !refreshing && carsData.length === 0 && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator
                            size="large"
                            color={Colors.primary}
                        />
                        <Text style={styles.loadingText}>
                            Loading
                        </Text>
                    </View>
                )}

                {error && !isLoading && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text
                            style={styles.retryText}
                            onPress={() => fetchNearbyCars(false, true)}
                        >
                            Try Again
                        </Text>
                    </View>
                )}

                {!isLoading && !error && carsData.length === 0 && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.noDataText}>
                            {isFiltered ? 'No vehicles available' : 'No vehicles available'}
                        </Text>
                        <Text style={styles.noDataSubtext}>
                            {isFiltered
                                ? 'Try adjusting your filters'
                                : 'No location data available'
                            }
                        </Text>
                    </View>
                )}

                {!error && carsData.map(renderCarCard)}
            </ScrollView>

            <NavBar activeTab={activeTab} setActiveTab={handleTabPress} />
        </View>
    );
};

export default NearbyCarsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
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
