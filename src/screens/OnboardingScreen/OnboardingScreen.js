// src/screens/OnboardingScreen.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ArrowButton from '../../components/ArrowButton/ArrowButton';
import Button from '../../components/Button/Button';
import { Colors } from '../../constants/Colors';
import { BorderRadius, hp, Layout, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const OnboardingScreen = ({ navigation }) => {
    const [step, setStep] = useState(1);

    useEffect(() => {
        StatusBar.setHidden(true);

        return () => {
            StatusBar.setHidden(false);
        };
    }, []);

   const handleNext = async () => {
    if (step < 3) {
        setStep(step + 1);
    } else {
        // ✅ Save that user has completed onboarding
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');

        } catch (error) {

        }
        navigation.replace('LoginScreen'); // Use replace instead of navigate
    }
};

    return (
        <View style={styles.container}>
            <StatusBar hidden={true} translucent backgroundColor="transparent" />
            {step === 1 && (
                <>
                    {/* STEP 1 */}
                    <LinearGradient
                        colors={['#7096e6ff', '#FFFFFF']}
                        style={styles.topHalf1}
                    >
                        <View style={styles.logoContainer}>
                            <View style={styles.logoCircle}>
                                <Image
                                    source={require('../../assets/Images/Splashlogo.jpg')}
                                    style={styles.logoImage}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </LinearGradient>

                    <View style={styles.bottomHalf}>
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>Welcome</Text>
                            <Text style={styles.welcomeSubtitle}>
                                Your All-in-One Car Rental &{'\n'}
                                Booking Bike App
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button title="Let's Go" onPress={handleNext} />
                        </View>
                    </View>
                </>
            )}

            {step === 2 && (
                <>
                    {/* STEP 2 */}
                    <LinearGradient
                        colors={['#7096e6ff', '#FFFFFF']}
                        style={styles.topHalf}
                    >
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/Images/ride.png')}
                                style={styles.rideImage}
                                resizeMode="contain"
                            />
                        </View>
                    </LinearGradient>

                    <View style={styles.bottomHalf}>
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>Find Your Ride</Text>
                            <Text style={[styles.welcomeSubtitle, { color: Colors.black }]}>
                            Browse cars & Bike’s near you,{'\n'}
                                Rent and book anytime
                            </Text>
                        </View>

                        <View style={styles.footer}>
                            {/* Stepper only for Step 2 */}
                            <View style={styles.pagination}>
                                <View style={[styles.dot1, styles.activeDot]} />
                                <View style={styles.dot} />
                            </View>

                            {/* Circle Arrow Button with Icon */}
                            <TouchableOpacity onPress={handleNext} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={['#141248', '#63C8FF']} 
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.arrowCircle}
                                >
                                    <ArrowButton onPress={handleNext} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </>
            )}

            {step === 3 && (
                <>
                    {/* STEP 3 */}
                    <LinearGradient
                        colors={['#7096e6ff', '#FFFFFF']}
                        style={styles.topHalf}
                    >
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../../assets/Images/earn.png')}
                                style={styles.rideImage}
                                resizeMode="contain"
                            />
                        </View>
                    </LinearGradient>

                    <View style={styles.bottomHalf}>
                        <View style={styles.welcomeContainer}>
                            <Text style={styles.welcomeTitle}>List & Earn</Text>
                            <Text style={[styles.welcomeSubtitle, { color: Colors.black }]}>
                              List your car or Bike, set your price, and{'\n'}
                                accept bookings. Payments handled offline.
                            </Text>
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button title="Get Started" onPress={handleNext} />
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
        paddingBottom: Platform.OS === 'android' ? 0 : 0,
    },
    topHalf1: {
        flex: 1.25,
        justifyContent: 'center',
        borderBottomLeftRadius: BorderRadius.small,
        borderBottomRightRadius: BorderRadius.small,
        overflow: 'visible',
    },
    topHalf: {
        flex: 1.25,
        justifyContent: 'center',
        borderTopRightRadius: BorderRadius.full,
        borderBottomRightRadius: BorderRadius.medium,
        overflow: 'hidden',
    },
    bottomHalf: {
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: Colors.white,
        paddingBottom: 0,
        paddingTop: Spacing.sm,
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: Layout.statusBarHeight + hp(5),
    },
    logoCircle: {
        width: Layout.logoSize,
        height: Layout.logoSize,
        borderRadius: BorderRadius.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoImage: {
        borderRadius: (Layout.logoSize * 0.98) / 2,
        width: Layout.logoSize * 0.78,
        height: Layout.logoSize * 0.78,
    },
    rideImage: {
        width: Layout.logoSize * 0.98,
        height: Layout.logoSize * 1.4,
    },
    welcomeContainer: {
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    buttonContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Platform.OS === 'android' ? normalize(110) : normalize(100),
        paddingTop: Spacing.md,
        backgroundColor: Colors.white,
        minHeight: normalize(80),
    },
    welcomeTitle: {
        fontSize: Typography.fontSize.xxxl,
        lineHeight: Typography.lineHeight.xxxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.black,
        marginBottom: Spacing.sm,
        textAlign: 'center',
        width: Layout.logoSize * 0.7,
    },
    welcomeSubtitle: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.lg,
        color: Colors.black,
        fontWeight: Typography.fontWeight.light,
        textAlign: 'center',
        width: Layout.logoSize * 0.8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Platform.OS === 'android' ? normalize(110) : normalize(100),
        paddingTop: Spacing.md,
        backgroundColor: Colors.white,
        minHeight: normalize(80),
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    dot1: {
        width: Layout.logoSize * 0.15,
        height: Layout.logoHeight * 0.035,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.dotActive || '#141248',
    },
    dot: {
        width: Layout.logoSize * 0.04,
        height: Layout.logoHeight * 0.035,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.dotInactive || '#E0E0E0',
    },
    activeDot: {
        backgroundColor: Colors.dotActive || '#141248',
        width: Layout.logoSize * 0.15,
    },
    arrowCircle: {
        borderRadius: BorderRadius.circle,
        backgroundColor: Colors.primary || '#1E1F6E',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: normalize(4) },
        shadowOpacity: 0.2,
        shadowRadius: normalize(6),
        elevation: 6,
    },
});

export default OnboardingScreen;
