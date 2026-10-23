import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { userService } from '../../api';
import Button from '../../components/Button/Button';
import { API_CONFIG } from '../../config/apiConfig';
import { Colors } from '../../constants/Colors';
import { BorderRadius, hp, Layout, normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const { width, height } = Dimensions.get('window');

// -------------------
// LoginScreen Component
// -------------------
const LoginScreen = ({ navigation }) => {
    const { saveUserData } = useAuth();
    const [loading, setLoading] = useState(false);

    // ✅ Email OTP login state
    const [authStep, setAuthStep] = useState('email'); // 'email' | 'otp'
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [otpError, setOtpError] = useState('');
    const [cooldown, setCooldown] = useState(0);

    // ✅ Terms and Conditions States
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const startCooldown = () => {
        setCooldown(60);
        const interval = setInterval(() => {
            setCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // ✅ Handle Login Button Press
    const handleLoginButtonPress = () => {
        if (!termsAccepted) {
            Alert.alert('Terms Required', 'Please accept the Terms and Conditions to continue');
            return;
        }
        if (authStep === 'email') {
            handleSendOtp();
        } else {
            handleVerifyOtp();
        }
    };

    const handleSendOtp = async () => {
        setOtpError('');

        if (!EMAIL_REGEX.test(email.trim())) {
            setOtpError('Enter a valid email address');
            return;
        }

        setLoading(true);
        try {
            await userService.requestOtp(email.trim().toLowerCase());
            setAuthStep('otp');
            startCooldown();
        } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (cooldown > 0) return;
        setLoading(true);
        try {
            await userService.requestOtp(email.trim().toLowerCase());
            startCooldown();
        } catch (error) {
            Alert.alert('Error', error?.message || 'Failed to resend code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setOtpError('');

        if (!/^\d{6}$/.test(otp)) {
            setOtpError('Enter the 6-digit code sent to your email');
            return;
        }

        setLoading(true);
        try {
            let fcmToken = '';
            try {
                const messaging = require('@react-native-firebase/messaging').default;
                if (!messaging().isDeviceRegisteredForRemoteMessages) {
                    await messaging().registerDeviceForRemoteMessages();
                }
                fcmToken = await messaging().getToken();
                if (fcmToken) {
                    await AsyncStorage.setItem('fcmToken', fcmToken);
                }
            } catch (tokenError) {
                // Continue login even if FCM token fetch fails
            }

            const data = await userService.verifyOtp({
                email: email.trim().toLowerCase(),
                otp,
                name: name.trim() || undefined,
                fcmToken,
                platform: 'android',
            });

            if (data.token) {
                await AsyncStorage.setItem('authToken', data.token);
            }

            if (data.user) {
                await AsyncStorage.setItem('userData', JSON.stringify(data.user));
                await AsyncStorage.setItem('userId', data.user._id);
                await AsyncStorage.setItem('hasSeenOnboarding', 'true');
                await saveUserData(data.user);

                setLoading(false);
                navigation.replace('DashBoard');
            } else {
                throw new Error('No user data returned from server');
            }
        } catch (error) {
            setLoading(false);
            Alert.alert('Verification Failed', error?.message || 'Incorrect or expired code');
        }
    };

    // ✅ Open Terms Modal from Link
    const openTermsModal = () => {
        setShowTermsModal(true);
    };


    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />
            <LinearGradient colors={['#7096e6ff', '#FFFFFF']} style={styles.topHalf}>
                <View style={styles.illustrationContainer}>
                    <Image
                        source={require('../../assets/Images/login.png')}
                        style={styles.illustration}
                        resizeMode="contain"
                    />
                </View>
            </LinearGradient>

            <View style={styles.bottomHalf}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>Login</Text>
                    <View style={styles.dot} />
                    <Text style={styles.subtitle}>
                        Sign in to access your account
                    </Text>
                </View>

                {authStep === 'email' ? (
                    <>
                        <TextInput
                            style={styles.emailInput}
                            placeholder="Email address"
                            placeholderTextColor={Colors.text?.secondary || '#888'}
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            editable={!loading}
                        />
                        <TextInput
                            style={styles.emailInput}
                            placeholder="Your name (first time only)"
                            placeholderTextColor={Colors.text?.secondary || '#888'}
                            value={name}
                            onChangeText={setName}
                            editable={!loading}
                        />
                    </>
                ) : (
                    <>
                        <Text style={styles.otpHint}>Code sent to {email}</Text>
                        <TextInput
                            style={[styles.emailInput, styles.otpInput]}
                            placeholder="123456"
                            placeholderTextColor={Colors.text?.secondary || '#888'}
                            value={otp}
                            onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                            keyboardType="number-pad"
                            maxLength={6}
                            editable={!loading}
                        />
                        <View style={styles.otpActionsRow}>
                            <TouchableOpacity onPress={() => { setAuthStep('email'); setOtp(''); setOtpError(''); }}>
                                <Text style={styles.otpActionText}>Change email</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleResendOtp} disabled={cooldown > 0 || loading}>
                                <Text style={[styles.otpActionText, cooldown > 0 && styles.otpActionTextDisabled]}>
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {!!otpError && <Text style={styles.otpError}>{otpError}</Text>}

                {/* ✅ Terms Acceptance Checkbox */}
                <View style={styles.loginCheckboxContainer}>
                    <TouchableOpacity
                        style={styles.loginCheckbox}
                        onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                        <View style={[styles.loginCheckboxBox, termsAccepted && styles.loginCheckboxBoxChecked]}>
                            {termsAccepted && <Text style={styles.loginCheckmark}>✓</Text>}
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.loginCheckboxText}>
                        I agree to the{' '}
                        <Text style={styles.termsLink} onPress={openTermsModal}>
                            Terms and Conditions
                        </Text>
                    </Text>
                </View>

                <Button
                    title={loading ? 'Please wait...' : authStep === 'email' ? 'Send Verification Code' : 'Verify & Continue'}
                    onPress={handleLoginButtonPress}
                    disabled={loading || !termsAccepted}
                />

            </View>

            {/* ✅ Terms and Conditions Modal with EXACT FULL TEXT */}
            <Modal
                visible={showTermsModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowTermsModal(false)}
            >
                <View style={styles.termsModalOverlay}>
                    <View style={styles.termsModalContent}>
                        <View style={styles.termsModalHeader}>
                            <Text style={styles.termsModalTitle}>Terms and Conditions</Text>
                            <TouchableOpacity
                                onPress={() => setShowTermsModal(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            style={styles.termsScrollView} 
                            showsVerticalScrollIndicator={true}
                            contentContainerStyle={{ paddingBottom: Spacing.lg }}
                        >
                            <Text style={styles.termsText}>
                                <Text style={styles.termsHeading}>1. Introduction{'\n'}</Text>
                                Welcome to RentOnGoVehicle, a platform designed to connect vehicle owners ("Owners") with customers ("Renters") for the rental of vehicles. By using our platform (the "Service"), you agree to abide by these Terms and Conditions (the "Terms"). These Terms are intended to govern the rental of vehicles in India and globally, ensuring that all rentals comply with relevant national and international transport laws, including the Motor Vehicles Act, 1988, and applicable RTO regulations.{'\n'}
                                If you do not agree to these Terms, you must immediately discontinue your use of the Service.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>2. Platform Overview{'\n'}</Text>
                                RentOnGoVehicle is an online marketplace facilitating the rental of vehicles by connecting Owners and Renters. We provide a platform for Users to list and rent vehicles, but we do not own, operate, or manage any of the vehicles listed. Transactions between Owners and Renters, including booking, payment, and disputes, are handled directly between the two parties.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>3. User Responsibilities{'\n'}</Text>
                                <Text style={styles.termsSubHeading}>3.1 Registration and Account Creation{'\n'}</Text>
                                Accurate Information: Users must provide true, accurate, and complete information during registration. This includes personal details such as full name, contact information, address, driving license number, and vehicle insurance details.{'\n'}
                                Age and Driving License: Renters must be at least 21 years of age (or the legal driving age as per the applicable jurisdiction) and must hold a valid driving license recognized under Indian RTO laws or the relevant driving authority in their country.{'\n'}
                                Account Security: Users are responsible for maintaining the confidentiality of their account details. Any activity under their account is their responsibility.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>3.2 Vehicle Rental Agreement{'\n'}</Text>
                                Booking Process: All bookings made through RentOnGoVehicle are subject to the Owner's approval. Renters must agree to the specific rental terms, including duration, cost, and any additional requirements set by the Owner (e.g., mileage limits, fuel policy).{'\n'}
                                Rental Duration: The rental period begins and ends at the specified times agreed upon by both parties. Renters must return the vehicle on time to avoid penalties.{'\n'}
                                Cancellations and Modifications: Cancellations and changes to the booking must be made in accordance with the Owner's cancellation policy. RentOnGoVehicle is not involved in the negotiation of these terms.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>3.3 Vehicle Use and Maintenance{'\n'}</Text>
                                Compliance with RTO Laws: Renters agree to comply with the Motor Vehicles Act, 1988 (India) and any local, regional, or international traffic laws during the rental period. This includes driving with a valid driver's license, adhering to speed limits, using seat belts, and avoiding driving under the influence of alcohol or drugs.{'\n'}
                                Vehicle Condition: Owners must ensure their vehicles are registered, insured, and roadworthy in accordance with Indian RTO regulations or international equivalent standards. Renters must return the vehicle in the same condition as received, excluding reasonable wear and tear.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>3.4 Passenger and Transport Vehicle Rules{'\n'}</Text>
                                Passenger Vehicles: For vehicles intended for passenger transport (e.g., cars, SUVs, and buses), Renters must adhere to all laws regarding seating capacity and passenger safety.{'\n'}
                                Public Transport Vehicles: If renting a vehicle for public transport purposes (e.g., buses or vans for hire), the Owner must ensure compliance with local licensing, insurance, and RTO regulations for public transport services, including passenger safety and transport permits.{'\n'}
                                International Guidelines: For global rentals, Renters must comply with international standards for passenger vehicles, including vehicle emissions standards, safety features (e.g., airbags), and adherence to local traffic laws.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>4. RTO Compliance and Vehicle Registration{'\n'}</Text>
                                <Text style={styles.termsSubHeading}>4.1 RTO Requirements for Vehicle Owners{'\n'}</Text>
                                Vehicle Registration: All vehicles listed on RentOnGoVehicle must be properly registered with the Regional Transport Office (RTO) in accordance with the Motor Vehicles Act, 1988. The registration must be valid for the duration of the rental.{'\n'}
                                Insurance: Owners must maintain comprehensive insurance for their vehicles in compliance with the Indian Motor Vehicles Act. The insurance must cover third-party liability, damage, and theft. Renters are advised to review the insurance coverage before confirming a rental.{'\n'}
                                Fitness and Pollution Control: Owners must ensure their vehicles have a valid Fitness Certificate (for vehicles older than 15 years) and meet Pollution Under Control (PUC) standards set by the RTO. Renters must not use the vehicle if it is not in compliance with these standards.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>4.2 RTO-Related Penalties{'\n'}</Text>
                                Traffic Violations: Renters are responsible for any fines, penalties, or legal consequences arising from violations of traffic laws, including speed limits, parking regulations, and driving under the influence of alcohol or drugs.{'\n'}
                                Damage and Liability: Renters will be held liable for any damages to the vehicle, whether accidental or intentional, that occur during the rental period. Owners are responsible for maintaining the vehicle's RTO-compliant condition and ensuring that it is safe for use.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>5. Disclaimers and Limitation of Liability{'\n'}</Text>
                                <Text style={styles.termsSubHeading}>5.1 No Financial Transactions Handled by RentOnGoVehicle{'\n'}</Text>
                                RentOnGoVehicle does not handle financial transactions directly. All payments for rentals, including security deposits, rental fees, and penalties, are made between the Owner and the Renter. RentOnGoVehicle is not responsible for any transaction disputes, non-payment, or failure to process payments.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>5.2 No Liability for Vehicle Condition or Accidents{'\n'}</Text>
                                Vehicle Condition: RentOnGoVehicle is not liable for the condition, maintenance, or safety of any vehicle rented through our platform. This responsibility lies solely with the Owner.{'\n'}
                                Accidents or Incidents: RentOnGoVehicle is not liable for accidents, injuries, or damages resulting from the use of any rented vehicle. Renters must ensure the vehicle is used in a safe and legal manner, and Owners must ensure the vehicle is compliant with safety standards.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>5.3 No Warranty on Vehicle Availability{'\n'}</Text>
                                We do not provide warranties regarding the availability, quality, or condition of vehicles listed on our platform. It is the responsibility of the Owner to ensure their vehicle is available for the agreed rental period.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>6. Indemnification{'\n'}</Text>
                                Users agree to indemnify and hold harmless RentOnGoVehicle, its officers, employees, agents, and affiliates from any claims, damages, liabilities, losses, or expenses arising out of:{'\n\n'}
                                Violations of these Terms,{'\n'}
                                Any accidents, damages, or injuries resulting from the use of the rented vehicle,{'\n'}
                                Any breach of the Motor Vehicles Act, 1988, RTO regulations, or international transport laws by either party.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>7. Governing Law and Dispute Resolution{'\n'}</Text>
                                <Text style={styles.termsSubHeading}>7.1 Governing Law{'\n'}</Text>
                                These Terms are governed by and construed in accordance with the laws of India and international transportation regulations for cross-border rentals. Any disputes arising from these Terms shall be subject to the jurisdiction of the courts in Hyderabad, Telangana, India.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>7.2 Dispute Resolution{'\n'}</Text>
                                In case of any dispute, the parties agree to resolve the matter through arbitration in accordance with the Arbitration and Conciliation Act, 1996 (India), or the applicable law in the country of rental. If arbitration is not feasible, disputes shall be resolved in the courts of Hyderabad, Telangana.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>8. Amendments to Terms{'\n'}</Text>
                                RentOnGoVehicle reserves the right to modify these Terms at any time. Any changes will be communicated to users, and continued use of the platform after such changes constitutes acceptance of the updated Terms.
                                {'\n\n'}
                                <Text style={styles.termsHeading}>9. Contact Information{'\n'}</Text>
                                For any questions, concerns, or feedback regarding these Terms, please contact us at:{'\n\n'}
                                Manyam Consultancy & Technology Services Pvt Ltd{'\n'}
                                Email: support@rentongovehicle.com
                                {'\n\n'}
                                <Text style={styles.termsHeading}>Important Notes:{'\n\n'}</Text>
                                <Text style={styles.termsSubHeading}>Legal Review:{'\n'}</Text>
                                We recommend having these Terms reviewed by a legal professional to ensure compliance with RTO regulations, local laws, and international vehicle rental standards.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>Privacy Policy:{'\n'}</Text>
                                RentOnGoVehicle maintains a separate Privacy Policy to inform users about the collection, use, and protection of personal data.
                                {'\n\n'}
                                <Text style={styles.termsSubHeading}>User Agreement:{'\n'}</Text>
                                Users must accept these Terms and Conditions explicitly during the registration or booking process to make them legally binding.
                                {'\n\n\n'}
                            </Text>
                        </ScrollView>

                        <View style={styles.termsButtonContainer}>
                            <TouchableOpacity
                                style={styles.termsCloseButton}
                                onPress={() => setShowTermsModal(false)}
                            >
                                <Text style={styles.termsCloseButtonText}>
                                    Close
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.white },
    scrollContent: { flexGrow: 1 },
    topHalf: {
        flex: 1.25,
        minHeight: hp(45),
        justifyContent: 'center',
        borderTopRightRadius: BorderRadius.full,
        borderBottomRightRadius: BorderRadius.medium,
        overflow: 'hidden',
    },
    bottomHalf: {
        flex: 1,
        justifyContent: 'flex-start',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    illustrationContainer: {
        alignItems: 'center',
        marginTop: Layout.statusBarHeight + hp(5),
    },
    illustration: { width: Layout.logoSize * 1, height: Layout.logoSize * 1.2 },
    emailInput: {
        borderWidth: 1,
        borderColor: Colors.border || '#DDD',
        borderRadius: BorderRadius.medium,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.md,
        color: Colors.black,
        marginBottom: Spacing.md,
    },
    otpInput: {
        textAlign: 'center',
        letterSpacing: 8,
        fontSize: Typography.fontSize.lg,
    },
    otpHint: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text?.secondary || '#666',
        marginBottom: Spacing.sm,
    },
    otpActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    otpActionText: {
        color: Colors.primary,
        fontSize: Typography.fontSize.sm,
        fontWeight: '600',
    },
    otpActionTextDisabled: {
        color: Colors.text?.secondary || '#999',
    },
    otpError: {
        color: Colors.error || '#E53935',
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.sm,
    },
    textContainer: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.xxxl },
    dot: {
        width: Layout.logoSize * 0.25,
        height: Layout.logoHeight * 0.035,
        borderRadius: BorderRadius.sm,
        backgroundColor: Colors.underLine || '#17184E',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize.huge,
        lineHeight: Typography.lineHeight.huge,
        fontWeight: Typography.fontWeight.fullbold,
        color: Colors.black,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.lg,
        color: Colors.black,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
    },
    googleIcon: { width: Layout.logoSize * 0.12, height: Layout.logoSize * 0.1, borderRadius: BorderRadius.sm },
    devNote: { marginTop: Spacing.md, fontSize: normalize(11), color: '#999', textAlign: 'center', fontStyle: 'italic' },
    apiInfo: { marginTop: Spacing.xs, fontSize: normalize(10), color: '#666', textAlign: 'center' },
    
    // ✅ Login Screen Checkbox Styles
    loginCheckboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        paddingHorizontal: Spacing.sm,
    },
    loginCheckbox: {
        marginRight: Spacing.sm,
    },
    loginCheckboxBox: {
        width: normalize(20),
        height: normalize(20),
        borderRadius: normalize(4),
        borderWidth: 2,
        borderColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginCheckboxBoxChecked: {
        backgroundColor: '#4285F4',
    },
    loginCheckmark: {
        color: Colors.white,
        fontSize: normalize(14),
        fontWeight: '700',
    },
    loginCheckboxText: {
        flex: 1,
        fontSize: normalize(13),
        color: '#333',
        lineHeight: normalize(18),
    },
    termsLink: {
        color: '#4285F4',
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    
    // Terms and Conditions Modal Styles
    termsModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    termsModalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: normalize(20),
        borderTopRightRadius: normalize(20),
        height: height * 0.85,
        paddingTop: Spacing.lg,
    },
    termsModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    termsModalTitle: {
        fontSize: normalize(20),
        fontWeight: '700',
        color: Colors.black,
    },
    closeButton: {
        width: normalize(30),
        height: normalize(30),
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: normalize(24),
        color: '#666',
        fontWeight: '300',
    },
    termsScrollView: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    termsText: {
        fontSize: normalize(12),
        lineHeight: normalize(18),
        color: '#333',
    },
    termsHeading: {
        fontSize: normalize(14),
        fontWeight: '700',
        color: Colors.black,
        marginTop: Spacing.sm,
    },
    termsSubHeading: {
        fontSize: normalize(13),
        fontWeight: '600',
        color: Colors.black,
    },
    termsButtonContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        backgroundColor: Colors.white,
    },
    termsCloseButton: {
        backgroundColor: '#4285F4',
        paddingVertical: Spacing.md,
        borderRadius: normalize(12),
        alignItems: 'center',
    },
    termsCloseButtonText: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: Colors.white,
    },
    
    // Existing modal styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: width * 0.9, maxWidth: 400, backgroundColor: Colors.white, borderRadius: normalize(16), padding: Spacing.xl, maxHeight: height * 0.7 },
    modalHeader: { alignItems: 'center', marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    modalGoogleIcon: { width: normalize(40), height: normalize(40), marginBottom: Spacing.sm },
    modalTitle: { fontSize: normalize(20), fontWeight: '600', color: Colors.black, marginBottom: Spacing.xs, textAlign: 'center' },
    modalSubtitle: { fontSize: normalize(14), color: '#666', textAlign: 'center' },
    loadingSection: { paddingVertical: Spacing.xxl, alignItems: 'center' },
    loadingText: { marginTop: Spacing.md, fontSize: normalize(14), color: '#666' },
    accountItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderRadius: normalize(12), backgroundColor: '#F8F9FA', marginBottom: Spacing.md, borderWidth: 1, borderColor: '#E0E0E0' },
    accountAvatar: { width: normalize(48), height: normalize(48), borderRadius: normalize(24), marginRight: Spacing.md },
    accountInfo: { flex: 1 },
    accountName: { fontSize: normalize(16), fontWeight: '600', color: Colors.black, marginBottom: 2 },
    accountEmail: { fontSize: normalize(14), color: '#666' },
    cancelButton: { marginTop: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: normalize(8), backgroundColor: '#F1F3F4' },
    cancelButtonText: { fontSize: normalize(16), fontWeight: '600', color: '#666' },
    modalFooter: { marginTop: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
    footerText: { fontSize: normalize(11), color: '#666', textAlign: 'center', lineHeight: 16 },
});

export default LoginScreen;