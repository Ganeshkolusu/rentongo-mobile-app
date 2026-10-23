/**
 * Format applied filters into a human-readable string
 * @param {Object} appliedFilters - The applied filters object
 * @returns {Array<string>} Array of filter descriptions
 */
export const formatAppliedFilters = (appliedFilters) => {
    if (!appliedFilters) return [];

    const filterTexts = [];

    // Price filter
    if (appliedFilters.priceRange) {
        filterTexts.push(`Price: ₹${appliedFilters.priceRange}/day`);
    }

    // Distance filter
    if (appliedFilters.distance) {
        filterTexts.push(`Distance: ${appliedFilters.distance}km`);
    }

    // Car filters
    if (appliedFilters.carFilters) {
        const { carName, fuel, transmission, variant, modelYear } = appliedFilters.carFilters;
        
        if (carName) filterTexts.push(`Car: ${carName}`);
        if (fuel) filterTexts.push(`Fuel: ${fuel}`);
        if (transmission) filterTexts.push(`Transmission: ${transmission}`);
        if (variant) filterTexts.push(`Variant: ${variant}`);
        if (modelYear) filterTexts.push(`Year: ${modelYear}`);
    }

    // Bike filters
    if (appliedFilters.bikeFilters) {
        const { bikeName, fuel, variant, modelYear } = appliedFilters.bikeFilters;
        
        if (bikeName) filterTexts.push(`Bike: ${bikeName}`);
        if (fuel) filterTexts.push(`Fuel: ${fuel}`);
        if (variant) filterTexts.push(`Variant: ${variant}`);
        if (modelYear) filterTexts.push(`Year: ${modelYear}`);
    }

    return filterTexts;
};

/**
 * Create a single-line filter summary
 * @param {Object} appliedFilters - The applied filters object
 * @returns {string} Single-line filter summary
 */
export const getFilterSummary = (appliedFilters) => {
    const filters = formatAppliedFilters(appliedFilters);
    if (filters.length === 0) return '';
    return filters.join(' • ');
};
