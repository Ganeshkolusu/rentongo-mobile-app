import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import CarCard from './CarCard';

const CarsSection = ({ cars, onViewAll, onCarPress, showAll = false, onToggleShowAll, totalCount = 0 }) => {
    const hasMoreItems = totalCount > 5;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Cars</Text>
                <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
                    <Text style={styles.viewAll}>View All</Text>
                    <Text style={styles.arrow}> ❯ </Text>
                </TouchableOpacity>
            </View>

            <View>
                {cars.map((car, index) => (
                    <CarCard
                        key={car.id || index}
                        car={car}
                        onPress={() => onCarPress && onCarPress(car)}
                    />
                ))}
            </View>

            {hasMoreItems && onToggleShowAll && (
                <TouchableOpacity style={styles.showMoreButton} onPress={onToggleShowAll}>
                    <Text style={styles.showMoreText}>
                        {showAll ? 'Show Less' : 'Show More'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        paddingHorizontal: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    viewAll: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
    },
    arrow: {
        fontSize: Typography.fontSize.lg,
        color: Colors.text.primary,
        marginLeft: 4,
    },
    showMoreButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
        marginBottom: 16,
    },
    showMoreText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold || '600',
        color: '#141248',
        textDecorationLine: 'underline',
    },
});

export default CarsSection;