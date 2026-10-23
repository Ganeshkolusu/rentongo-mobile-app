import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
    Alert,
    BackHandler,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    ToastAndroid,
    View
} from 'react-native';
import GradientHeader from '../../components/Header/GradientHeader';
import MenuItem from '../../components/MenuItem/MenuItem';
import { Colors } from '../../constants/Colors';
import { hp, normalize, responsiveValue, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';

const APP_TOUR_COMPLETED_KEY = 'appTourCompleted';

const { width, height } = Dimensions.get('window');

const AccountScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'DashBoard' }],
                });
                return true; // block exit modal
            };

            const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

            return () => subscription.remove();
        }, [])
    );

    // Handle logout
    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        // Clear user data from context and AsyncStorage
                        await logout();

                        // Navigate to LoginScreen and reset navigation stack
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'LoginScreen' }],
                        });
                    }
                }
            ]
        );
    };

    const profileMenuItems = [
        { id: 1, title: 'My Profile', icon: require('../../assets/Icons/profile.png') },
        //  { id: 2, title: 'My Bookings', icon: require('../../assets/Icons/profilecalender.png') },
        //  {id:2, title:'My Chats', icon:require('../../assets/Icons/gradientchat.png')},
        //  { id: 3, title: 'My Listing Bookings', icon: require('../../assets/Icons/listing.png') },
        // { id: 2, title: 'Refer & Earn', icon: require('../../assets/Icons/referandearn.png') },
    ];

    const supportMenuItems = [
        { id: 1, title: 'Privacy Policy', icon: require('../../assets/Icons/privacypolicy.png') },
        { id: 2, title: 'About Us', icon: require('../../assets/Icons/info.png') },
        { id: 3, title: 'Rise Ticket', icon: require('../../assets/Icons/gradientticket.png') },
        { id: 4, title: 'Help', icon: require('../../assets/Icons/profilemessage.png') },
        // { id: 5, title: 'View App Tips', icon: require('../../assets/Icons/info.png') },
        { id: 5, title: 'Logout', icon: require('../../assets/Icons/logout.png') },
    ];

    // Handle View App Tips - reset tour and navigate to dashboard
    const handleViewAppTips = async () => {
        try {
            await AsyncStorage.removeItem(APP_TOUR_COMPLETED_KEY);
            if (Platform.OS === 'android') {
                ToastAndroid.show('App tour will start on the home screen', ToastAndroid.SHORT);
            }
            // Navigate to Dashboard to show tour
            navigation.reset({
                index: 0,
                routes: [{ name: 'DashBoard', params: { startTour: true } }],
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to reset app tour');
        }
    };

    const handleMenuPress = (item) => {
        // Navigate to menu items
        if (item.title === 'My Profile') navigation.navigate('MyProfileScreen');
        else if (item.title === 'Privacy Policy') navigation.navigate('PrivacyPolicyScreen');
        //  else if (item.title === 'My Bookings') navigation.navigate('MyBookingsScreen');
        //   else if (item.title === 'My Chats') navigation.navigate('MyChartsScreen');
        // else if (item.title === 'My Listing Bookings') navigation.navigate('MyListedBookingsScreen');
        // else if (item.title === 'Refer & Earn') navigation.navigate('ReferEarnScreen');
        else if (item.title === 'Rise Ticket') navigation.navigate('TicketDetailsScreen');
        else if (item.title === 'Help') navigation.navigate('HelpScreen');
        else if (item.title === 'About Us') navigation.navigate('AboutUsScreen');
        // else if (item.title === 'View App Tips') handleViewAppTips();
        else if (item.title === 'Logout') handleLogout();
    };

    return (
        <View style={styles.container}>
            <GradientHeader
                showProfileHeader={true}
                userAvatar={user?.profileImage || null}
                userName={user?.name || 'Guest User'}
                onImagePress={() => navigation.navigate('MyProfileScreen')}
                showBackButton={true}
                showMoreButton={false}
                gradientColors={Colors.gradient.primary}
                showEditBadge={true}
                showIconBackground={false}
                iconColor={Colors.white}
                onBackPress={() => {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'DashBoard' }],
                    });
                }}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>
                    {profileMenuItems.map((item) => (
                        <MenuItem key={item.id} item={item} onPress={handleMenuPress} />
                    ))}

                    <Text style={styles.sectionTitle}>Support & Settings</Text>
                    {supportMenuItems.map((item) => (
                        <MenuItem key={item.id} item={item} onPress={handleMenuPress} />
                    ))}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        marginBottom: Platform.OS === 'ios' ? 0 : hp(10),
    },
    content: {
        flex: 1,
        paddingTop: Spacing.lg,
    },
    section: {
        backgroundColor: Colors.white,
        marginHorizontal: responsiveValue(Spacing.sm, Spacing.md, Spacing.lg),
        marginBottom: Spacing.md,
        borderRadius: normalize(12),
        paddingVertical: Spacing.xs,
    },
    sectionTitle: {
        fontSize: responsiveValue(normalize(16), normalize(17), normalize(18)),
        fontWeight: '600',
        color: Colors.black,
        fontFamily: Typography.fontFamily.medium,
        marginLeft: Spacing.md,
        marginTop: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    bottomSpacing: {
        height: responsiveValue(hp(8), hp(10), hp(12)),
    },
});

export default AccountScreen;
