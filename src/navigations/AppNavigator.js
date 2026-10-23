// src/navigation/Navigation.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { ActivityIndicator, View, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../services/NavigationService';

// Essential screens loaded immediately (needed for startup)
import OnboardingScreen from '../screens/OnboardingScreen/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen/LoginScreen';
import Dashboard from '../screens/Dashboard/Dashboard';
// Not lazy loaded to prevent loading screen when returning from image picker
import ListYourBikeScreen from '../screens/ListYourBikeScreen';
import ListYourCarScreen from '../screens/ListYourCarScreen';
// Not lazy loaded - frequently used screens
import FilterScreen from '../screens/FilterScreen';
import DateTimeSelectionScreen from '../screens/DateTimeSelectionScreen';
import DateTimeMyBookingsScreen from '../screens/DateTimeMyBookingsScreen';
import NearbyCarsScreen from '../screens/NearbyCarsScreen';
import NearbyBikeScreen from '../screens/NearbyBikeScreen';
import NearbyAutoScreen from '../screens/NearbyAutoScreen';
import CarDetailsScreen from '../screens/CarDetailsScreen';
import BikeDetailsScreen from '../screens/BikeDetailsScreen';
import AutoDetailsScreen from '../screens/AutoDetailsScreen';
// Ticket screens - not lazy loaded to avoid blank screen in release APK
import RiseTicketScreen from '../screens/RiseTicketScreen';
import TicketDetailsScreen from '../screens/TicketDetailsScreen';

// Lazy loaded screens - loaded only when needed
const AboutUsScreen = lazy(() => import('../screens/AboutUsScreen'));
const AddReviewScreen = lazy(() => import('../screens/AddReviewScreen'));
const BookingDetailsScreen = lazy(() => import('../screens/BookingDetailsScreen'));
const BookingHistoryScreen = lazy(() => import('../screens/BookingHistoryScreen'));
const BookingRejectScreen = lazy(() => import('../components/BookingRejectScreen'));
const BookNowScreen = lazy(() => import('../screens/BookNowScreen'));
const CallHistoryScreen = lazy(() => import('../screens/CallHistoryScreen'));
const CallScreen = lazy(() => import('../screens/CallScreen'));
const ChangeLocationScreen = lazy(() => import('../screens/ChangeLocationScreen/ChangeLocationScreen'));
const MapPickerScreen = lazy(() => import('../screens/ChangeLocationScreen/MapPickerScreen'));
const ChatScreen = lazy(() => import('../screens/ChatScreen'));
const EditAutoDetailsScreen = lazy(() => import('../screens/EditAutoDetailsScreen'));
const EditBikeDetailsScreen = lazy(() => import('../screens/EditBikeDetailsScreen'));
const EditCarDetailsScreen = lazy(() => import('../screens/EditCarDetailsScreen'));
const EditReviewScreen = lazy(() => import('../screens/EditReviewScreen'));
const HelpScreen = lazy(() => import('../screens/HelpScreen'));
const IncomingCallScreen = lazy(() => import('../screens/IncomingCallScreen'));
const ListYourAutoScreen = lazy(() => import('../screens/ListYourAutoScreen'));
const MyBookingsScreen = lazy(() => import('../screens/MyBookingsScreen'));
const MyChartsScreen = lazy(() => import('../screens/MyChatsScreen'));
const MyListedBookingsScreen = lazy(() => import('../screens/MyListedBookingsScreen'));
const MyProfileScreen = lazy(() => import('../screens/MyProfileScreen'));
const NotificationScreen = lazy(() => import('../screens/NotificationScreen'));
const PendingBookingsScreen = lazy(() => import('../screens/PendingBookingsScreen'));
const PrivacyPolicyScreen = lazy(() => import('../screens/PrivacyPolicyScreen'));
const RedeemRewardsScreen = lazy(() => import('../screens/RedeemRewardsScreen'));
const ReferEarnScreen = lazy(() => import('../screens/ReferEarnScreen'));
const RequestStatusScreen = lazy(() => import('../screens/RequestStatusScreen'));
const ReviewsListScreen = lazy(() => import('../screens/ReviewsListScreen'));
const SubscriptionScreen = lazy(() => import('../screens/SubscriptionScreen'));
const ListScreen = lazy(() => import('../screens/Tab/ListScreen'));

// Loading fallback for lazy loaded screens
const ScreenLoader = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
    <ActivityIndicator size="large" color="#7096e6" />
  </View>
);

// Wrapper for lazy loaded screens
const withSuspense = (Component) => (props) => (
  <Suspense fallback={<ScreenLoader />}>
    <Component {...props} />
  </Suspense>
);


const Stack = createStackNavigator();

