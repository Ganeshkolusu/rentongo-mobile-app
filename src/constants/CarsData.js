/**
 * Centralized Car Data for FilterScreen dropdowns
 * Uses the same data as ListYourCarScreen for consistency
 */

import { carNameOptions } from '../data/carOptions';

// Use car names from carOptions.js (same as ListYourCarScreen)
export const CAR_NAMES = carNameOptions;

// Helper function to get car names for dropdown
export const getCarNames = () => CAR_NAMES;
