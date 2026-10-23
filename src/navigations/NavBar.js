import { LinearGradient } from "expo-linear-gradient";
import * as NavigationBar from 'expo-navigation-bar';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Dimensions, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from "react-native-svg";
import { Colors } from "../constants/Colors";
import { hp, normalize, Spacing, wp } from "../constants/Dimensions";
import { Typography } from "../constants/Typography";
import { tabConfig } from "./TabConfig";

const NavBar = forwardRef(({ activeTab, setActiveTab }, ref) => {
    // Internal refs for tour targets
    const rentalTabRef = useRef(null);
    const listedTabRef = useRef(null);
    const addButtonRef = useRef(null);
    const myBookingsTabRef = useRef(null);
    const accountTabRef = useRef(null);

    // Expose refs to parent component via useImperativeHandle
    useImperativeHandle(ref, () => ({
        rentalTab: rentalTabRef,
        listedTab: listedTabRef,
        addButton: addButtonRef,
        myBookingsTab: myBookingsTabRef,
        accountTab: accountTabRef,
    }));
    // Get safe area insets for notches and navigation bars
    const insets = useSafeAreaInsets();

    // State for navigation bar visibility
    const [navBarVisible, setNavBarVisible] = useState(true);

    // Track screen dimensions for responsiveness
    const [dimensions, setDimensions] = useState(Dimensions.get('window'));

    // Check Android navigation bar visibility
    useEffect(() => {
        if (Platform.OS === 'android') {
            const checkNavBarVisibility = async () => {
                try {
                    const visibility = await NavigationBar.getVisibilityAsync();
                    setNavBarVisible(visibility === 'visible');
                } catch (error) {
                    // Default to visible if we can't determine
                    setNavBarVisible(true);
                }
            };
            checkNavBarVisibility();
        }
    }, []);

    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    // Calculate responsive dimensions
    const screenWidth = dimensions.width;
    const responsiveWidth = screenWidth;

    // Calculate bottom padding based on device
    const bottomInset = insets.bottom || 0;
    const androidNavBarPadding = navBarVisible ? 20 : 20;
    const additionalBottomPadding = Platform.OS === 'android'
        ? Math.max(bottomInset, androidNavBarPadding)
        : (bottomInset > 0 ? bottomInset : normalize(5));

    // Responsive sizing based on screen size
    const isSmallScreen = screenWidth < 360;

    // Reduced dynamic sizing
    const svgHeight = isSmallScreen ? normalize(80) : normalize(90);
    const centerButtonSize = isSmallScreen ? normalize(45) : normalize(50);
    const tabIconSize = isSmallScreen ? normalize(26) : normalize(30);
    const tabMinWidth = isSmallScreen ? wp(12) : wp(15);

    return (
        <View style={[styles.tabContainer, { paddingBottom: additionalBottomPadding }]}>
            {/* White background to fill the area below the SVG curve */}
            <View style={[styles.bottomBackground, { height: svgHeight + additionalBottomPadding }]} />
            <Svg
                width={responsiveWidth}
                height={svgHeight}
                viewBox={`0 0 ${responsiveWidth} ${svgHeight}`}
                style={[styles.svgContainer, { bottom: additionalBottomPadding }]}
            >
                <Path
                    d={`M0,35 C0,15.67 15.67,0 35,0 L${responsiveWidth * 0.32},0 C${responsiveWidth * 0.3467},0 ${responsiveWidth * 0.3733},10 ${responsiveWidth * 0.4},25 Q${responsiveWidth * 0.5},65 ${responsiveWidth * 0.6},25 C${responsiveWidth * 0.6267},10 ${responsiveWidth * 0.6533},0 ${responsiveWidth * 0.68},0 L${responsiveWidth - 35},0 C${responsiveWidth - 15.67},0 ${responsiveWidth},15.67 ${responsiveWidth},35 L${responsiveWidth},${svgHeight} L0,${svgHeight} Z`}
                    fill="white"
                    stroke='#E0E0E0'
                />
            </Svg>

            <View style={[styles.tabBar, { bottom: additionalBottomPadding }]}>
                {/* Rental Tab - Tour Target */}
                <TouchableOpacity
                    ref={rentalTabRef}
                    style={[
                        styles.tabItem,
                        { minWidth: tabMinWidth },
                        activeTab === 'Rental' ? styles.activeTab : null
                    ]}
                    onPress={() => setActiveTab('Rental')}
                >
                    <Image
                        source={activeTab === 'Rental' ? tabConfig[0].icon : (tabConfig[0].inactiveIcon || tabConfig[0].icon)}
                        style={[
                            styles.tabIcon,
                            { width: tabIconSize, height: tabIconSize },
                            activeTab === 'Rental' ? styles.activeIcon : styles.inactiveIcon
                        ]}
                    />
                    {activeTab === 'Rental' && (
                        <Text
                            style={[styles.tabLabel, styles.activeLabel]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {tabConfig[0].label}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Listed Tab (displays "My Bookings" label) - Tour Target */}
                <TouchableOpacity
                    ref={listedTabRef}
                    style={[
                        styles.tabItem,
                        { minWidth: tabMinWidth },
                        activeTab === 'Listed' ? styles.activeTab : null
                    ]}
                    onPress={() => setActiveTab('Listed')}
                >
                    <Image
                        source={activeTab === 'Listed' ? tabConfig[1].icon : (tabConfig[1].inactiveIcon || tabConfig[1].icon)}
                        style={[
                            styles.tabIcon,
                            { width: tabIconSize, height: tabIconSize },
                            activeTab === 'Listed' ? styles.activeIcon : styles.inactiveIcon
                        ]}
                    />
                    {activeTab === 'Listed' && (
                        <Text
                            style={[styles.tabLabel, styles.activeLabel]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {tabConfig[1].label}
                        </Text>
                    )}
                </TouchableOpacity>

                <View style={[styles.centerTabSpace, { width: isSmallScreen ? wp(18) : wp(20) }]} />

                {/* MyBookings Tab (displays "Listed" label) - Tour Target */}
                <TouchableOpacity
                    ref={myBookingsTabRef}
                    style={[
                        styles.tabItem,
                        { minWidth: tabMinWidth },
                        activeTab === 'MyBookings' ? styles.activeTab : null
                    ]}
                    onPress={() => setActiveTab('MyBookings')}
                >
                    <Image
                        source={activeTab === 'MyBookings' ? tabConfig[3].icon : (tabConfig[3].inactiveIcon || tabConfig[3].icon)}
                        style={[
                            styles.tabIcon,
                            { width: tabIconSize, height: tabIconSize },
                            activeTab === 'MyBookings' ? styles.activeIcon : styles.inactiveIcon
                        ]}
                    />
                    {activeTab === 'MyBookings' && (
                        <Text
                            style={[styles.tabLabel, styles.activeLabel]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {tabConfig[3].label}
                        </Text>
                    )}
                </TouchableOpacity>

                {/* Account Tab - Tour Target */}
                <TouchableOpacity
                    ref={accountTabRef}
                    style={[
                        styles.tabItem,
                        { minWidth: tabMinWidth },
                        activeTab === 'Account' ? styles.activeTab : null
                    ]}
                    onPress={() => setActiveTab('Account')}
                >
                    <Image
                        source={activeTab === 'Account' ? tabConfig[4].icon : (tabConfig[4].inactiveIcon || tabConfig[4].icon)}
                        style={[
                            styles.tabIcon,
                            { width: tabIconSize, height: tabIconSize },
                            activeTab === 'Account' ? styles.activeIcon : styles.inactiveIcon
                        ]}
                    />
                    {activeTab === 'Account' && (
                        <Text
                            style={[styles.tabLabel, styles.activeLabel]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {tabConfig[4].label}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Center Add Button - Tour Target */}
            <TouchableOpacity
                ref={addButtonRef}
                style={[
                    styles.centerButton,
                    {
                        position: 'absolute',
                        bottom: additionalBottomPadding + svgHeight - centerButtonSize / 2 - 5,
                        left: '50%',
                        marginLeft: -centerButtonSize / 2,
                        width: centerButtonSize,
                        height: centerButtonSize,
                        borderRadius: centerButtonSize / 2,
                    }
                ]}
                onPress={() => setActiveTab('Add')}
            >
                <LinearGradient
                    colors={['#63C8FF', '#4A5D9C']}
                    style={[
                        styles.centerButtonGradient,
                        {
                            borderRadius: centerButtonSize / 2,
                        }
                    ]}
                    start={{ x: 1, y: 0 }}
                    end={{ x: 0, y: 1 }}
                >
                    <Text style={[
                        styles.plusIcon,
                        { fontSize: isSmallScreen ? 28 : 32 }
                    ]}>
                        +
                    </Text>
                </LinearGradient>
                {activeTab === 'Add' && (
                    <Text style={[
                        styles.centerButtonLabel,
                        { bottom: isSmallScreen ? normalize(-24) : normalize(-28) }
                    ]}>
                        Listings
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        alignItems: 'center',
        backgroundColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: normalize(8),
        },
        shadowOpacity: 0.12,
        shadowRadius: normalize(10),
        elevation: 10,
    },
    svgContainer: {
        position: 'absolute',
        bottom: 0,
    },
    bottomBackground: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        top: 0,
        backgroundColor: '#FFFFFF',
    },
    tabBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.md,
        paddingBottom: normalize(6),
    },
    tabItem: {
        alignItems: 'center',
        paddingVertical: normalize(3),
        marginBottom: normalize(3),
        top: hp(-0.3),
    },
    centerTabSpace: {
        // Width set dynamically
    },
    centerButton: {
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    centerButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: normalize(4),
        },
        shadowOpacity: 0.4,
        shadowRadius: normalize(12),
        elevation: 12,
    },
    plusIcon: {
        color: Colors.white,
        fontWeight: '900',
        textAlign: 'center',
        includeFontPadding: false,
    },
    tabIcon: {
        resizeMode: 'contain',
    },
    activeIcon: {
        // tintColor: '#4A90E2',
    },
    inactiveIcon: {
        // tintColor: '#B0B0B0',
    },
    tabLabel: {
        fontSize: Typography.fontSize.xs,
        lineHeight: Typography.lineHeight.xs,
        fontWeight: Typography.fontWeight.semiBold,
        textAlign: 'center',
        marginTop: 1,
    },
    activeLabel: {
        color: Colors.dotActive,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.sm,
    },
    activeTab: {
        // Additional styling for active tab if needed
    },
    centerButtonLabel: {
        position: 'absolute',
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.sm,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.dotActive,
        textAlign: 'center',
        width: '100%',
    },
});

export default NavBar;
