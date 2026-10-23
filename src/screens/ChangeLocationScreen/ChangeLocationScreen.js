import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button/Button';
import Header from '../../components/Header/Header';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

// Using free OpenStreetMap Nominatim API - no billing required
const ChangeLocationScreen = ({ navigation, route }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [isLoadingCurrentLocation, setIsLoadingCurrentLocation] = useState(false);

    useEffect(() => {
        loadSavedAddresses();
        if (route.params?.selectedLocation) {
            const location = route.params.selectedLocation;
            setSelectedLocation(location.name || location.address);
            saveAddressToList(location);
        }
    }, [route.params?.selectedLocation]);

    const loadSavedAddresses = async () => {
        try {
            const savedData = await AsyncStorage.getItem('recentAddresses');
            if (savedData) {
                const addresses = JSON.parse(savedData);
                setSavedAddresses(addresses);
            }
        } catch (error) {
            // Error loading saved addresses
        }
    };

    const saveAddressToList = async (location) => {
        try {
            const newAddress = {
                id: Date.now().toString(),
                name: location.name || location.address || location.area,
                fullAddress: location.address || location.fullAddress || location.name,
                area: location.area || '',
                city: location.city || '',
                pincode: location.pincode || '',
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: new Date().toISOString(),
            };

            // Check if address already exists
            const existingIndex = savedAddresses.findIndex(addr =>
                addr.name === newAddress.name ||
                (addr.latitude === newAddress.latitude && addr.longitude === newAddress.longitude)
            );

            let updatedAddresses;
            if (existingIndex >= 0) {
                // Move existing address to top
                updatedAddresses = [
                    savedAddresses[existingIndex],
                    ...savedAddresses.filter((_, index) => index !== existingIndex)
                ];
            } else {
                // Add new address to top
                updatedAddresses = [newAddress, ...savedAddresses];
            }

            // Limit to 10 addresses
            const limitedAddresses = updatedAddresses.slice(0, 10);
            setSavedAddresses(limitedAddresses);

            // Save to AsyncStorage
            await AsyncStorage.setItem('recentAddresses', JSON.stringify(limitedAddresses));
        } catch (error) {
            // Error saving address
        }
    };

    const searchLocation = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            setShowSearchResults(false);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        setShowSearchResults(true);
        try {
            const cleanQuery = query.trim();

            // Use OpenStreetMap Nominatim API - 100% FREE, no billing
            const searchUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQuery)}&countrycodes=in&format=json&addressdetails=1&limit=15`;

            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'RentonGoVehicle/1.0',
                    'Accept-Language': 'en',
                },
            });
            const data = await response.json();

            if (data && data.length > 0) {
                const formattedResults = data.map(place => {
                    const address = place.address || {};
                    const displayName = place.display_name || '';
                    const parts = displayName.split(', ');

                    // Extract meaningful name
                    const name = place.name || address.amenity || address.building ||
                                 address.road || address.neighbourhood || parts[0] || '';

                    // Extract area/locality
                    const area = address.suburb || address.neighbourhood ||
                                 address.locality || address.village || '';

                    // Extract city
                    const city = address.city || address.town ||
                                 address.district || address.county || '';

                    // Extract state
                    const state = address.state || '';

                    // Extract pincode
                    const pincode = address.postcode || '';

                    return {
                        id: place.place_id?.toString() || Date.now().toString(),
                        name: displayName,
                        shortName: name,
                        buildingName: name,
                        area: area,
                        city: city,
                        state: state,
                        pincode: pincode,
                        latitude: parseFloat(place.lat),
                        longitude: parseFloat(place.lon),
                        placeId: place.place_id?.toString(),
                        type: place.type || '',
                        category: place.class || '',
                    };
                });

                setSearchResults(formattedResults);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchTextChange = (text) => {
        setSearchText(text);
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        if (text.length >= 2) {
            setShowSearchResults(true);
            setIsSearching(true);
            const newTimeout = setTimeout(() => {
                searchLocation(text);
            }, 500);
            setSearchTimeout(newTimeout);
        } else {
            setShowSearchResults(false);
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const selectSearchResult = async (result) => {
        const displayName = result.buildingName || result.shortName || result.area || result.name;
        setSelectedLocation(displayName);
        setSearchText('');
        setShowSearchResults(false);
        setSearchResults([]);

        // OpenStreetMap already provides coordinates directly
        const latitude = result.latitude;
        const longitude = result.longitude;

        // Automatically navigate back with the selected location
        const selectedAddressData = {
            name: displayName,
            buildingName: result.buildingName || '',
            area: result.area || '',
            city: result.city || '',
            state: result.state || '',
            pincode: result.pincode || '',
            fullAddress: result.name || displayName,
            latitude: latitude || null,
            longitude: longitude || null,
            isCustomLocation: result.isCustomSearch || false,
        };

        await saveAddressToList(selectedAddressData);

        navigation.navigate({
            name: 'DashBoard',
            params: {
                selectedAddress: selectedAddressData,
                // Clear filter params so all vehicles are shown for new location
                filteredVehicles: undefined,
                appliedFilters: undefined,
                filterTimestamp: undefined,
            },
            merge: true,
        });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleLocationSelect = async (locationName, location = null) => {
        setSelectedLocation(locationName);
        if (location) {
            await saveAddressToList(location);
        }
    };

    const handleSave = () => {
        if (selectedLocation) {
            const selectedAddressData = savedAddresses.find(addr => addr.name === selectedLocation);
            const finalAddress = {
                name: selectedAddressData?.name || selectedAddressData?.shortName || selectedLocation,
                area: selectedAddressData?.area || selectedLocation,
                city: selectedAddressData?.city || '',
                pincode: selectedAddressData?.pincode || '',
                fullAddress: selectedAddressData?.fullAddress || selectedLocation,
                latitude: selectedAddressData?.latitude || null,
                longitude: selectedAddressData?.longitude || null,
            };
            navigation.navigate({
                name: 'DashBoard',
                params: {
                    selectedAddress: finalAddress,
                    // Clear filter params so all vehicles are shown for new location
                    filteredVehicles: undefined,
                    appliedFilters: undefined,
                    filterTimestamp: undefined,
                },
                merge: true,
            });
        } else {
            navigation.goBack();
        }
    };

    const handleMapPress = () => {
        navigation.navigate('MapPickerScreen');
    };

    const handleUseCurrentLocation = async () => {
        setIsLoadingCurrentLocation(true);
        try {
            const isLocationEnabled = await Location.hasServicesEnabledAsync();
            if (!isLocationEnabled) {
                alert('Please enable location services to use this feature.');
                setIsLoadingCurrentLocation(false);
                return;
            }

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Location permission is required to use this feature.');
                setIsLoadingCurrentLocation(false);
                return;
            }

            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
                maximumAge: 10000,
                timeout: 5000,
            });

            const { latitude, longitude } = position.coords;

            // Reverse geocode to get address
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            let locationName = 'Current Location';
            let area = '';
            let city = 'Hyderabad';
            let pincode = '';

            if (geocode && geocode.length > 0) {
                const place = geocode[0];
                locationName = place.name || place.street || 'Current Location';
                area = place.subregion || place.district || place.city || '';
                city = place.city || place.region || 'Hyderabad';
                pincode = place.postalCode || '';
            }

            const currentLocationData = {
                id: 'current_' + Date.now().toString(),
                name: locationName,
                fullAddress: `${locationName}, ${area}, ${city}${pincode ? ' - ' + pincode : ''}`,
                area: area,
                city: city,
                pincode: pincode,
                latitude: latitude,
                longitude: longitude,
                timestamp: new Date().toISOString(),
                isCurrentLocation: true,
            };

            // Save to recent addresses
            await saveAddressToList(currentLocationData);
            setSelectedLocation(locationName);

            // Navigate back to dashboard with the selected location
            navigation.navigate({
                name: 'DashBoard',
                params: {
                    selectedAddress: currentLocationData,
                    // Clear filter params so all vehicles are shown for new location
                    filteredVehicles: undefined,
                    appliedFilters: undefined,
                    filterTimestamp: undefined,
                },
                merge: true,
            });
        } catch (error) {
            alert('Unable to get your current location. Please try again.');
        } finally {
            setIsLoadingCurrentLocation(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header with Gradient */}
            <Header
                title={'Change Location'}
                onBackPress={handleBackPress}
            />

            {/* Content */}
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Choose Location Card - Contains Search, Current Location, and Map options */}
                <View style={styles.chooseLocationCard}>
                    <View style={styles.chooseLocationHeader}>
                        <Icon name="location" size={22} color="#4FC3F7" />
                        <Text style={styles.chooseLocationTitle}>Choose Location</Text>
                    </View>

                    {/* Search Input inside Card */}
                    <View style={styles.searchContainerInCard}>
                        <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInputInCard}
                            placeholder={'Search places, buildings, companies...'}
                            placeholderTextColor="#999"
                            value={searchText}
                            onChangeText={handleSearchTextChange}
                        />
                        {searchText.length > 0 && (
                            <TouchableOpacity onPress={() => {
                                setSearchText('');
                                setShowSearchResults(false);
                                setSearchResults([]);
                            }}>
                                <Icon name="close-circle" size={20} color="#999" />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Search Results */}
                    {showSearchResults && (
                        <View style={styles.searchResultsInCard}>
                            <ScrollView style={styles.searchResults} nestedScrollEnabled={true}>
                                {isSearching ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color="#4FC3F7" />
                                        <Text style={styles.loadingText}>{'Searching across India'}...</Text>
                                    </View>
                                ) : searchResults.length > 0 ? (
                                    searchResults.map((result) => {
                                        // Determine the icon based on result type
                                        const getIcon = () => {
                                            if (result.isCustomSearch) return 'add-circle-outline';
                                            if (result.category === 'building' || result.category === 'office') return 'business-outline';
                                            if (result.category === 'shop' || result.category === 'amenity') return 'storefront-outline';
                                            if (result.type === 'hospital' || result.type === 'clinic') return 'medical-outline';
                                            if (result.type === 'school' || result.type === 'college' || result.type === 'university') return 'school-outline';
                                            if (result.type === 'restaurant' || result.type === 'cafe') return 'restaurant-outline';
                                            if (result.type === 'hotel') return 'bed-outline';
                                            return 'location-outline';
                                        };

                                        // Build display text
                                        const displayName = result.buildingName || result.shortName || result.area || result.name;
                                        const locationInfo = [result.area, result.city, result.state].filter(Boolean).join(', ');

                                        // For custom search entries (when no results found)
                                        if (result.isCustomSearch) {
                                            return (
                                                <TouchableOpacity
                                                    key={result.id}
                                                    style={[styles.searchResultItem, styles.customSearchItem]}
                                                    onPress={() => selectSearchResult(result)}
                                                >
                                                    <Icon name="add-circle-outline" size={20} color="#FF6B35" />
                                                    <View style={styles.searchResultText}>
                                                        <Text style={[styles.searchResultName, { color: '#FF6B35' }]} numberOfLines={2}>
                                                            Use "{displayName}"
                                                        </Text>
                                                        <Text style={styles.searchResultAddress}>
                                                            Add as custom location
                                                        </Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        }

                                        return (
                                            <TouchableOpacity
                                                key={result.id}
                                                style={styles.searchResultItem}
                                                onPress={() => selectSearchResult(result)}
                                            >
                                                <Icon name={getIcon()} size={20} color="#4FC3F7" />
                                                <View style={styles.searchResultText}>
                                                    <Text style={styles.searchResultName} numberOfLines={1}>
                                                        {displayName}
                                                    </Text>
                                                    <Text style={styles.searchResultAddress} numberOfLines={2}>
                                                        {locationInfo}{result.pincode ? ` - ${result.pincode}` : ''}
                                                    </Text>
                                                </View>
                                            </TouchableOpacity>
                                        );
                                    })
                                ) : searchText.length >= 2 ? (
                                    <View style={styles.noResultsContainer}>
                                        <Icon name="search-outline" size={20} color="#999" />
                                        <Text style={styles.noResultsText}>No locations found for "{searchText}"</Text>
                                        <Text style={styles.noResultsSubtext}>Try searching for cities, areas, buildings, or company names</Text>
                                    </View>
                                ) : null}
                            </ScrollView>
                        </View>
                    )}

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Use Current Location */}
                    <TouchableOpacity
                        style={styles.locationOptionInCard}
                        onPress={handleUseCurrentLocation}
                        disabled={isLoadingCurrentLocation}
                    >
                        {isLoadingCurrentLocation ? (
                            <ActivityIndicator size="small" color="#4FC3F7" />
                        ) : (
                            <Icon name="navigate" size={20} color="#4FC3F7" />
                        )}
                        <Text style={styles.locationOptionTextBlue}>
                            {isLoadingCurrentLocation ? 'Getting location...' : 'Use Current Location'}
                        </Text>
                        <Icon name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerLight} />

                    {/* Choose on Map */}
                    <TouchableOpacity
                        style={styles.locationOptionInCard}
                        onPress={handleMapPress}
                    >
                        <Icon name="map-outline" size={20} color={Colors.text.primary} />
                        <Text style={styles.locationOptionText}>Choose on map</Text>
                        <Icon name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                {/* Saved Addresses */}
                <View style={styles.sectionHeader1}>
                    <Icon name="bookmark-outline" size={20} color="#666" />
                    <Text style={styles.sectionTitle}>{'Recent Addresses'}</Text>
                    {savedAddresses.length > 0 && (
                        <View style={styles.addressCount}>
                            <Text style={styles.addressCountText}>{savedAddresses.length}</Text>
                        </View>
                    )}
                </View>
                {savedAddresses.length > 0 ? (
                    <View style={styles.locationList1}>
                        {savedAddresses.map((address) => (
                            <TouchableOpacity
                                key={address.id}
                                style={[
                                    styles.locationItem,
                                    selectedLocation === address.name && styles.selectedLocationItem
                                ]}
                                onPress={() => handleLocationSelect(address.name, address)}
                            >
                                <Icon
                                    name="bookmark"
                                    size={20}
                                    color={selectedLocation === address.name ? '#4FC3F7' : '#FF6B35'}
                                />
                                <View style={styles.addressDetails}>
                                    <Text style={[
                                        styles.locationText,
                                        selectedLocation === address.name && styles.selectedLocationText
                                    ]}>
                                        {address.name}
                                    </Text>
                                    {address.area && address.city && (
                                        <Text style={styles.addressSubtext}>
                                            {address.area}, {address.city}
                                            {address.pincode && ` - ${address.pincode}`}
                                        </Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyAddressesContainer}>
                        <Icon name="bookmark-outline" size={24} color="#ccc" />
                        <Text style={styles.emptyAddressesText}>No recent addresses yet</Text>
                        <Text style={styles.emptyAddressesSubtext}>Search for a location or use the map to save addresses</Text>
                    </View>
                )}

                {/* Selected Location Summary */}
                {selectedLocation && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Icon name="checkmark-circle-outline" size={20} color="#4FC3F7" />
                            <Text style={styles.sectionTitle}>Selected Location</Text>
                        </View>
                        <View style={styles.selectedLocationSummary}>
                            <View style={styles.selectedLocationCard}>
                                <Icon name="location" size={24} color="#4FC3F7" />
                                <View style={styles.selectedLocationDetails}>
                                    <Text style={styles.selectedLocationName}>{selectedLocation}</Text>
                                    {savedAddresses.find(addr => addr.name === selectedLocation) && (
                                        <View style={styles.selectedLocationMeta}>
                                            <Text style={styles.selectedLocationMetaText}>
                                                {savedAddresses.find(addr => addr.name === selectedLocation)?.area &&
                                                 `${savedAddresses.find(addr => addr.name === selectedLocation)?.area} • `}
                                                {savedAddresses.find(addr => addr.name === selectedLocation)?.city}
                                                {savedAddresses.find(addr => addr.name === selectedLocation)?.pincode &&
                                                 ` • ${savedAddresses.find(addr => addr.name === selectedLocation)?.pincode}`}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Save Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity activeOpacity={0.8}>
                    <Button title={'Save'} onPress={handleSave} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    chooseLocationCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        marginBottom: Spacing.lg,
        elevation: 3,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        overflow: 'hidden',
    },
    chooseLocationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    chooseLocationTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginLeft: Spacing.sm,
        fontFamily: Typography.fontFamily.bold,
    },
    searchContainerInCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    searchInputInCard: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        paddingVertical: Spacing.xs,
    },
    searchResultsInCard: {
        maxHeight: 300,
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.md,
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
    },
    customSearchItem: {
        backgroundColor: '#FFF5F0',
        borderBottomColor: '#FFE0D0',
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: Spacing.lg,
    },
    dividerLight: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: Spacing.lg,
    },
    locationOptionInCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    locationOptionText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        marginLeft: Spacing.sm,
    },
    locationOptionTextBlue: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: '#4FC3F7',
        fontFamily: Typography.fontFamily.medium,
        marginLeft: Spacing.sm,
    },
    headerContainer: {
        paddingTop: 50,
        paddingBottom: Spacing.xxl,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
        minHeight: 120,
    },
    statusBarArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    timeText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.medium,
    },
    rightIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    signalBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginRight: 6,
    },
    bar: {
        width: 3,
        backgroundColor: Colors.white,
        marginRight: 1,
        borderRadius: 1,
    },
    bar1: { height: 4 },
    bar2: { height: 6 },
    bar3: { height: 8 },
    bar4: { height: 10 },
    iconSpacing: {
        marginHorizontal: 4,
    },
    battery: {
        width: 24,
        height: 12,
        borderWidth: 1,
        borderColor: Colors.white,
        borderRadius: 2,
        marginLeft: 4,
        position: 'relative',
    },
    batteryLevel: {
        position: 'absolute',
        left: 1,
        top: 1,
        bottom: 1,
        width: '80%',
        backgroundColor: Colors.white,
        borderRadius: 1,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
    },
    backButton: {
        marginRight: Spacing.md,
        padding: Spacing.xs,
    },
    title: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.white,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 25,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.lg,
    },
    searchIcon: {
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
    },
    mapOption: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        marginBottom: Spacing.xl,
    },
    mapOptionText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        marginLeft: Spacing.sm,
    },
    mapOptionDisabled: {
        opacity: 0.6,
    },
    mapOptionTextDisabled: {
        color: '#999',
    },
    locationList: {
        gap: 1,
    },
    locationList1: {
        gap: 1,
        marginBottom: Spacing.xxl
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        backgroundColor: Colors.white,
    },
    selectedLocationItem: {
        backgroundColor: '#F0F8FF',
    },
    locationText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        marginLeft: Spacing.sm,
    },
    selectedLocationText: {
        color: '#4FC3F7',
        fontWeight: Typography.fontWeight.medium,
    },
    bottomContainer: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.white,
        marginBottom: Spacing.lg
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
    },
    selectedLocationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E8',
        borderRadius: 12,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginBottom: Spacing.lg,
    },
    selectedLocationLabel: {
        fontSize: Typography.fontSize.sm,
        color: '#4FC3F7',
        fontFamily: Typography.fontFamily.medium,
        marginLeft: Spacing.xs,
        marginRight: Spacing.xs,
    },
    selectedLocationText: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: '#2E7D32',
        fontFamily: Typography.fontFamily.medium,
    },
    searchResultsContainer: {
        maxHeight: 200,
        backgroundColor: Colors.white,
        borderRadius: 12,
        elevation: 3,
        shadowColor: Colors.black,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: Spacing.lg,
    },
    searchResults: {
        maxHeight: 200,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchResultText: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    searchResultName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    searchResultAddress: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.lg,
    },
    loadingText: {
        fontSize: Typography.fontSize.md,
        color: '#4FC3F7',
        marginLeft: Spacing.sm,
        fontFamily: Typography.fontFamily.medium,
    },
    noResultsContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    noResultsText: {
        fontSize: Typography.fontSize.md,
        color: '#666',
        textAlign: 'center',
        marginTop: Spacing.sm,
        fontFamily: Typography.fontFamily.medium,
    },
    noResultsSubtext: {
        fontSize: Typography.fontSize.sm,
        color: '#999',
        textAlign: 'center',
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.regular,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        marginTop: -Spacing.xl
    },
    sectionHeader1: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        // marginTop: Spacing.xs,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        color: '#666',
        marginLeft: Spacing.xs,
        fontFamily: Typography.fontFamily.medium,
    },
    addressDetails: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    addressSubtext: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: 2,
        fontFamily: Typography.fontFamily.regular,
    },
    addressCount: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 'auto',
    },
    addressCountText: {
        fontSize: Typography.fontSize.xs,
        color: Colors.white,
        fontWeight: Typography.fontWeight.bold,
    },
    selectedLocationSummary: {
        marginBottom: Spacing.xl,
    },
    selectedLocationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8FF',
        borderRadius: 16,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        borderWidth: 2,
        borderColor: '#4FC3F7',
    },
    selectedLocationDetails: {
        flex: 1,
        marginLeft: Spacing.md,
    },
    selectedLocationName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#1976D2',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: 4,
    },
    selectedLocationMeta: {
        marginTop: 4,
    },
    selectedLocationMetaText: {
        fontSize: Typography.fontSize.sm,
        color: '#666',
        fontFamily: Typography.fontFamily.regular,
    },
    emptyAddressesContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    emptyAddressesText: {
        fontSize: Typography.fontSize.md,
        color: '#999',
        fontFamily: Typography.fontFamily.medium,
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    emptyAddressesSubtext: {
        fontSize: Typography.fontSize.sm,
        color: '#ccc',
        fontFamily: Typography.fontFamily.regular,
        marginTop: Spacing.xs,
        textAlign: 'center',
    },
});

export default ChangeLocationScreen;