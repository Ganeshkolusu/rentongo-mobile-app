import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';

const BikeFeatures = ({ bike }) => {
    useEffect(() => {
        if (bike) {
        }
    }, [bike]);

    if (!bike) return null;

    // Try multiple possible field name combinations
    const mileage = bike.mileage || 
                   bike.Mileage || 
                   bike.bikeMileage || 
                   bike.BikeAverageMileage ||
                   bike.averageMileage ||
                   '50';

    const fuelType = bike.fuelType || 
                    bike.fuel || 
                    bike.FuelType || 
                    bike.bikeFuelType ||
                    'Petrol';

    const engineCC = bike.engineCC || 
                    bike.EngineCC || 
                    bike.engine_cc || 
                    bike.cc || 
                    bike.CC ||
                    bike.bikeCC ||
                    bike.BikeCC ||
                    '349';


    const features = [
        {
            icon: require('../../assets/Icons/bikespeed.png'),
            text: `${mileage} Kmpl`,
        },
        {
            icon: require('../../assets/Icons/fuel.png'),
            text: typeof fuelType === 'string' 
                ? fuelType.charAt(0).toUpperCase() + fuelType.slice(1).toLowerCase()
                : fuelType,
        },
        {
            icon: require('../../assets/Icons/bikeicon.png'),
            text: `${engineCC} CC`,
        },
    ];

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

export default BikeFeatures;