import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { getBikeFilterOptions } from '../../constants/FilterOptions';
import FilterDropdown from './FilterDropdown';

const BikeFiltersSection = ({ onFiltersChange, initialFilters }) => {
  const [filters, setFilters] = useState({
    bikeName: initialFilters?.bikeName || '',
    fuel: initialFilters?.fuel || '',
  });

  // Update filters when initialFilters changes (when navigating back to FilterScreen)
  useEffect(() => {
    if (initialFilters) {
      setFilters({
        bikeName: initialFilters.bikeName || '',
        fuel: initialFilters.fuel || '',
      });
    }
  }, [initialFilters]);

  // Get filter options from centralized data
  const { bikeNames, fuels } = getBikeFilterOptions();

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bike Filters</Text>

      <FilterDropdown
        label="Bike Name"
        options={bikeNames}
        selectedValue={filters.bikeName}
        onValueChange={(value) => handleFilterChange('bikeName', value)}
        placeholder="Select Bike"
      />

      <FilterDropdown
        label="Fuel Type"
        options={fuels}
        selectedValue={filters.fuel}
        onValueChange={(value) => handleFilterChange('fuel', value)}
        placeholder="Select Fuel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
});

export default BikeFiltersSection;
