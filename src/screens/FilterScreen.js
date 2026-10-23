import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { filterVehicles } from '../api/filterApi';
import Button from '../components/Button/Button';
import BikeFiltersSection from '../components/Filter/BikeFiltersSection';
import CarFiltersSection from '../components/Filter/CarFiltersSection';
import DistanceSlider from '../components/Filter/DistanceSlider';
import PriceRangeSlider from '../components/Filter/PriceRangeSlider';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { clearPersistedBikeFilterState } from './NearbyBikeScreen';
import { clearPersistedCarFilterState } from './NearbyCarsScreen';

// Global store to persist filter data across navigations
let persistedFilterData = {
  priceRange: 20,
  distance: 10,
  carFilters: { carName: '', fuel: '', transmission: '' },
  bikeFilters: { bikeName: '', fuel: '' },
  hasAppliedFilters: false,
};

// Export function to clear persisted filter data (called from NearbyCarsScreen/NearbyBikeScreen)
export const clearPersistedFilterData = () => {
  persistedFilterData = {
    priceRange: 20,
    distance: 10,
    carFilters: { carName: '', fuel: '', transmission: '' },
    bikeFilters: { bikeName: '', fuel: '' },
    hasAppliedFilters: false,
  };
};

const FilterScreen = ({ navigation, route }) => {
  // Get previously applied filters from route params if coming back to filter screen
  const appliedFilters = route?.params?.appliedFilters;
  const selectedAddressFromRoute = route?.params?.selectedAddress;

  // Initialize from persisted state or route params
  const getInitialFilterData = () => {
    if (appliedFilters) {
      return {
        priceRange: appliedFilters.priceRange || 20,
        distance: appliedFilters.distance || 10,
        carFilters: appliedFilters.carFilters || { carName: '', fuel: '', transmission: '' },
        bikeFilters: appliedFilters.bikeFilters || { bikeName: '', fuel: '' },
      };
    }
    if (persistedFilterData.hasAppliedFilters) {
      return {
        priceRange: persistedFilterData.priceRange,
        distance: persistedFilterData.distance,
        carFilters: persistedFilterData.carFilters,
        bikeFilters: persistedFilterData.bikeFilters,
      };
    }
    return {
      priceRange: 20,
      distance: 10,
      carFilters: { carName: '', fuel: '', transmission: '' },
      bikeFilters: { bikeName: '', fuel: '' },
    };
  };

  const [filterData, setFilterData] = useState(getInitialFilterData);
  const [activeVehicleType, setActiveVehicleType] = useState('car'); // 'car' or 'bike'
  const [userLocation, setUserLocation] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);

  // Update filter data when appliedFilters changes (when navigating back to this screen)
  useEffect(() => {
    if (appliedFilters) {
      setFilterData({
        priceRange: appliedFilters.priceRange || 20,
        distance: appliedFilters.distance || 10,
        carFilters: appliedFilters.carFilters || { carName: '', fuel: '', transmission: '' },
        bikeFilters: appliedFilters.bikeFilters || { bikeName: '', fuel: '' },
      });
    } else if (persistedFilterData.hasAppliedFilters) {
      setFilterData({
        priceRange: persistedFilterData.priceRange,
        distance: persistedFilterData.distance,
        carFilters: persistedFilterData.carFilters,
        bikeFilters: persistedFilterData.bikeFilters,
      });
    }
  }, [appliedFilters]);

  useEffect(() => {
    // Get location and selected address from route params
    const location = route?.params?.userLocation || {
      latitude: 17.4417,
      longitude: 78.4416,
    };
    setUserLocation(location);

    // Set selected address if provided
    if (route?.params?.selectedAddress) {
      setSelectedAddress(route.params.selectedAddress);
    }
  }, [route?.params?.userLocation, route?.params?.selectedAddress]);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handlePriceChange = (value) => {
    setFilterData((prev) => ({
      ...prev,
      priceRange: value,
    }));
  };

  const handleDistanceChange = (value) => {
    setFilterData((prev) => ({
      ...prev,
      distance: value,
    }));
  };

  const handleCarFiltersChange = (filters) => {
    setFilterData((prev) => ({
      ...prev,
      carFilters: filters,
    }));
  };

  const handleBikeFiltersChange = (filters) => {
    setFilterData((prev) => ({
      ...prev,
      bikeFilters: filters,
    }));
  };

  const handleApplyFilters = async () => {
    try {
      // Check specific filters
      const hasBikeFilters =
        filterData.bikeFilters?.bikeName ||
        filterData.bikeFilters?.variant ||
        filterData.bikeFilters?.modelYear ||
        filterData.bikeFilters?.fuel;

      const hasCarFilters =
        filterData.carFilters?.carName ||
        filterData.carFilters?.fuel ||
        filterData.carFilters?.transmission ||
        filterData.carFilters?.variant ||
        filterData.carFilters?.modelYear;

      // Determine what to fetch based on active tab
      let shouldFetchCars = activeVehicleType === 'car';
      let shouldFetchBikes = activeVehicleType === 'bike';

      let allFilteredVehicles = [];
      let carResult = { success: true, data: [] };
      let bikeResult = { success: true, data: [] };

      // Fetch Cars if needed
      if (shouldFetchCars) {
        carResult = await filterVehicles(filterData, 'car', userLocation);
        if (carResult.success && carResult.data) {
          allFilteredVehicles = [...allFilteredVehicles, ...carResult.data];
        }
      }

      // Fetch Bikes if needed
      if (shouldFetchBikes) {
        bikeResult = await filterVehicles(filterData, 'bike', userLocation);
        if (bikeResult.success && bikeResult.data) {
          allFilteredVehicles = [...allFilteredVehicles, ...bikeResult.data];
        }
      }

      if (carResult.success && bikeResult.success) {
        // Persist filter data to global store
        persistedFilterData = {
          priceRange: filterData.priceRange,
          distance: filterData.distance,
          carFilters: { ...filterData.carFilters },
          bikeFilters: { ...filterData.bikeFilters },
          hasAppliedFilters: true,
        };

        // Navigate to Dashboard with filtered results
        navigation.navigate('DashBoard', {
          filteredVehicles: allFilteredVehicles,
          appliedFilters: filterData,
          filterTimestamp: Date.now(),
          selectedAddress: selectedAddress || {
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude,
            name: 'Current Location',
          },
          activeTab: 'Rental',
        });
      } else {
        const errorMessage = !carResult.success ? carResult.message : bikeResult.message;
        Alert.alert('Error', errorMessage || 'Filter failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleResetFilters = () => {
    // Clear persisted filter data
    clearPersistedFilterData();
    clearPersistedCarFilterState();
    clearPersistedBikeFilterState();

    // Reset local form state
    setFilterData({
      priceRange: 20,
      distance: 10,
      carFilters: { carName: '', fuel: '', transmission: '', variant: '', modelYear: '' },
      bikeFilters: { bikeName: '', variant: '', modelYear: '', fuel: '' },
    });

    // Navigate back to Dashboard with cleared filters
    navigation.navigate('DashBoard', {
      filteredVehicles: undefined,
      appliedFilters: undefined,
      filterTimestamp: undefined,
      activeTab: 'Rental',
    });
  };

  const CheckboxOption = ({ label, isSelected, onPress }) => (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPress}>
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <View style={styles.checkboxInner} />}
      </View>
      <Text style={styles.checkboxLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header onBackPress={handleBackPress} title="Filter" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <PriceRangeSlider
          onValueChange={handlePriceChange}
          initialValue={filterData.priceRange}
        />
        <DistanceSlider
          onValueChange={handleDistanceChange}
          initialValue={filterData.distance}
        />

        {/* Vehicle Type Selection */}
        <View style={styles.vehicleTypeSection}>
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          
          <CheckboxOption
            label="Car"
            isSelected={activeVehicleType === 'car'}
            onPress={() => setActiveVehicleType('car')}
          />
          
          <CheckboxOption
            label="Bike"
            isSelected={activeVehicleType === 'bike'}
            onPress={() => setActiveVehicleType('bike')}
          />
        </View>

        {/* Conditionally render filters based on active vehicle type */}
        {activeVehicleType === 'car' ? (
          <CarFiltersSection
            onFiltersChange={handleCarFiltersChange}
            initialFilters={filterData.carFilters}
          />
        ) : (
          <BikeFiltersSection
            onFiltersChange={handleBikeFiltersChange}
            initialFilters={filterData.bikeFilters}
          />
        )}

        <View style={styles.spacer} />

        <View style={styles.buttonContainer}>
          <Button title="Apply Filter" onPress={handleApplyFilters} />
          <View style={styles.buttonSpacer} />
          <Button title="Reset Filters" onPress={handleResetFilters} variant="outline" />
        </View>
      </ScrollView>
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
    marginTop: Spacing.md,
  },
  vehicleTypeSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border || '#D0D0D0',
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxSelected: {
    borderColor: Colors.activeTab || '#007AFF',
    backgroundColor: Colors.activeTab || '#007AFF',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: Colors.white,
  },
  checkboxLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  buttonSpacer: {
    height: 12,
  },
});

export default FilterScreen;