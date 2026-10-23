/**
 * Centralized Bike Data for FilterScreen dropdowns
 * Uses the same data as ListYourBikeScreen for consistency
 */

import { bikeNameOptions } from '../data/bikeOptions';

// Use bike names from bikeOptions.js (same as ListYourBikeScreen)
export const BIKE_NAMES = bikeNameOptions;

// Helper function to get bike names for dropdown
export const getBikeNames = () => BIKE_NAMES;
