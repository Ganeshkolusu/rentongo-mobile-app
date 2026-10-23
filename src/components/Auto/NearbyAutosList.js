import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, wp, hp } from '../../constants/Dimensions';
import AutoCard from './AutoCard';

const NearbyAutosList = ({ autos, onAutoPress, navigation }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nearby Auto's</Text>
            </View>

            <ScrollView
                style={styles.listContainer}
                showsVerticalScrollIndicator={false}
            >
                {autos.map((auto, index) => (
                    <AutoCard
                        key={auto.id || index}
                        auto={auto}
                        onPress={onAutoPress}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        // minHeight: hp(100),
    },
    header: {
        paddingHorizontal: wp(4),
        paddingBottom: hp(1),
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: wp(5),
        marginBottom: hp(16),
    },
});

export default NearbyAutosList;