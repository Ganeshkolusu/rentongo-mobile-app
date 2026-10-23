import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import BikeSection from '../../components/Rental/BikeSection';
import CarsSection from '../../components/Rental/CarsSection';
import DateTimeSelector from '../../components/Rental/DateTimeSelector';
import ImageSlider from '../../components/Rental/ImageSlider';
import VehicleTypeCard from '../../components/Rental/VehicleTypeCard';
import {
    API_ENDPOINTS,
    fetchData,
    getSafeImageSource
} from '../../config/apiConfig';
import { Colors } from '../../constants/Colors';
import { getFilterSummary } from '../../utils/filterFormatter';
import { calculateDistance, getCurrentLocation } from '../../utils/location';

const RentalScreen = ({ navigation, route, searchText = '', selectedAddress }) => {
    const MAX_DISTANCE_KM = 50; // Show vehicles within 50km to display more options

    // Check if we have availability filters from DateTimeMyBookingsScreen
    const filterByAvailability = route?.params?.filterByAvailability || false;
    const availabilityParams = {
        fromDate: route?.params?.fromDate,
        toDate: route?.params?.toDate,
        fromTime: route?.params?.fromTime,
        toTime: route?.params?.toTime,
    };

    const [selectedDate, setSelectedDate] = useState('2024-12-15');
    const [selectedTime, setSelectedTime] = useState('10:00 AM');
    const [selectedType, setSelectedType] = useState('car');

    // API states
    const [carsData, setCarsData] = useState([]);
    const [bikesData, setBikesData] = useState([]);
    const [allCarsData, setAllCarsData] = useState([]);
    const [allBikesData, setAllBikesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [filterInfo, setFilterInfo] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState(null);
    const filterBannerOpacity = useRef(new Animated.Value(1)).current;

    // Show More/Less state
    const [showAllCars, setShowAllCars] = useState(false);
    const [showAllBikes, setShowAllBikes] = useState(false);

    /**
     * Validate if coordinates are realistic (within India)
     * Expanded bounds to cover all of India
     */
    const isValidIndiaCoordinates = (lat, lon) => {
        const regionBounds = {
            minLat: 6.0,   // Southern tip of India
            maxLat: 36.0,  // Northern India
            minLon: 68.0,  // Western India
            maxLon: 98.0   // Eastern India
        };

        return lat >= regionBounds.minLat &&
            lat <= regionBounds.maxLat &&
            lon >= regionBounds.minLon &&
            lon <= regionBounds.maxLon;
    };

    // Use selected address location if available, otherwise use GPS
    const getLocationForFiltering = () => {
        if (selectedAddress?.latitude && selectedAddress?.longitude) {
            return {
                latitude: selectedAddress.latitude,
                longitude: selectedAddress.longitude
            };
        }
        return userLocation;
    };

    useEffect(() => {
        // Check for applied filters from FilterScreen
        const filteredVehicles = route?.params?.filteredVehicles;
        const appliedFiltersFromRoute = route?.params?.appliedFilters;

        if (Array.isArray(filteredVehicles) && appliedFiltersFromRoute) {
            // Use filtered vehicles directly instead of fetching
            const filteredCars = filteredVehicles.filter(v => !v.bikeName);
            const filteredBikes = filteredVehicles.filter(v => v.bikeName);

            // Transform Cars Data
            const transformedCars = filteredCars.map(car => ({
                ...car, // Preserve all original fields
                id: car._id || car.id,
                name: car.CarName || car.name,
                rating: parseFloat(car.averageRating || car.rating) || 0,
                transmission: car.transmissionType || car.transmission,
                seats: car.Carseater || car.seats,
                fuel: car.fuelType || car.fuel,
                location: car.pickupCity || car.location,
                price: car.RentPerDay || car.price,
                distance: car._calculatedDistance || car.distance,
                image: getSafeImageSource(
                    car.carImages || car.CarImages,
                    require('../../assets/Images/car.png')
                ),
                carImages: car.carImages || car.CarImages,
                CarImages: car.carImages || car.CarImages,
            }));

            // Transform Bikes Data
            const transformedBikes = filteredBikes.map(bike => ({
                ...bike, // Preserve all original fields
                id: bike._id || bike.id,
                name: bike.bikeName || bike.name,
                rating: parseFloat(bike.averageRating || bike.rating) || 0,
                seats: '2',
                fuel: 'Petrol',
                location: bike.pickupCity || bike.pickupArea || 'Location not available',
                price: bike.pricePerKm || bike.price,
                distance: bike._calculatedDistance || bike.distance,
                image: getSafeImageSource(
                    bike.bikeImages || bike.BikeImages,
                    require('../../assets/Images/bike.png')
                ),
                bikeImages: bike.bikeImages || bike.BikeImages,
                BikeImages: bike.bikeImages || bike.BikeImages,
            }));

            setCarsData(transformedCars.slice(0, 5));
            setBikesData(transformedBikes.slice(0, 5));
            setAllCarsData(transformedCars);
            setAllBikesData(transformedBikes);

            setAppliedFilters(appliedFiltersFromRoute);
            const filterSummary = getFilterSummary(appliedFiltersFromRoute);
            if (filterSummary) {
                setFilterInfo(`Filters Applied: ${filterSummary}`);
            }
            setLoading(false);
            return; // Don't fetch, use filtered data
        }

        // Original logic for availability filters
        if (filterByAvailability && availabilityParams.fromDate) {
            setFilterInfo(`Showing vehicles available from ${availabilityParams.fromDate} to ${availabilityParams.toDate}`);
        } else if (!appliedFiltersFromRoute) {
            setFilterInfo(null);
            setAppliedFilters(null);
        }

        // Only fetch vehicles if we have a selected address (permissions granted and location ready)
        if (selectedAddress?.latitude && selectedAddress?.longitude) {
            fetchVehicles();
        } else {
            // No location yet - stop loading and wait for location
            setLoading(false);
        }
    }, [filterByAvailability, availabilityParams.fromDate, route?.params?.appliedFilters, route?.params?.filteredVehicles, selectedAddress]);

    // Refetch vehicles when selected address changes
    useEffect(() => {
        if (selectedAddress?.latitude && selectedAddress?.longitude) {
            // When location changes, we need to clear the filtered state
            // because the filtered vehicles were based on the previous location
            // and distance calculations are now invalid
            if (appliedFilters) {
                setAppliedFilters(null);
                setFilterInfo(null);
            }

            // Clear the filtered vehicle data that came from route params
            // This forces a fresh fetch for the new location
            setCarsData([]);
            setBikesData([]);
            setAllCarsData([]);
            setAllBikesData([]);

            fetchVehicles();
        }
    }, [selectedAddress?.latitude, selectedAddress?.longitude]);

    // Filter vehicles based on search text
    useEffect(() => {
        if (!searchText || searchText.trim() === '') {
            // When search is cleared, show only first 5 vehicles
            setCarsData(allCarsData.slice(0, 5));
            setBikesData(allBikesData.slice(0, 5));
            return;
        }

        const searchLower = searchText.toLowerCase().trim();

        const filteredCars = allCarsData.filter(car =>
            car.name?.toLowerCase().includes(searchLower)
        );

        const filteredBikes = allBikesData.filter(bike =>
            bike.name?.toLowerCase().includes(searchLower)
        );

        // Limit search results to 5 vehicles as well
        setCarsData(filteredCars.slice(0, 5));
        setBikesData(filteredBikes.slice(0, 5));
    }, [searchText, allCarsData, allBikesData]);

    /**
     * Check if date range overlaps with any booking/unavailable slot
     */
    const isVehicleAvailable = (vehicle, filterParams) => {
        if (!filterParams.fromDate || !filterParams.toDate) {
            return true; // No filter, show all
        }

        // Parse filter dates
        const filterStart = new Date(filterParams.fromDate);
        const filterEnd = new Date(filterParams.toDate);

        // Check bookings
        const bookings = vehicle.bookings || [];
        for (const booking of bookings) {
            const bookingStart = new Date(booking.fromDate || booking.startDate);
            const bookingEnd = new Date(booking.toDate || booking.endDate);

            // Check for overlap
            if (filterStart <= bookingEnd && filterEnd >= bookingStart) {
                return false; // Overlaps with booking
            }
        }

        // Check not-available slots
        const notAvailableSlots = vehicle.notAvailableSlots || vehicle.unavailableSlots || [];
        for (const slot of notAvailableSlots) {
            const slotStart = new Date(slot.fromDate);
            const slotEnd = new Date(slot.toDate);

            // Check for overlap
            if (filterStart <= slotEnd && filterEnd >= slotStart) {
                return false; // Overlaps with unavailable period
            }
        }

        return true; // No conflicts
    };

    /**
     * Get user's current location - NO FALLBACK
     */
    const getUserLocation = async () => {
        try {
            const location = await getCurrentLocation();
            setUserLocation(location);
            setLocationError(false);
            return location;
        } catch (error) {
            setUserLocation(null);
            setLocationError(true);
            throw error; // Throw error instead of returning fallback
        }
    };

    /**
     * Fetch cars and filter by 50km distance
     */
    const fetchCars = async () => {
        try {
            // Priority: selectedAddress > userLocation > GPS
            let location = getLocationForFiltering();
            if (!location) {
                location = await getUserLocation();
            }

            // If still no location, don't fetch
            if (!location) {
                setAllCarsData([]);
                setCarsData([]);
                return;
            }

            const data = await fetchData(API_ENDPOINTS.GET_NEARBY_CARS, {
                latitude: location.latitude,
                longitude: location.longitude,
                range: MAX_DISTANCE_KM,
            });

            if (data.success && Array.isArray(data.cars)) {
                // Filter cars by distance and status
                let validCars = [];

                data.cars.forEach(car => {
                    // 1. Check status - accept verified, approved, active, or no status
                    const status = (car.status || car.Status || '').toLowerCase().trim();
                    const validStatuses = ['verified', 'approved', 'active', ''];
                    if (status && !validStatuses.includes(status)) {
                        return;
                    }

                    // 2. Extract coordinates - Cars use pickupLatitude/pickupLongitude
                    const carLat = parseFloat(car.pickupLatitude || car.latitude);
                    const carLon = parseFloat(car.pickupLongitude || car.longitude);

                    // 3. Validate coordinates exist and are numbers
                    if (!carLat || !carLon || isNaN(carLat) || isNaN(carLon)) {
                        return;
                    }

                    // 4. Check if coordinates are realistic (not default 0,0)
                    if (carLat === 0 && carLon === 0) {
                        return;
                    }

                    // 5. Validate coordinates are in expected region (India)
                    if (!isValidIndiaCoordinates(carLat, carLon)) {
                        return;
                    }

                    // 6. Calculate distance
                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        carLat,
                        carLon
                    );

                    // 7. Check if within range
                    if (distance <= MAX_DISTANCE_KM) {
                        validCars.push({ ...car, calculatedDistance: distance });
                    }
                });

                // Filter by availability if filter is active
                if (filterByAvailability && availabilityParams.fromDate) {
                    validCars = validCars.filter(car => isVehicleAvailable(car, availabilityParams));
                }

                // Transform and add distance to each car
                const transformedCars = validCars.map(car => ({
                    id: car._id,
                    name: car.CarName,
                    rating: parseFloat(car.averageRating) || 0,
                    transmission: car.transmissionType,
                    seats: car.Carseater,
                    fuel: car.fuelType,
                    location: car.pickupCity,
                    price: car.RentPerDay,
                    distance: car.calculatedDistance,
                    image: getSafeImageSource(
                        car.carImages,
                        require('../../assets/Images/car.png')
                    ),
                    carImages: car.carImages,
                    CarImages: car.carImages,
                }));

                // Sort by distance (closest first)
                transformedCars.sort((a, b) => a.distance - b.distance);

                setAllCarsData(transformedCars);
                setCarsData(transformedCars.slice(0, 5));
            } else {
                setAllCarsData([]);
                setCarsData([]);
            }
        } catch (err) {
            throw err;
        }
    };

    /**
     * Fetch bikes and filter by 50km distance
     */
    const fetchBikes = async () => {
        try {
            // Priority: selectedAddress > userLocation > GPS
            let location = getLocationForFiltering();
            if (!location) {
                location = await getUserLocation();
            }

            // If still no location, don't fetch
            if (!location) {
                setAllBikesData([]);
                setBikesData([]);
                return;
            }

            const data = await fetchData(API_ENDPOINTS.GET_NEARBY_BIKES, {
                latitude: location.latitude,
                longitude: location.longitude,
                range: MAX_DISTANCE_KM,
            });

            if (data.success && Array.isArray(data.bikes)) {
                // Filter bikes by distance and status
                let validBikes = [];

                data.bikes.forEach(bike => {
                    // 1. Check status - accept verified, approved, active, or no status
                    const status = (bike.Status || bike.status || '').toLowerCase().trim();
                    const validStatuses = ['verified', 'approved', 'active', ''];
                    if (status && !validStatuses.includes(status)) {
                        return;
                    }

                    // 2. Extract coordinates - Bikes use latitude/longitude directly
                    const bikeLat = parseFloat(bike.latitude || bike.pickupLatitude);
                    const bikeLon = parseFloat(bike.longitude || bike.pickupLongitude);

                    // 3. Validate coordinates exist and are numbers
                    if (!bikeLat || !bikeLon || isNaN(bikeLat) || isNaN(bikeLon)) {
                        return;
                    }

                    // 4. Check if coordinates are realistic (not default 0,0)
                    if (bikeLat === 0 && bikeLon === 0) {
                        return;
                    }

                    // 5. Validate coordinates are in expected region (India)
                    if (!isValidIndiaCoordinates(bikeLat, bikeLon)) {
                        return;
                    }

                    // 6. Calculate distance
                    const distance = calculateDistance(
                        location.latitude,
                        location.longitude,
                        bikeLat,
                        bikeLon
                    );

                    // 7. Check if within range
                    if (distance <= MAX_DISTANCE_KM) {
                        validBikes.push({ ...bike, calculatedDistance: distance });
                    }
                });

                // Filter by availability if filter is active
                if (filterByAvailability && availabilityParams.fromDate) {
                    validBikes = validBikes.filter(bike => isVehicleAvailable(bike, availabilityParams));
                }

                // Transform and add distance to each bike
                const transformedBikes = validBikes.map(bike => ({
                    id: bike._id,
                    name: bike.bikeName,
                    rating: parseFloat(bike.averageRating) || 0,
                    seats: '2',
                    fuel: 'Petrol',
                    location: bike.pickupCity || bike.pickupArea || 'Location not available',
                    price: bike.pricePerKm,
                    distance: bike.calculatedDistance,
                    image: getSafeImageSource(
                        bike.bikeImages,
                        require('../../assets/Images/bike.png')
                    ),
                    bikeImages: bike.bikeImages,
                    BikeImages: bike.bikeImages,
                }));

                // Sort by distance (closest first)
                transformedBikes.sort((a, b) => a.distance - b.distance);

                setAllBikesData(transformedBikes);
                setBikesData(transformedBikes.slice(0, 5));
            } else {
                setAllBikesData([]);
                setBikesData([]);
            }
        } catch (err) {
            throw err;
        }
    };

    const fetchVehicles = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            setError(null);

            await Promise.all([fetchCars(), fetchBikes()]);

        } catch (err) {
            if (err.message?.includes('location') || locationError) {
                setError('Location access required to show nearby vehicles');
            } else {
                setError('Failed to load vehicles');
            }
            // Don't set fallback data - keep arrays empty
            setAllCarsData([]);
            setCarsData([]);
            setAllBikesData([]);
            setBikesData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        // Don't refresh if filters are applied - maintain filtered view
        if (appliedFilters) {
            setTimeout(() => setRefreshing(false), 500);
        } else {
            // Only fetch new data if no filters are applied
            fetchVehicles(true);
        }
    };

    const handleDateChange = (date) => setSelectedDate(date);
    const handleTimeChange = (time) => setSelectedTime(time);
    const handleVehicleTypeSelect = (type) => {
        setSelectedType(type);
        // Reset show more state when switching vehicle types
        setShowAllCars(false);
        setShowAllBikes(false);
    };

    // Toggle Show More/Less handlers
    const handleToggleShowAllCars = () => {
        setShowAllCars(prev => !prev);
    };

    const handleToggleShowAllBikes = () => {
        setShowAllBikes(prev => !prev);
    };

    const handleCarPress = (car) => {
        const parentNav = navigation.getParent() || navigation;
        parentNav.navigate('CarDetailsScreen', { carId: car.id });
    };

    const handleBikePress = (bike) => {
        const parentNav = navigation.getParent() || navigation;
        parentNav.navigate('BikeDetailsScreen', { bikeId: bike.id });
    };

    const handleViewAllCars = () => {
        // Pass filtered data and applied filters to NearbyCarsScreen
        const params = {
            filterByAvailability,
            ...availabilityParams,
            selectedAddress: selectedAddress,
            userLocation: userLocation,
        };

        // If filters are applied, pass the filtered vehicles
        if (appliedFilters && allCarsData.length > 0) {
            params.filteredVehicles = allCarsData;
            params.appliedFilters = appliedFilters;
            params.filterTimestamp = Date.now();
        }

        navigation.navigate('NearbyCarsScreen', params);
    };

    const handleViewAllBikes = () => {
        // Pass filtered data and applied filters to NearbyBikeScreen
        const params = {
            filterByAvailability,
            ...availabilityParams,
            selectedAddress: selectedAddress,
            userLocation: userLocation,
        };

        // If filters are applied, pass the filtered vehicles
        if (appliedFilters && allBikesData.length > 0) {
            params.filteredVehicles = allBikesData;
            params.appliedFilters = appliedFilters;
            params.filterTimestamp = Date.now();
        }

        navigation.navigate('NearbyBikeScreen', params);
    };

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[Colors.primary]}
                    tintColor={Colors.primary}
                />
            }
        >
            {/* Image Slider */}
            <ImageSlider />

            {/* Location Warning Banner */}
            {locationError && (
                <View style={styles.locationWarningBanner}>
                    <Text style={styles.locationWarningText}>
                        📍 Location access required. Please enable location permissions to view nearby vehicles.
                    </Text>
                </View>
            )}

            {/* Filter Info Banner */}
            {filterInfo && (
                <Animated.View style={[styles.filterBanner, { opacity: filterBannerOpacity }]}>
                    <View style={styles.filterBannerContent}>
                        <Text style={styles.filterBannerText}>{filterInfo}</Text>
                    </View>
                </Animated.View>
            )}

            {/* Vehicle Type Selector */}
            <VehicleTypeCard
                selectedType={selectedType}
                onSelect={handleVehicleTypeSelect}
            />

            {/* Date Time Selector */}
            <DateTimeSelector
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onDateChange={handleDateChange}
                onTimeChange={handleTimeChange}
            />

            {loading && !refreshing && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Finding vehicles near you...</Text>
                </View>
            )}

            {error && !loading && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <Text
                        style={styles.retryText}
                        onPress={() => fetchVehicles()}
                    >
                        Try Again
                    </Text>
                </View>
            )}

            {!loading && !locationError && selectedType === 'car' && (
                <>
                    {allCarsData.length > 0 ? (
                        <CarsSection
                            cars={showAllCars ? allCarsData : allCarsData.slice(0, 5)}
                            onViewAll={handleViewAllCars}
                            onCarPress={handleCarPress}
                            showAll={showAllCars}
                            onToggleShowAll={handleToggleShowAllCars}
                            totalCount={allCarsData.length}
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>
                                {filterByAvailability
                                    ? `No cars available for selected dates within ${MAX_DISTANCE_KM}km`
                                    : `No cars found within ${MAX_DISTANCE_KM}km of your location`}
                            </Text>
                        </View>
                    )}
                </>
            )}
            {!loading && !locationError && selectedType === 'bike' && (
                <>
                    {allBikesData.length > 0 ? (
                        <BikeSection
                            bikes={showAllBikes ? allBikesData : allBikesData.slice(0, 5)}
                            onViewAll={handleViewAllBikes}
                            onBikePress={handleBikePress}
                            showAll={showAllBikes}
                            onToggleShowAll={handleToggleShowAllBikes}
                            totalCount={allBikesData.length}
                        />
                    ) : (
                        <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>
                                {filterByAvailability
                                    ? `No bikes available for selected dates within ${MAX_DISTANCE_KM}km`
                                    : `No bikes found within ${MAX_DISTANCE_KM}km of your location`}
                            </Text>
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
};

export default RentalScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollContent: {
        paddingBottom: 130,
    },
    locationWarningBanner: {
        backgroundColor: '#FFE5E5',
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#FF5252',
    },
    locationWarningText: {
        color: '#C62828',
        fontSize: 14,
        fontWeight: '600',
        lineHeight: 20,
    },
    filterBanner: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#4CAF50',
    },
    filterBannerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    filterBannerText: {
        flex: 1,
        color: '#2E7D32',
        fontSize: 14,
        fontWeight: '500',
    },
    clearFilterText: {
        color: '#1976D2',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
        marginLeft: 8,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        marginTop: 10,
        color: Colors.gray,
        fontSize: 14,
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 30,
        paddingHorizontal: 20,
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
    noDataContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    noDataText: {
        textAlign: 'center',
        color: Colors.gray,
        fontSize: 14,
        lineHeight: 20,
    },
});