const Navigation = () => {

    const { saveUserData } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('OnboardingScreen');

    useEffect(() => {
        checkAuthState();
    }, []);

    const checkAuthState = async () => {
        try {

            // Check if user has seen onboarding
            const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
            
            // Check if user is logged in
            const userData = await AsyncStorage.getItem('userData');
            

            if (userData) {
                // User is logged in - go directly to Dashboard
                const parsedUser = JSON.parse(userData);
                await saveUserData(parsedUser);
                setInitialRoute('DashBoard');

            } else if (hasSeenOnboarding === 'true') {
                // User has seen onboarding but not logged in
                setInitialRoute('LoginScreen');

            } else {
                // First time user
                setInitialRoute('OnboardingScreen');

            }
        } catch (error) {

            setInitialRoute('OnboardingScreen');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#7096e6ff' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    return (
        <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#FFFFFF' },
                    gestureEnabled: Platform.OS === 'ios',
                    animationEnabled: true,
                    freezeOnBlur: false,
                }}
                initialRouteName={initialRoute}
            >
                {/* Essential screens - not lazy loaded */}
                <Stack.Screen name="OnboardingScreen" component={OnboardingScreen} />
                <Stack.Screen name="LoginScreen" component={LoginScreen} />
                <Stack.Screen name="DashBoard" component={Dashboard} />

                {/* Frequently used screens - not lazy loaded */}
                <Stack.Screen name="FilterScreen" component={FilterScreen} />
                <Stack.Screen name="DateTimeSelectionScreen" component={DateTimeSelectionScreen} />
                <Stack.Screen name="DateTimeMyBookingsScreen" component={DateTimeMyBookingsScreen}/>
                <Stack.Screen name="NearbyCarsScreen" component={NearbyCarsScreen} />
                <Stack.Screen name="NearbyAutoScreen" component={NearbyAutoScreen}/>
                <Stack.Screen name="NearbyBikeScreen" component={NearbyBikeScreen}/>
                <Stack.Screen name="CarDetailsScreen" component={CarDetailsScreen} />
                <Stack.Screen name="AutoDetailsScreen" component={AutoDetailsScreen} />
                <Stack.Screen name="BikeDetailsScreen" component={BikeDetailsScreen}/>

                {/* Lazy loaded screens with Suspense wrapper */}
                <Stack.Screen name="RequestStatusScreen" component={withSuspense(RequestStatusScreen)}/>
                <Stack.Screen name="BookNowScreen" component={withSuspense(BookNowScreen)} />
                <Stack.Screen name="ChangeLocationScreen" component={withSuspense(ChangeLocationScreen)} />
                <Stack.Screen name="BookingRejectScreen" component={withSuspense(BookingRejectScreen)}/>
                <Stack.Screen name="ChatScreen" component={withSuspense(ChatScreen)}/>
                <Stack.Screen name="CallScreen" component={withSuspense(CallScreen)}/>
                <Stack.Screen name="IncomingCallScreen" component={withSuspense(IncomingCallScreen)}/>
                <Stack.Screen name="CallHistoryScreen" component={withSuspense(CallHistoryScreen)}/>
                <Stack.Screen name="RiseTicketScreen" component={RiseTicketScreen}/>
                <Stack.Screen name="TicketDetailsScreen" component={TicketDetailsScreen}/>
                <Stack.Screen name="AddReviewScreen" component={withSuspense(AddReviewScreen)}/>
                <Stack.Screen name="ReviewsListScreen" component={withSuspense(ReviewsListScreen)}/>
                <Stack.Screen name="EditReviewScreen" component={withSuspense(EditReviewScreen)}/>
                <Stack.Screen name="PendingBookingsScreen" component={withSuspense(PendingBookingsScreen)}/>
                <Stack.Screen name="ListScreen" component={withSuspense(ListScreen)}/>
                <Stack.Screen
                    name="MapPickerScreen"
                    component={withSuspense(MapPickerScreen)}
                    options={{ headerShown: false }}
                />
                <Stack.Screen name="NotificationScreen" component={withSuspense(NotificationScreen)} />
                <Stack.Screen
                    name="ListYourCarScreen"
                    component={ListYourCarScreen}
                    options={{ unmountOnBlur: false }}
                />
                <Stack.Screen name="ListYourAutoScreen" component={withSuspense(ListYourAutoScreen)} />
                <Stack.Screen
                    name="ListYourBikeScreen"
                    component={ListYourBikeScreen}
                    options={{ unmountOnBlur: false }}
                />
                <Stack.Screen name="EditCarDetailsScreen" component={withSuspense(EditCarDetailsScreen)} />
                <Stack.Screen name="EditBikeDetailsScreen" component={withSuspense(EditBikeDetailsScreen)} />
                <Stack.Screen name="EditAutoDetailsScreen" component={withSuspense(EditAutoDetailsScreen)} />
                <Stack.Screen name="MyBookingsScreen" component={withSuspense(MyBookingsScreen)} />
                <Stack.Screen name="MyListedBookingsScreen" component={withSuspense(MyListedBookingsScreen)} />
                <Stack.Screen name="BookingHistoryScreen" component={withSuspense(BookingHistoryScreen)} />
                <Stack.Screen name="ReferEarnScreen" component={withSuspense(ReferEarnScreen)} />
                <Stack.Screen name="RedeemRewardsScreen" component={withSuspense(RedeemRewardsScreen)} />
                <Stack.Screen name="MyProfileScreen" component={withSuspense(MyProfileScreen)} />
                <Stack.Screen name="PrivacyPolicyScreen" component={withSuspense(PrivacyPolicyScreen)} />
                <Stack.Screen name="MyChartsScreen" component={withSuspense(MyChartsScreen)}/>
                <Stack.Screen name="HelpScreen" component={withSuspense(HelpScreen)}/>
                <Stack.Screen name="AboutUsScreen" component={withSuspense(AboutUsScreen)}/>
                <Stack.Screen name="BookingDetailsScreen" component={withSuspense(BookingDetailsScreen)}/>
                <Stack.Screen name="SubscriptionScreen" component={withSuspense(SubscriptionScreen)}/>
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default Navigation;