import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { getCarFilterOptions } from '../../constants/FilterOptions';
import FilterDropdown from './FilterDropdown';

const CarFiltersSection = ({ onFiltersChange, initialFilters }) => {
    const [filters, setFilters] = useState({
        carName: initialFilters?.carName || '',
        fuel: initialFilters?.fuel || '',
        transmission: initialFilters?.transmission || '',
    });

    // Update filters when initialFilters changes (when navigating back to FilterScreen)
    useEffect(() => {
        if (initialFilters) {
            setFilters({
                carName: initialFilters.carName || '',
                fuel: initialFilters.fuel || '',
                transmission: initialFilters.transmission || '',
            });
        }
    }, [initialFilters]);

    // Get filter options from centralized data
    const { carNames, fuels, transmissions } = getCarFilterOptions();

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFiltersChange && onFiltersChange(newFilters);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Car Filters</Text>

            <FilterDropdown
                label="Car Name"
                options={carNames}
                selectedValue={filters.carName}
                onValueChange={(value) => handleFilterChange('carName', value)}
                placeholder="Select Car"
            />

            <FilterDropdown
                label="Fuel"
                options={fuels}
                selectedValue={filters.fuel}
                onValueChange={(value) => handleFilterChange('fuel', value)}
                placeholder="Select Fuel"
            />

            <FilterDropdown
                label="Transmission"
                options={transmissions}
                selectedValue={filters.transmission}
                onValueChange={(value) => handleFilterChange('transmission', value)}
                placeholder="Select Transmission"
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

export default CarFiltersSection;
