/**
 * Centralized filter options for vehicles
 * Used in FilterScreen dropdowns
 */

import { CAR_NAMES } from './CarsData';
import { BIKE_NAMES } from './BikesData';

// Use car names from CarsData.js
export const CAR_NAME_OPTIONS = CAR_NAMES;

// Use bike names from BikesData.js
export const BIKE_NAME_OPTIONS = BIKE_NAMES;

export const FUEL_OPTIONS = {
  CAR: [
    { label: 'Petrol', value: 'petrol' },
    { label: 'Diesel', value: 'diesel' },
    { label: 'CNG', value: 'cng' },
    { label: 'Electric', value: 'electric' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'LPG', value: 'lpg' },
  ],
  BIKE: [
    { label: 'Petrol', value: 'petrol' },
    { label: 'Electric', value: 'electric' },
    { label: 'Hybrid', value: 'hybrid' },
  ],
};

export const TRANSMISSION_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Automatic', value: 'automatic' },
  { label: 'AMT', value: 'amt' },
  { label: 'CVT', value: 'cvt' },
  { label: 'DCT', value: 'dct' },
  { label: 'iMT', value: 'imt' },
];

// Helper function to get all car filter options
export const getCarFilterOptions = () => ({
  carNames: CAR_NAME_OPTIONS,
  fuels: FUEL_OPTIONS.CAR,
  transmissions: TRANSMISSION_OPTIONS,
});

// Helper function to get all bike filter options
export const getBikeFilterOptions = () => ({
  bikeNames: BIKE_NAME_OPTIONS,
  fuels: FUEL_OPTIONS.BIKE,
});
