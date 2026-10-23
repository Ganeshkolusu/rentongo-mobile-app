import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Load user data on app start
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            // Use 'userData' key to match what LoginScreen saves
            const storedUser = await AsyncStorage.getItem('userData');
            const storedUserId = await AsyncStorage.getItem('userId');

            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Try to get userId from multiple possible sources
                const id = storedUserId || parsedUser.userId || parsedUser._id || parsedUser.id;

                if (id) {
                    setUserId(id);
                    setIsAuthenticated(true);
                }
            }

        } catch (error) {
            // Silent catch
        } finally {
            setLoading(false);
        }
    };

    const saveUserData = async (userData, id = null) => {
        try {
            // Get userId from multiple possible sources
            const userIdToSave = id || userData.userId || userData._id || userData.id;

            if (!userIdToSave) {
                throw new Error('User ID not found in response');
            }

            // Save to 'userData' key to maintain consistency
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            // Also save userId separately for screens that might need it
            await AsyncStorage.setItem('userId', userIdToSave);

            setUser(userData);
            setUserId(userIdToSave);
            setIsAuthenticated(true);

        } catch (error) {
            // Silent catch
            throw error;
        }
    };

    const updateUserData = async (updates) => {
        try {
            const updatedUser = { ...user, ...updates };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
            setUser(updatedUser);

        } catch (error) {
            // Silent catch
            throw error;
        }
    };

    const logout = async (clearCacheCallback = null) => {
        try {
            // Clear all auth-related data including 'userData'
            await AsyncStorage.multiRemove([
                'userData',
                'user',
                'userId',
                'authToken',
                // Clear cache keys
                'cache_nearby_cars',
                'cache_nearby_bikes',
                'cache_nearby_autos',
                'cache_my_vehicles',
                'cache_my_bookings',
                'cache_my_vehicle_bookings',
                'cache_user_data',
                'cache_notifications',
                'cache_timestamps',
            ]);
            setUser(null);
            setUserId(null);
            setIsAuthenticated(false);

            // Call the cache clear callback if provided
            if (clearCacheCallback && typeof clearCacheCallback === 'function') {
                clearCacheCallback();
            }

        } catch (error) {
            // Silent fail
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userId,
                loading,
                isAuthenticated,
                saveUserData,
                updateUserData,
                logout,
                loadUserData, // Expose in case you need to refresh
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};