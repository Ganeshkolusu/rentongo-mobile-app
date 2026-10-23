import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { carService, bikeService, autoService, userService, bookingService } from '../api';

const DataCacheContext = createContext({});

// Cache keys
const CACHE_KEYS = {
    NEARBY_CARS: 'cache_nearby_cars',
    NEARBY_BIKES: 'cache_nearby_bikes',
    NEARBY_AUTOS: 'cache_nearby_autos',
    MY_VEHICLES: 'cache_my_vehicles',
    MY_BOOKINGS: 'cache_my_bookings',
    MY_VEHICLE_BOOKINGS: 'cache_my_vehicle_bookings',
    USER_DATA: 'cache_user_data',
    NOTIFICATIONS: 'cache_notifications',
    CACHE_TIMESTAMPS: 'cache_timestamps',
};

// Cache expiry time in milliseconds (5 minutes)
const CACHE_EXPIRY = 5 * 60 * 1000;

export const DataCacheProvider = ({ children }) => {
    // In-memory cache for instant access
    const [nearbyCars, setNearbyCars] = useState([]);
    const [nearbyBikes, setNearbyBikes] = useState([]);
    const [nearbyAutos, setNearbyAutos] = useState([]);
    const [myVehicles, setMyVehicles] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [myVehicleBookings, setMyVehicleBookings] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Loading states
    const [loadingStates, setLoadingStates] = useState({
        nearbyCars: false,
        nearbyBikes: false,
        nearbyAutos: false,
        myVehicles: false,
        myBookings: false,
        myVehicleBookings: false,
    });

    // Track if initial load is done
    const [initialLoadDone, setInitialLoadDone] = useState({
        nearbyCars: false,
        nearbyBikes: false,
        nearbyAutos: false,
        myVehicles: false,
        myBookings: false,
        myVehicleBookings: false,
    });

    // Ref to track ongoing fetches to prevent duplicate calls
    const fetchInProgress = useRef({});

    // Get cache timestamp
    const getCacheTimestamp = async (key) => {
        try {
            const timestamps = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMPS);
            if (timestamps) {
                const parsed = JSON.parse(timestamps);
                return parsed[key] || 0;
            }
            return 0;
        } catch {
            return 0;
        }
    };

    // Set cache timestamp
    const setCacheTimestamp = async (key) => {
        try {
            const timestamps = await AsyncStorage.getItem(CACHE_KEYS.CACHE_TIMESTAMPS);
            const parsed = timestamps ? JSON.parse(timestamps) : {};
            parsed[key] = Date.now();
            await AsyncStorage.setItem(CACHE_KEYS.CACHE_TIMESTAMPS, JSON.stringify(parsed));
        } catch {
            // Silent fail
        }
    };

    // Check if cache is valid
    const isCacheValid = async (key) => {
        const timestamp = await getCacheTimestamp(key);
        return Date.now() - timestamp < CACHE_EXPIRY;
    };

    // Load from AsyncStorage
    const loadFromStorage = async (key) => {
        try {
            const data = await AsyncStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    };

    // Save to AsyncStorage
    const saveToStorage = async (key, data) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
            await setCacheTimestamp(key);
        } catch {
            // Silent fail
        }
    };

    // ==================== NEARBY CARS ====================
    const fetchNearbyCars = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = CACHE_KEYS.NEARBY_CARS;

        // Prevent duplicate calls
        if (fetchInProgress.current[cacheKey]) {
            return nearbyCars;
        }

        // Return cached data if valid and not forcing refresh
        if (!forceRefresh && initialLoadDone.nearbyCars && nearbyCars.length > 0) {
            // Background refresh if cache might be stale
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                // Refresh in background
                setTimeout(() => fetchNearbyCars(params, true), 0);
            }
            return nearbyCars;
        }

        // Check AsyncStorage if in-memory is empty
        if (!forceRefresh && !initialLoadDone.nearbyCars) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setNearbyCars(cached);
                setInitialLoadDone(prev => ({ ...prev, nearbyCars: true }));
                // Background refresh
                setTimeout(() => fetchNearbyCars(params, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, nearbyCars: true }));

        try {
            const response = await carService.getNearbyCars(params);
            const cars = response?.cars || response || [];
            setNearbyCars(cars);
            setInitialLoadDone(prev => ({ ...prev, nearbyCars: true }));
            await saveToStorage(cacheKey, cars);
            return cars;
        } catch (error) {
            // Silent catch
            return nearbyCars;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, nearbyCars: false }));
        }
    }, [nearbyCars, initialLoadDone.nearbyCars]);

    // ==================== NEARBY BIKES ====================
    const fetchNearbyBikes = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = CACHE_KEYS.NEARBY_BIKES;

        if (fetchInProgress.current[cacheKey]) {
            return nearbyBikes;
        }

        if (!forceRefresh && initialLoadDone.nearbyBikes && nearbyBikes.length > 0) {
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                setTimeout(() => fetchNearbyBikes(params, true), 0);
            }
            return nearbyBikes;
        }

        if (!forceRefresh && !initialLoadDone.nearbyBikes) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setNearbyBikes(cached);
                setInitialLoadDone(prev => ({ ...prev, nearbyBikes: true }));
                setTimeout(() => fetchNearbyBikes(params, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, nearbyBikes: true }));

        try {
            const response = await bikeService.getNearbyBikes(params);
            const bikes = response?.bikes || response || [];
            setNearbyBikes(bikes);
            setInitialLoadDone(prev => ({ ...prev, nearbyBikes: true }));
            await saveToStorage(cacheKey, bikes);
            return bikes;
        } catch (error) {
            // Silent catch
            return nearbyBikes;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, nearbyBikes: false }));
        }
    }, [nearbyBikes, initialLoadDone.nearbyBikes]);

    // ==================== NEARBY AUTOS ====================
    const fetchNearbyAutos = useCallback(async (params = {}, forceRefresh = false) => {
        const cacheKey = CACHE_KEYS.NEARBY_AUTOS;

        if (fetchInProgress.current[cacheKey]) {
            return nearbyAutos;
        }

        if (!forceRefresh && initialLoadDone.nearbyAutos && nearbyAutos.length > 0) {
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                setTimeout(() => fetchNearbyAutos(params, true), 0);
            }
            return nearbyAutos;
        }

        if (!forceRefresh && !initialLoadDone.nearbyAutos) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setNearbyAutos(cached);
                setInitialLoadDone(prev => ({ ...prev, nearbyAutos: true }));
                setTimeout(() => fetchNearbyAutos(params, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, nearbyAutos: true }));

        try {
            const response = await autoService.getNearbyAutos(params);
            const autos = response?.autos || response || [];
            setNearbyAutos(autos);
            setInitialLoadDone(prev => ({ ...prev, nearbyAutos: true }));
            await saveToStorage(cacheKey, autos);
            return autos;
        } catch (error) {
            // Silent catch
            return nearbyAutos;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, nearbyAutos: false }));
        }
    }, [nearbyAutos, initialLoadDone.nearbyAutos]);

    // ==================== MY VEHICLES ====================
    const fetchMyVehicles = useCallback(async (userId, forceRefresh = false) => {
        if (!userId) return myVehicles;
        const cacheKey = CACHE_KEYS.MY_VEHICLES;

        if (fetchInProgress.current[cacheKey]) {
            return myVehicles;
        }

        if (!forceRefresh && initialLoadDone.myVehicles && myVehicles.length > 0) {
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                setTimeout(() => fetchMyVehicles(userId, true), 0);
            }
            return myVehicles;
        }

        if (!forceRefresh && !initialLoadDone.myVehicles) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setMyVehicles(cached);
                setInitialLoadDone(prev => ({ ...prev, myVehicles: true }));
                setTimeout(() => fetchMyVehicles(userId, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, myVehicles: true }));

        try {
            const response = await userService.getMyVehicles(userId);
            const vehicles = response?.vehicles || response || [];
            setMyVehicles(vehicles);
            setInitialLoadDone(prev => ({ ...prev, myVehicles: true }));
            await saveToStorage(cacheKey, vehicles);
            return vehicles;
        } catch (error) {
            // Silent catch
            return myVehicles;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, myVehicles: false }));
        }
    }, [myVehicles, initialLoadDone.myVehicles]);

    // ==================== MY BOOKINGS ====================
    const fetchMyBookings = useCallback(async (userId, forceRefresh = false) => {
        if (!userId) return myBookings;
        const cacheKey = CACHE_KEYS.MY_BOOKINGS;

        if (fetchInProgress.current[cacheKey]) {
            return myBookings;
        }

        if (!forceRefresh && initialLoadDone.myBookings && myBookings.length > 0) {
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                setTimeout(() => fetchMyBookings(userId, true), 0);
            }
            return myBookings;
        }

        if (!forceRefresh && !initialLoadDone.myBookings) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setMyBookings(cached);
                setInitialLoadDone(prev => ({ ...prev, myBookings: true }));
                setTimeout(() => fetchMyBookings(userId, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, myBookings: true }));

        try {
            const response = await userService.getMyBookings(userId);
            const bookings = response?.bookings || response || [];
            setMyBookings(bookings);
            setInitialLoadDone(prev => ({ ...prev, myBookings: true }));
            await saveToStorage(cacheKey, bookings);
            return bookings;
        } catch (error) {
            // Silent catch
            return myBookings;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, myBookings: false }));
        }
    }, [myBookings, initialLoadDone.myBookings]);

    // ==================== MY VEHICLE BOOKINGS ====================
    const fetchMyVehicleBookings = useCallback(async (userId, forceRefresh = false) => {
        if (!userId) return myVehicleBookings;
        const cacheKey = CACHE_KEYS.MY_VEHICLE_BOOKINGS;

        if (fetchInProgress.current[cacheKey]) {
            return myVehicleBookings;
        }

        if (!forceRefresh && initialLoadDone.myVehicleBookings && myVehicleBookings.length > 0) {
            const isValid = await isCacheValid(cacheKey);
            if (!isValid) {
                setTimeout(() => fetchMyVehicleBookings(userId, true), 0);
            }
            return myVehicleBookings;
        }

        if (!forceRefresh && !initialLoadDone.myVehicleBookings) {
            const cached = await loadFromStorage(cacheKey);
            if (cached && cached.length > 0) {
                setMyVehicleBookings(cached);
                setInitialLoadDone(prev => ({ ...prev, myVehicleBookings: true }));
                setTimeout(() => fetchMyVehicleBookings(userId, true), 100);
                return cached;
            }
        }

        fetchInProgress.current[cacheKey] = true;
        setLoadingStates(prev => ({ ...prev, myVehicleBookings: true }));

        try {
            const response = await userService.getMyVehicleBookings(userId);
            const bookings = response?.bookings || response || [];
            setMyVehicleBookings(bookings);
            setInitialLoadDone(prev => ({ ...prev, myVehicleBookings: true }));
            await saveToStorage(cacheKey, bookings);
            return bookings;
        } catch (error) {
            // Silent catch
            return myVehicleBookings;
        } finally {
            fetchInProgress.current[cacheKey] = false;
            setLoadingStates(prev => ({ ...prev, myVehicleBookings: false }));
        }
    }, [myVehicleBookings, initialLoadDone.myVehicleBookings]);

    // ==================== CRUD OPERATIONS ====================

    // Add vehicle to cache
    const addVehicleToCache = useCallback((vehicle, type) => {
        if (type === 'car') {
            setNearbyCars(prev => [vehicle, ...prev]);
            saveToStorage(CACHE_KEYS.NEARBY_CARS, [vehicle, ...nearbyCars]);
        } else if (type === 'bike') {
            setNearbyBikes(prev => [vehicle, ...prev]);
            saveToStorage(CACHE_KEYS.NEARBY_BIKES, [vehicle, ...nearbyBikes]);
        } else if (type === 'auto') {
            setNearbyAutos(prev => [vehicle, ...prev]);
            saveToStorage(CACHE_KEYS.NEARBY_AUTOS, [vehicle, ...nearbyAutos]);
        }
        // Also add to my vehicles
        setMyVehicles(prev => [vehicle, ...prev]);
        saveToStorage(CACHE_KEYS.MY_VEHICLES, [vehicle, ...myVehicles]);
    }, [nearbyCars, nearbyBikes, nearbyAutos, myVehicles]);

    // Update vehicle in cache
    const updateVehicleInCache = useCallback((vehicleId, updatedData, type) => {
        const updateList = (list) => list.map(v =>
            (v._id === vehicleId || v.id === vehicleId) ? { ...v, ...updatedData } : v
        );

        if (type === 'car') {
            const updated = updateList(nearbyCars);
            setNearbyCars(updated);
            saveToStorage(CACHE_KEYS.NEARBY_CARS, updated);
        } else if (type === 'bike') {
            const updated = updateList(nearbyBikes);
            setNearbyBikes(updated);
            saveToStorage(CACHE_KEYS.NEARBY_BIKES, updated);
        } else if (type === 'auto') {
            const updated = updateList(nearbyAutos);
            setNearbyAutos(updated);
            saveToStorage(CACHE_KEYS.NEARBY_AUTOS, updated);
        }

        // Update in my vehicles
        const updatedMyVehicles = updateList(myVehicles);
        setMyVehicles(updatedMyVehicles);
        saveToStorage(CACHE_KEYS.MY_VEHICLES, updatedMyVehicles);
    }, [nearbyCars, nearbyBikes, nearbyAutos, myVehicles]);

    // Delete vehicle from cache
    const deleteVehicleFromCache = useCallback((vehicleId, type) => {
        const filterList = (list) => list.filter(v => v._id !== vehicleId && v.id !== vehicleId);

        if (type === 'car') {
            const filtered = filterList(nearbyCars);
            setNearbyCars(filtered);
            saveToStorage(CACHE_KEYS.NEARBY_CARS, filtered);
        } else if (type === 'bike') {
            const filtered = filterList(nearbyBikes);
            setNearbyBikes(filtered);
            saveToStorage(CACHE_KEYS.NEARBY_BIKES, filtered);
        } else if (type === 'auto') {
            const filtered = filterList(nearbyAutos);
            setNearbyAutos(filtered);
            saveToStorage(CACHE_KEYS.NEARBY_AUTOS, filtered);
        }

        // Remove from my vehicles
        const filteredMyVehicles = filterList(myVehicles);
        setMyVehicles(filteredMyVehicles);
        saveToStorage(CACHE_KEYS.MY_VEHICLES, filteredMyVehicles);
    }, [nearbyCars, nearbyBikes, nearbyAutos, myVehicles]);

    // Add booking to cache
    const addBookingToCache = useCallback((booking) => {
        setMyBookings(prev => [booking, ...prev]);
        saveToStorage(CACHE_KEYS.MY_BOOKINGS, [booking, ...myBookings]);
    }, [myBookings]);

    // Update booking in cache
    const updateBookingInCache = useCallback((bookingId, updatedData) => {
        const updateList = (list) => list.map(b =>
            (b._id === bookingId || b.id === bookingId) ? { ...b, ...updatedData } : b
        );

        const updatedBookings = updateList(myBookings);
        setMyBookings(updatedBookings);
        saveToStorage(CACHE_KEYS.MY_BOOKINGS, updatedBookings);

        const updatedVehicleBookings = updateList(myVehicleBookings);
        setMyVehicleBookings(updatedVehicleBookings);
        saveToStorage(CACHE_KEYS.MY_VEHICLE_BOOKINGS, updatedVehicleBookings);
    }, [myBookings, myVehicleBookings]);

    // Clear all cache (on logout)
    const clearAllCache = useCallback(async () => {
        try {
            await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
            setNearbyCars([]);
            setNearbyBikes([]);
            setNearbyAutos([]);
            setMyVehicles([]);
            setMyBookings([]);
            setMyVehicleBookings([]);
            setNotifications([]);
            setInitialLoadDone({
                nearbyCars: false,
                nearbyBikes: false,
                nearbyAutos: false,
                myVehicles: false,
                myBookings: false,
                myVehicleBookings: false,
            });
        } catch {
            // Silent fail
        }
    }, []);

    // Refresh specific cache
    const refreshCache = useCallback(async (cacheType, userId = null, params = {}) => {
        switch (cacheType) {
            case 'nearbyCars':
                return fetchNearbyCars(params, true);
            case 'nearbyBikes':
                return fetchNearbyBikes(params, true);
            case 'nearbyAutos':
                return fetchNearbyAutos(params, true);
            case 'myVehicles':
                return fetchMyVehicles(userId, true);
            case 'myBookings':
                return fetchMyBookings(userId, true);
            case 'myVehicleBookings':
                return fetchMyVehicleBookings(userId, true);
            default:
                return null;
        }
    }, [fetchNearbyCars, fetchNearbyBikes, fetchNearbyAutos, fetchMyVehicles, fetchMyBookings, fetchMyVehicleBookings]);

    return (
        <DataCacheContext.Provider
            value={{
                // Data
                nearbyCars,
                nearbyBikes,
                nearbyAutos,
                myVehicles,
                myBookings,
                myVehicleBookings,
                notifications,

                // Loading states
                loadingStates,
                initialLoadDone,

                // Fetch methods
                fetchNearbyCars,
                fetchNearbyBikes,
                fetchNearbyAutos,
                fetchMyVehicles,
                fetchMyBookings,
                fetchMyVehicleBookings,

                // CRUD cache operations
                addVehicleToCache,
                updateVehicleInCache,
                deleteVehicleFromCache,
                addBookingToCache,
                updateBookingInCache,

                // Cache management
                clearAllCache,
                refreshCache,
            }}
        >
            {children}
        </DataCacheContext.Provider>
    );
};

export const useDataCache = () => {
    const context = useContext(DataCacheContext);
    if (!context) {
        throw new Error('useDataCache must be used within DataCacheProvider');
    }
    return context;
};
