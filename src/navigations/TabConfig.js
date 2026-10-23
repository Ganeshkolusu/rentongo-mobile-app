import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import MyBookingsScreen from "../screens/MyBookingsScreen";
import AccountScreen from "../screens/Tab/AccountScreen";
import AddScreen from "../screens/Tab/AddScreen";
import ProfileScreen from "../screens/Tab/ListScreen";
import RentalScreen from "../screens/Tab/RentalScreen";

export const tabConfig = [
    { key: "Rental", label: "Rental", screen: RentalScreen, icon: require("../assets/Icons/car.png"), inactiveIcon: require("../assets/Icons/inactive_car.png") },
    { key: "Listed", label: "My Booking", screen: MyBookingsScreen, icon: require("../assets/Icons/mybookings.png"), inactiveIcon: require("../assets/Icons/inactive_mybookings.png") },
    { key: "Add", label: "Add", screen: AddScreen, icon: null, isCenter: true },
    { key: "MyBookings", label: "Listed", screen: ProfileScreen, icon: require("../assets/Icons/user.png"), inactiveIcon: require("../assets/Icons/inactive_user.png") },
    { key: "Account", label: "Account", screen: AccountScreen, icon: require("../assets/Icons/account.png"), inactiveIcon: require("../assets/Icons/inactive_account.png") },
];

export const TabNavigationBar = ({ activeTab, onTabPress }) => {
    const insets = useSafeAreaInsets();
    const bottomInset = Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom;

    return (
        <View style={[styles.tabContainer, { paddingBottom: bottomInset }]}>
            <View style={styles.curvedBackground}>
                <View style={styles.centerNotch} />
                <View style={styles.tabBar}>
                    {tabConfig.slice(0, 2).map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={styles.tabItem}
                            onPress={() => onTabPress(tab.key)}
                        >
                            <Image
                                source={tab.icon}
                                style={styles.tabIcon}
                            />
                            <Text style={styles.tabLabel}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    
                    <View style={styles.centerTabSpace} />
                    
                    {tabConfig.slice(3).map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            style={styles.tabItem}
                            onPress={() => onTabPress(tab.key)}
                        >
                            <Image
                                source={tab.icon}
                                style={styles.tabIcon}
                            />
                            <Text style={styles.tabLabel}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <TouchableOpacity
                    style={styles.centerButton}
                    onPress={() => onTabPress('Add')}
                >
                    <Text style={styles.plusIcon}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    tabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'transparent',
    },
    curvedBackground: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingTop: 15,
        paddingBottom: 15,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -3,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
    },
    centerNotch: {
        position: 'absolute',
        top: -5,
        left: '50%',
        marginLeft: -45,
        width: 50,
        height: 45,
        backgroundColor: '#FFFFFF',
        borderRadius: 45,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
    },
    tabItem: {
        alignItems: 'center',
        paddingVertical: 8,
        minWidth: 60,
    },
    centerTabSpace: {
        width: 80,
    },
    centerButton: {
        position: 'absolute',
        top: -25,
        left: '50%',
        marginLeft: -30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 12,
    },
    plusIcon: {
        fontSize: Typography.fontSize.huge,
        color: Colors.white,
        fontWeight: Typography.fontWeight.fullbold,
        lineHeight: 30,
    },
    tabIcon: {
        width: 32,
        height: 32,
        marginBottom: 6,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
});

// Helper function to return the active screen
export const renderScreen = (activeTab, navigation, route, searchText, selectedAddress) => {
    const foundTab = tabConfig.find((tab) => tab.key === activeTab);
    if (foundTab && foundTab.screen) {
        const ScreenComponent = foundTab.screen;
        return <ScreenComponent navigation={navigation} route={route} searchText={searchText} selectedAddress={selectedAddress} />;
    }
    return <RentalScreen navigation={navigation} route={route} searchText={searchText} selectedAddress={selectedAddress} />;
};
