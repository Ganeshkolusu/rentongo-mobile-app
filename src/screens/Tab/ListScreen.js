import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, BackHandler, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bikeService, carService, userService } from '../../api';
import ConfirmationPopup from '../../components/ConfirmationPopup';
import Header from '../../components/Header/Header';
import ListedBikeCard from '../../components/ListedBikeCard';
import ListedCarCard from '../../components/ListedCarCard';
import TabSelector from '../../components/TabSelector';
import { Colors } from '../../constants/Colors';
import { BorderRadius, hp, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';

const ListScreen = ({ navigation }) => {

    const { userId, user } = useAuth();
    const [searchText, setSearchText] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const [listedCars, setListedCars] = useState([]);
    const [listedBikes, setListedBikes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [approvedVehicles, setApprovedVehicles] = useState(new Set());

    const tabs = [
        { label: 'Listed Cars', icon: 'car-alt' },
        { label: 'Listed Bikes', icon: require('../../assets/Icons/bike.png') }
    ];

    /**
     * 🚀 FIX: Override hardware back button
     */
    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'DashBoard' }],
                });
                return true;
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [])
    );

    /**
     * Fetch User's Listed Vehicles
     */
    const fetchMyVehicles = useCallback(async () => {
        // Use userId from context, or fallback to user._id
        const idToUse = userId || user?._id || user?.userId;

        if (!idToUse) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Call myVehicles API
            const response = await userService.getMyVehicles(idToUse);

            // Extract cars and bikes from response
            const cars = response?.data?.cars || [];
            const bikes = response?.data?.bikes || [];

            setListedCars(cars);
            setListedBikes(bikes);

        } catch (error) {
            // Silently handle 404 errors (can happen after deletion)
            // Only show alert for other errors
            if (!error.message?.includes('404') && !error.message?.includes('not found')) {
                Alert.alert('Error', error.message || 'Failed to fetch vehicles');
            }
            setListedCars([]);
            setListedBikes([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, user]);

    /**
     * Initial load and refresh when userId or user changes
     */
    useEffect(() => {
        const idToUse = userId || user?._id || user?.userId;
        if (idToUse) {
            fetchMyVehicles();
        }
    }, [userId, user, fetchMyVehicles]);

    /**
     * Pull to refresh handler
     */
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchMyVehicles();
    }, [fetchMyVehicles]);

    /**
     * Map API response to card props for Cars
     */
    const mapCarData = (car) => ({
        carId: car._id,
        carName: car.CarName,
        image: car.carImages && car.carImages.length > 0
            ? car.carImages[0]
            : require('../../assets/Images/car.png'),
        transmission: car.transmissionType || 'Automatic',
        seats: `${car.Carseater || 5} Seaters`,
        fuel: car.fuelType || 'Petrol',
        price: car.RentPerHour?.toString() || '0',
        location: `${car.pickupArea || ''}, ${car.pickupCity || ''}${car.pickupCityPinCode ? ` - ${car.pickupCityPinCode}` : ''}`.trim(),
        isAvailable: car.Available !== false,
        rawData: car,
    });

    /**
     * Map API response to card props for Bikes
     */
    const mapBikeData = (bike) => ({
        bikeId: bike._id,
        bikeName: bike.bikeName,
        image: bike.bikeImages && bike.bikeImages.length > 0
            ? bike.bikeImages[0]
            : require('../../assets/Images/bike.png'),
        transmission: 'Manual',
        fuel: 'Petrol',
        engine: bike.bikeModel || 'N/A',
        price: bike.pricePerKm?.toString() || '0',
        location: `${bike.pickupArea || ''}, ${bike.pickupCity || ''}${bike.pickupCityPinCode ? ` - ${bike.pickupCityPinCode}` : ''}`.trim(),
        isAvailable: bike.Available !== false,
        rawData: bike,
    });

    /**
     * Get current vehicle list based on active tab
     */
    const currentVehicles = activeTab === 0
        ? listedCars.map(mapCarData)
        : listedBikes.map(mapBikeData);

    /**
     * Filter vehicles based on search
     */
    const filteredVehicles = currentVehicles.filter(vehicle => {
        const name = vehicle.carName || vehicle.bikeName || '';
        const location = vehicle.location || '';

        return (
            name.toLowerCase().includes(searchText.toLowerCase()) ||
            location.toLowerCase().includes(searchText.toLowerCase())
        );
    });

    const handleBackPress = () => {
        navigation.reset({
            index: 0,
            routes: [{ name: 'DashBoard' }],
        });
    };

    const handleVehiclePress = (vehicle) => {};

    const handleEdit = (vehicle) => {
        if (activeTab === 0) {
            navigation.navigate('EditCarDetailsScreen', {
                car: vehicle.rawData,
                carId: vehicle.carId,
            });
        } else {
            navigation.navigate('EditBikeDetailsScreen', {
                bike: vehicle.rawData,
                bikeId: vehicle.bikeId,
            });
        }
    };

    const handleDelete = (vehicle) => {
        setVehicleToDelete(vehicle);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;

        try {
            const vehicleId = vehicleToDelete.carId || vehicleToDelete.bikeId;

            const response = activeTab === 0
                ? await carService.deleteCar(vehicleId)
                : await bikeService.deleteBike(vehicleId);

            await fetchMyVehicles();

            Alert.alert('Success', `${activeTab === 0 ? 'Car' : 'Bike'} deleted successfully`);

        } catch (error) {
            // Silently handle 404 errors (vehicle already deleted)
            if (!error.message?.includes('404') && !error.message?.includes('not found')) {
                Alert.alert('Error', error.message || 'Failed to delete vehicle');
            }
        } finally {
            setShowDeleteConfirm(false);
            setVehicleToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setVehicleToDelete(null);
    };

    const handleCarAvailabilityChange = (vehicleId, newStatus) => {
        if (activeTab === 0) {
            setListedCars(prevCars =>
                prevCars.map(car =>
                    car._id === vehicleId
                        ? { ...car, Available: newStatus }
                        : car
                )
            );
        } else {
            setListedBikes(prevBikes =>
                prevBikes.map(bike =>
                    bike._id === vehicleId
                        ? { ...bike, Available: newStatus }
                        : bike
                )
            );
        }
    };

    const handleApprovalChange = (vehicleId, status) => {
        if (status === 'approved') {
            setApprovedVehicles(prev => new Set([...prev, vehicleId]));
        }
    };

    /**
     * Render Loading State
     */
    if (loading && !refreshing) {
        return (
            <View style={styles.container}>
                <Header
                    onBackPress={handleBackPress}
                    title="My Vehicles"
                    gradientColors={['#63C8FF', '#141248']}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.activeTab} />
                    <Text style={styles.loadingText}>Loading vehicles...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleBackPress}
                title="My Vehicles"
                gradientColors={['#63C8FF', '#141248']}
            />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Icon name="search" size={normalize(20)} color="#A8A8A8" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search"
                        placeholderTextColor="#A8A8A8"
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                </View>
            </View>

            <TabSelector
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={(index) => {
                    setActiveTab(index);
                    setSearchText('');
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.activeTab]}
                        tintColor={Colors.activeTab}
                    />
                }
            >
                {filteredVehicles.length > 0 ? (
                    filteredVehicles.map((vehicle) => (
                        activeTab === 0 ? (
                            <ListedCarCard
                                key={vehicle.carId}
                                carId={vehicle.carId}
                                carName={vehicle.carName}
                                image={vehicle.image}
                                transmission={vehicle.transmission}
                                seats={vehicle.seats}
                                fuel={vehicle.fuel}
                                price={vehicle.price}
                                location={vehicle.location}
                                isAvailable={vehicle.isAvailable}
                                rawData={vehicle.rawData}
                                onPress={() => handleVehiclePress(vehicle)}
                                onEdit={() => handleEdit(vehicle)}
                                onDelete={() => handleDelete(vehicle)}
                                onAvailabilityChange={(newStatus) =>
                                    handleCarAvailabilityChange(vehicle.carId, newStatus)
                                }
                                onRefresh={fetchMyVehicles}
                                approvalStatus={approvedVehicles.has(vehicle.carId) ? 'approved' : 'pending'}
                                onApprovalChange={handleApprovalChange}
                            />
                        ) : (
                            <ListedBikeCard
                                key={vehicle.bikeId}
                                bikeId={vehicle.bikeId}
                                bikeName={vehicle.bikeName}
                                image={vehicle.image}
                                transmission={vehicle.transmission}
                                fuel={vehicle.fuel}
                                engine={vehicle.engine}
                                price={vehicle.price}
                                location={vehicle.location}
                                isAvailable={vehicle.isAvailable}
                                rawData={vehicle.rawData}
                                onEdit={() => handleEdit(vehicle)}
                                onDelete={() => handleDelete(vehicle)}
                                onAvailabilityChange={(newStatus) =>
                                    handleCarAvailabilityChange(vehicle.bikeId, newStatus)
                                }
                                onRefresh={fetchMyVehicles}
                                approvalStatus={approvedVehicles.has(vehicle.bikeId) ? 'approved' : 'pending'}
                                onApprovalChange={handleApprovalChange}
                            />
                        )
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Icon
                            name={activeTab === 0 ? "directions-car" : "two-wheeler"}
                            size={normalize(60)}
                            color="#999999"
                        />
                        <Text style={styles.emptyText}>
                            {activeTab === 0 ? 'No cars found' : 'No bikes found'}
                        </Text>
                        <Text style={styles.emptySubText}>
                            {searchText
                                ? 'Try adjusting your search'
                                : `Add your first ${activeTab === 0 ? 'car' : 'bike'}`
                            }
                        </Text>
                        {!searchText && (
                            <TouchableOpacity
                                style={styles.addButton}
                                onPress={() => {
                                    if (!userId) {
                                        Alert.alert('Error', 'User ID not found');
                                        return;
                                    }

                                    if (activeTab === 0) {
                                        navigation.navigate('ListYourCarScreen', { userId });
                                    } else {
                                        navigation.navigate('ListYourBikeScreen', { userId });
                                    }
                                }}
                            >
                                <Text style={styles.addButtonText}>
                                    Add {activeTab === 0 ? 'Car' : 'Bike'}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            <ConfirmationPopup
                visible={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
                title="Are you sure?"
                message={`Do you want to delete this ${activeTab === 0 ? 'car' : 'bike'}?`}
                confirmText="Yes"
                cancelText="No"
                confirmButtonVariant="filled"
                cancelButtonVariant="outline"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    searchContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.sm,
        paddingVertical: normalize(1),
        borderWidth: normalize(1),
        borderColor: '#E9ECEF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: normalize(2),
        },
        shadowOpacity: 0.08,
        shadowRadius: normalize(4),
        elevation: 2,
    },
    searchIcon: {
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        color: '#2C3E50',
        paddingVertical: normalize(12),
        fontFamily: Typography.fontFamily.regular,
    },
    scrollView: {
        flex: 1,
        marginBottom: normalize(65)
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: hp(10),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(10),
    },
    emptyText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        marginTop: Spacing.md,
    },
    emptySubText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    addButton: {
        marginTop: Spacing.lg,
        backgroundColor: Colors.activeTab,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    addButtonText: {
        color: Colors.white,
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.medium,
    },
});

export default ListScreen;
