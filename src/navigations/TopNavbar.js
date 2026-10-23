import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useSocket } from '../context/SocketContext';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;

const TopNavbar = forwardRef(({
    onFilterPress,
    onNotificationPress,
    onLocationPress,
    selectedAddress = null,
    onSearchTextChange,
}, ref) => {
    const [searchText, setSearchText] = useState('');
    const insets = useSafeAreaInsets();
    const { notificationCount, clearNotificationCount } = useSocket();

    // Internal refs for tour targets
    const locationRef = useRef(null);
    const notificationRef = useRef(null);
    const searchBarRef = useRef(null);
    const filterRef = useRef(null);

    // Expose refs to parent component via useImperativeHandle
    useImperativeHandle(ref, () => ({
        locationSelector: locationRef,
        notificationButton: notificationRef,
        searchBar: searchBarRef,
        filterButton: filterRef,
    }));

    const handleNotificationPress = () => {
        clearNotificationCount();
        onNotificationPress?.();
    };

    const handleSearchTextChange = (text) => {
        setSearchText(text);
        onSearchTextChange?.(text);
    };

    // For Android with translucent StatusBar, use STATUSBAR_HEIGHT; for iOS use insets
    const topPadding = Platform.OS === 'android' ? STATUSBAR_HEIGHT : (insets.top > 0 ? insets.top : 0);

    return (
        <View style={[styles.gradientContainer, { paddingTop: topPadding + Spacing.sm }]}>
            <View style={styles.content}>
                <View style={styles.topRow}>
                    {/* Location Selector - Tour Target */}
                    <TouchableOpacity
                        ref={locationRef}
                        style={styles.locationContainer}
                        onPress={onLocationPress}
                    >
                        <Image
                            source={require('../assets/Icons/vector_location.png')}
                            style={styles.locationIcon}
                        />
                        <View style={styles.locationTextContainer}>
                            {selectedAddress && typeof selectedAddress === 'object' && selectedAddress.name ? (
                                <>
                                    <Text style={styles.locationTitle} numberOfLines={1}>
                                        {selectedAddress.name}
                                    </Text>
                                    <Text style={styles.locationSubtitle} numberOfLines={1}>
                                        {selectedAddress.area && selectedAddress.city ?
                                            `${selectedAddress.area}, ${selectedAddress.city}` :
                                            selectedAddress.fullAddress || selectedAddress.name
                                        }
                                        {selectedAddress.pincode && ` - ${selectedAddress.pincode}`}
                                    </Text>
                                </>
                            ) : selectedAddress && typeof selectedAddress === 'string' ? (
                                <>
                                    <Text style={styles.locationTitle}>{selectedAddress}</Text>
                                    <Text style={styles.locationSubtitle}>Selected Location</Text>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.locationTitle}>Fetching location...</Text>
                                    <Text style={styles.locationSubtitle}>Please wait</Text>
                                </>
                            )}
                        </View>
                        <Image
                            source={require('../assets/Icons/dropdown.png')}
                            style={styles.dropdownIcon}
                        />
                    </TouchableOpacity>

                    {/* Notification Button - Tour Target */}
                    <TouchableOpacity
                        ref={notificationRef}
                        style={styles.notificationButton}
                        onPress={handleNotificationPress}
                    >
                        <Image
                            source={require('../assets/Icons/notification.png')}
                            style={styles.notificationIcon}
                        />
                        {notificationCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {notificationCount > 99 ? '99+' : notificationCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Search Bar - Tour Target */}
                <View ref={searchBarRef} style={styles.searchBarWrapper}>
                    <SearchBar
                        placeholder="Search"
                        value={searchText}
                        onChangeText={handleSearchTextChange}
                        onFilterPress={onFilterPress}
                        style={styles.searchBarContainer}
                        filterRef={filterRef}
                    />
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    gradientContainer: {
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: normalize(3) },
        shadowOpacity: 0.1,
        shadowRadius: normalize(6),
        elevation: 6,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        zIndex: 10,
    },
    content: {
        justifyContent: 'center',
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    locationIcon: {
        width: normalize(20),
        height: normalize(20),
        marginRight: Spacing.sm,
        tintColor: Colors.dotActive,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationTitle: {
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.lineHeight.lg,
        fontWeight: Typography.fontWeight.semiBold,
        color: '#2C3E50',
        marginBottom: normalize(2),
        width: wp(60),
    },
    locationSubtitle: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.sm,
        color: '#7F8C8D',
    },
    dropdownIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: '#7F8C8D',
        marginRight: Spacing.xl,
        marginBottom: Spacing.sm,
    },
    notificationButton: {
        width: normalize(32),
        height: normalize(32),
        borderRadius: normalize(25),
        backgroundColor: '#F5F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: normalize(2) },
        shadowOpacity: 0.25,
        shadowRadius: normalize(4),
        elevation: 3,
        marginLeft: Spacing.sm,
    },
    notificationIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.black,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -5,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 18,
        height: 15,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.white,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: 'bold',
    },
    searchBarContainer: {
        marginTop: Spacing.sm,
        marginHorizontal: -Spacing.lg,
    },
    searchBarWrapper: {
        width: '100%',
    },
});

export default TopNavbar;
