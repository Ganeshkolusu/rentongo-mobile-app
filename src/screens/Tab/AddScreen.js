import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import VehicleCard from '../../components/VehicleCard';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const AddScreen = () => {
    const navigation = useNavigation();

    const handleCarPress = () => {
        try {
            navigation.navigate('ListYourCarScreen');
        } catch (error) {
            // Silent catch
        }
    };

    // const handleAutoPress = () => {
    //     try {
    //         navigation.navigate('ListYourAutoScreen');
    //     } catch (error) {
    //         console.error('Navigation Error', error.message);
    //     }
    // };

    const handleBikePress = () => {
        try {
            navigation.navigate('ListYourBikeScreen');
        } catch (error) {
            // Silent catch
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Select Vehicle</Text>

            <VehicleCard
                title="Car"
                icon={require('../../assets/Icons/car.png')}
                onPress={handleCarPress}
                style={styles.cardSpacing}
            />

            {/* <VehicleCard
                title="Auto"
                icon={require('../../assets/Icons/auto.png')}
                onPress={handleAutoPress}
                style={styles.cardSpacing}
            /> */}

            <VehicleCard
                title="Bike"
                icon={require('../../assets/Icons/bike.png')}
                onPress={handleBikePress}
                style={styles.cardSpacing}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        padding: Spacing.lg,
        marginTop: Platform.OS === 'android' ? normalize(20) : normalize(-40)
    },
    title: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        marginTop: -30
    },
    cardSpacing: {
        marginBottom: Spacing.sm,
    },
});

export default AddScreen;
