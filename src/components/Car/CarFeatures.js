import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { API_ENDPOINTS, fetchData, HTTP_METHODS } from '../../config/apiConfig';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const CarFeatures = ({ car }) => {
    const [features, setFeatures] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (car?._id) {
            fetchCarDetails(car._id);
        } else if (car) {
            // If car details already provided as prop
            extractFeatures(car);
        }
    }, [car]);

    const fetchCarDetails = async (carId) => {
        try {
            setLoading(true);
            const response = await fetchData(
                API_ENDPOINTS.GET_CAR_BY_ID(carId),
                {},
                { method: HTTP_METHODS.GET }
            );

            const fetchedCar = response?.car || response?.data || response;
            if (fetchedCar) extractFeatures(fetchedCar);
        } catch (error) {
            // Silent catch
        } finally {
            setLoading(false);
        }
    };

    const extractFeatures = (carData) => {
        const featureList = [];

        // Transmission Type - Use transmissionType from API
        const transmission = carData.transmissionType || 'Auto';
        featureList.push({
            icon: require('../../assets/Icons/automatic.png'),
            text: transmission.charAt(0).toUpperCase() + transmission.slice(1).toLowerCase(),
        });

        // Seats - Use Carseater from API
        const seats = carData.Carseater || 5;
        featureList.push({
            icon: require('../../assets/Icons/seat.png'),
            text: `${seats} Seater${seats > 1 ? 's' : ''}`,
        });

        // Fuel Type - Use fuelType from API
        const fuelType = carData.fuelType || 'Petrol';
        featureList.push({
            icon: require('../../assets/Icons/fuel.png'),
            text: fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase(),
        });

        // AC - Use Ac_available from API (boolean)
        const hasAC = carData.Ac_available === true || 
                     carData.Ac_available === 'true' || 
                     carData.Ac_available === 1;
        
        featureList.push({
            icon: require('../../assets/Icons/ac.png'),
            text: hasAC ? 'AC' : 'Non-AC',
        });

        setFeatures(featureList);
    };

    if (loading) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading car features...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.featuresRow}>
                {features.map((feature, index) => (
                    <React.Fragment key={index}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIconContainer}>
                                <Image source={feature.icon} style={styles.featureIcon} />
                            </View>
                            <Text style={styles.featureText}>{feature.text}</Text>
                        </View>
                        {index < features.length - 1 && (
                            <View style={styles.divider} />
                        )}
                    </React.Fragment>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    loaderContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
    },
    loadingText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
    featuresRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.white,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    featureItem: {
        alignItems: 'center',
        flex: 1,
    },
    featureIconContainer: {
        width: 30,
        height: 30,
        borderRadius: 26,
        backgroundColor: '#F8F9FA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    featureIcon: {
        width: 22,
        height: 22,
        tintColor: '#6B7280',
    },
    featureText: {
        fontSize: 11,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 32,
        backgroundColor: '#E8E8E8',
        marginHorizontal: Spacing.sm,
    },
});

export default CarFeatures;