import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { normalize, wp, Spacing, BorderRadius } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const SearchBar = ({
    placeholder = 'Search',
    value,
    onChangeText,
    onFilterPress,
    style,
    filterRef,
}) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.searchInputContainer}>
                <Image
                    source={require('../assets/Icons/search.png')}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.searchInput}
                    placeholder={placeholder}
                    placeholderTextColor="#A8A8A8"
                    value={value}
                    onChangeText={onChangeText}
                />
                {onFilterPress && (
    <TouchableOpacity
        ref={filterRef}
        style={styles.filterButtonContainer}
        onPress={onFilterPress}
    >
        <LinearGradient
            colors={['#63C8FF', '#4A5D9C']}
            style={styles.filterButton}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <Image
                source={require('../assets/Icons/filter.png')}
                style={styles.filterIcon}
            />
        </LinearGradient>
    </TouchableOpacity>
)}

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
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
        width: normalize(20),
        height: normalize(20),
        marginRight: Spacing.sm,
        tintColor: '#A8A8A8',
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        color: '#2C3E50',
        paddingVertical: 0,
        fontFamily: Typography.fontFamily.regular,
    },
    filterButtonContainer: {
        marginLeft: Spacing.sm,
    },
    filterButton: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: BorderRadius.circle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: '#FFFFFF',
    },
});

export default SearchBar;