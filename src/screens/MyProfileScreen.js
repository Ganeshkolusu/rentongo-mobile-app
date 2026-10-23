import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    InteractionManager,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    ToastAndroid,
    TouchableOpacity,
    View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { userService } from '../api';
import Button from '../components/Button/Button';
import {
    CountryCodePicker,
    getDefaultCountry,
    validatePhoneNumber
} from '../components/CountryCodePicker';
import { Colors } from '../constants/Colors';
import { hp, normalize, responsiveValue, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { requestCameraPermission } from '../utils/permissions';

// Helper function to extract phone number and detect country
const extractPhoneData = (fullPhoneNumber, defaultCountry) => {
    if (!fullPhoneNumber) {
        return { phoneNumber: '', country: defaultCountry };
    }
    
    // Comprehensive list of countries with their dial codes
    const countries = [
        { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳", phoneLength: 10 },
        { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸", phoneLength: 10 },
        { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧", phoneLength: 10 },
        { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦", phoneLength: 10 },
        { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺", phoneLength: 9 },
        { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪", phoneLength: 10 },
        { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷", phoneLength: 9 },
        { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵", phoneLength: 10 },
        { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳", phoneLength: 11 },
        { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷", phoneLength: 11 },
        { name: "Russia", code: "RU", dialCode: "+7", flag: "🇷🇺", phoneLength: 10 },
        { name: "South Korea", code: "KR", dialCode: "+82", flag: "🇰🇷", phoneLength: 10 },
        { name: "Mexico", code: "MX", dialCode: "+52", flag: "🇲🇽", phoneLength: 10 },
        { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹", phoneLength: 10 },
        { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸", phoneLength: 9 },
        { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱", phoneLength: 9 },
        { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭", phoneLength: 9 },
        { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪", phoneLength: 9 },
        { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬", phoneLength: 8 },
        { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪", phoneLength: 9 },
        { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦", phoneLength: 9 },
        { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦", phoneLength: 9 },
        { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿", phoneLength: 9 },
        { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰", phoneLength: 10 },
        { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩", phoneLength: 10 },
        { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩", phoneLength: 10 },
        { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾", phoneLength: 9 },
        { name: "Thailand", code: "TH", dialCode: "+66", flag: "🇹🇭", phoneLength: 9 },
        { name: "Vietnam", code: "VN", dialCode: "+84", flag: "🇻🇳", phoneLength: 9 },
        { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭", phoneLength: 10 },
    ];
    
    // Sort by dial code length (descending) to match longer codes first
    // This prevents +1 matching before +971, etc.
    const sortedCountries = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);
    
    // Find matching country by dial code
    for (const country of sortedCountries) {
        if (fullPhoneNumber.startsWith(country.dialCode)) {
            return {
                phoneNumber: fullPhoneNumber.slice(country.dialCode.length),
                country: country
            };
        }
    }
    
    // Fallback: remove any leading + and country code digits
    return { 
        phoneNumber: fullPhoneNumber.replace(/^\+\d+/, ''), 
        country: defaultCountry 
    };
};

const MyProfileScreen = ({ navigation }) => {
    const { user, userId, saveUserData, updateUserData, logout } = useAuth();
    
    const defaultCountry = getDefaultCountry();

    const [profileImage, setProfileImage] = useState(user?.profileImage || null);
    const [fullName, setFullName] = useState(user?.name || '');
    
    // Extract phone number and country from stored data
    const initialPhoneData = extractPhoneData(user?.mobilenumber, defaultCountry);
    const [phoneNumber, setPhoneNumber] = useState(initialPhoneData.phoneNumber);
    const [selectedCountry, setSelectedCountry] = useState(initialPhoneData.country);
    
    const [email, setEmail] = useState(user?.email || '');
    const [isSaving, setIsSaving] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    // Fetch fresh user details in background
    const fetchUserData = async () => {
        try {
            const idToUse = userId || user?._id;
            if (!idToUse) return;

            const response = await userService.getUserById(idToUse);
            if (response?.user) {
                const u = response.user;
                setFullName(u.name || '');
                setEmail(u.email || '');
                
                // Extract phone number without country code
                if (u.mobilenumber) {
                    const phoneData = extractPhoneData(u.mobilenumber, selectedCountry);
                    setPhoneNumber(phoneData.phoneNumber);
                    setSelectedCountry(phoneData.country);
                }

                if (u.profileImage) {
                    setProfileImage(u.profileImage);
                    await updateUserData({ profileImage: u.profileImage });
                }
            }
        } catch (error) {
            // Silently fail - we already have cached data showing
        }
    };

    useEffect(() => {
        const interactionPromise = InteractionManager.runAfterInteractions(() => {
            fetchUserData();
        });
        return () => interactionPromise.cancel();
    }, []);

    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            Alert.alert('', message);
        }
    };

    const pickImage = () => {
        setTimeout(() => {
            Alert.alert(
                'Select Photo',
                'Choose an option',
                [
                    { text: 'Take Photo', onPress: () => openCamera() },
                    { text: 'Choose from Gallery', onPress: () => openGallery() },
                    { text: 'Cancel', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }, 100);
    };

    const openCamera = async () => {
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            Alert.alert('Permission Required', 'Please grant camera permission to take a photo.');
            return;
        }

        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 500,
            maxWidth: 500,
            quality: 0.8,
        };

        launchCamera(options, async (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', 'Failed to capture image. Please try again.');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const imageUri = response.assets[0].uri;
                setProfileImage(imageUri);

                const idToUse = userId || user?._id;
                if (idToUse) {
                    try {
                        const uploadResponse = await userService.uploadProfileImage(idToUse, imageUri);
                        const serverImageUrl = uploadResponse?.user?.profileImage || uploadResponse?.profileImage || imageUri;
                        setProfileImage(serverImageUrl);
                        await updateUserData({ profileImage: serverImageUrl });
                        showToast('Photo uploaded successfully');
                    } catch (error) {
                        await updateUserData({ profileImage: imageUri });
                        showToast('Photo saved locally');
                    }
                }
            }
        });
    };

    const openGallery = async () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 500,
            maxWidth: 500,
            quality: 0.8,
            selectionLimit: 1,
        };

        launchImageLibrary(options, async (response) => {
            if (response.errorCode === 'permission') {
                Alert.alert('Permission Required', 'Please grant media library permission to select a photo.');
                return;
            }
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', 'Failed to select image. Please try again.');
                return;
            }
            if (response.assets && response.assets.length > 0) {
                const imageUri = response.assets[0].uri;
                setProfileImage(imageUri);

                const idToUse = userId || user?._id;
                if (idToUse) {
                    try {
                        const uploadResponse = await userService.uploadProfileImage(idToUse, imageUri);
                        const serverImageUrl = uploadResponse?.user?.profileImage || uploadResponse?.profileImage || imageUri;
                        setProfileImage(serverImageUrl);
                        await updateUserData({ profileImage: serverImageUrl });
                        showToast('Photo uploaded successfully');
                    } catch (error) {
                        await updateUserData({ profileImage: imageUri });
                        showToast('Photo saved locally');
                    }
                }
            }
        });
    };

    // Handle phone number change - clear error when typing
    const handlePhoneChange = (text) => {
        const digitsOnly = text.replace(/\D/g, '');
        setPhoneNumber(digitsOnly);
        if (phoneError) {
            setPhoneError('');
        }
    };

    // Handle country change
    const handleCountryChange = (country) => {
        setSelectedCountry(country);
        if (phoneError) {
            setPhoneError('');
        }
    };

    const handleSave = async () => {
        const idToUse = userId || user?._id;
        if (!idToUse) {
            Alert.alert('Error', 'User ID not found');
            return;
        }

        setPhoneError('');

        if (!fullName.trim() || !phoneNumber.trim() || !email.trim()) {
            if (!phoneNumber.trim()) {
                setPhoneError('Phone number is required');
            }
            Alert.alert('Error', 'All fields are required');
            return;
        }

        // Validate phone number length
        if (!validatePhoneNumber(phoneNumber, selectedCountry)) {
            setPhoneError(`Phone number must be ${selectedCountry.phoneLength} digits`);
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Invalid email format');
            return;
        }

        setIsSaving(true);
        try {
            // Combine country code with phone number
            const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber}`;
            
            const updateData = {
                name: fullName.trim(),
                mobilenumber: fullPhoneNumber,
                email: email.trim(),
                profileImage,
            };

            const response = await userService.updateUser(idToUse, updateData);

            const updatedUserData = {
                ...user,
                _id: idToUse,
                name: fullName.trim(),
                mobilenumber: fullPhoneNumber,
                email: email.trim(),
                profileImage: profileImage,
                ...(response?.user || {}),
            };

            try {
                await saveUserData(updatedUserData);
            } catch (saveError) {
                console.log('Error saving to context:', saveError);
            }

            Alert.alert('Success', 'Profile updated successfully');
            navigation.goBack();
        } catch (error) {
            const errorMessage = error?.message || '';
            if (errorMessage.includes('200') || errorMessage.includes('success')) {
                Alert.alert('Success', 'Profile updated successfully');
                navigation.goBack();
            } else {
                Alert.alert('Error', 'Failed to update profile');
            }
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={Colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.headerGradient}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Image
                            source={require('../assets/Icons/rightArrow.png')}
                            style={styles.backIcon}
                        />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Account</Text>
                    <View style={styles.placeholder} />
                </View>

                <View style={styles.profileImageContainer} pointerEvents="box-none">
                    <TouchableOpacity
                        style={styles.imageWrapper}
                        onPress={pickImage}
                        activeOpacity={0.7}
                        hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    >
                        <View style={styles.profileImageBox} pointerEvents="none">
                            <Image
                                source={
                                    profileImage
                                        ? { uri: profileImage }
                                        : require('../assets/Icons/user-avatar.png')
                                }
                                style={styles.profileImage}
                                resizeMode={profileImage ? "cover" : "contain"}
                            />
                        </View>
                        <View style={styles.editIconContainer} pointerEvents="none">
                            <Image
                                source={require('../assets/Icons/edit1.png')}
                                style={styles.editIcon}
                                resizeMode="contain"
                            />
                        </View>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.inputValue}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={[
                        styles.inputContainer,
                        phoneError && styles.inputContainerError,
                        { flexDirection: 'column', alignItems: 'flex-start' }
                    ]}>
                        <Text style={styles.label}>Phone</Text>
                        <View style={styles.phoneInputWrapper}>
                            <CountryCodePicker
                                selectedCountry={selectedCountry}
                                onSelectCountry={handleCountryChange}
                                compact={true}
                            />
                            <View style={styles.phoneDivider} />
                            <TextInput
                                style={styles.phoneInput}
                                value={phoneNumber}
                                onChangeText={handlePhoneChange}
                                placeholder={`Enter ${selectedCountry.phoneLength} digit number`}
                                keyboardType="phone-pad"
                                maxLength={selectedCountry.phoneLength}
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>
                    {phoneError ? (
                        <Text style={styles.errorText}>{phoneError}</Text>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            style={styles.inputValue}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            placeholderTextColor="#999"
                        />
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <LinearGradient
                        colors={['#141248', '#63C8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Button
                            title={isSaving ? 'Saving...' : 'Save'}
                            onPress={handleSave}
                            disabled={isSaving}
                        />
                    </LinearGradient>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    headerGradient: {
        paddingTop: hp(7),
        paddingBottom: hp(8),
        borderBottomLeftRadius: normalize(40),
        borderBottomRightRadius: normalize(40),
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    backButton: { padding: normalize(8) },
    backIcon: {
        width: normalize(24),
        height: normalize(24),
        tintColor: Colors.white,
        transform: [{ rotate: '180deg' }],
    },
    headerTitle: {
        fontSize: normalize(20),
        fontWeight: '600',
        color: Colors.white,
        fontFamily: Typography.fontFamily.semiBold,
    },
    placeholder: { width: normalize(40) },
    profileImageContainer: { alignItems: 'center', marginTop: Spacing.md },
    imageWrapper: { position: 'relative', overflow: 'visible' },
    profileImageBox: {
        width: responsiveValue(wp(22), wp(22), wp(24)),
        height: responsiveValue(wp(22), wp(22), wp(24)),
        borderRadius: normalize(8),
        borderWidth: normalize(3),
        borderColor: Colors.white,
        overflow: 'hidden',
        backgroundColor: '#E8EAF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    editIconContainer: {
        position: 'absolute',
        bottom: normalize(-5),
        right: normalize(-5),
        backgroundColor: Colors.white,
        borderRadius: normalize(16),
        width: normalize(32),
        height: normalize(32),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        zIndex: 10,
    },
    editIcon: {
        width: normalize(16),
        height: normalize(16),
        tintColor: Colors.dotActive,
    },
    scrollView: { flex: 1 },
    scrollContent: {
        paddingTop: hp(5),
        paddingHorizontal: Spacing.lg,
        paddingBottom: hp(10)
    },
    formContainer: { marginBottom: Spacing.lg },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        borderWidth: 1,
        borderColor: '#E5E5E5',
        paddingHorizontal: Spacing.md,
        paddingVertical: normalize(14),
        marginBottom: Spacing.md,
    },
    inputContainerError: {
        borderColor: '#E53935',
        borderWidth: 1.5,
        marginBottom: normalize(4),
    },
    label: {
        fontSize: normalize(14),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        width: wp(22),
    },
    inputValue: {
        flex: 1,
        fontSize: normalize(14),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    phoneInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    phoneDivider: {
        width: 1,
        height: normalize(20),
        backgroundColor: '#E0E0E0',
        marginHorizontal: normalize(8),
    },
    phoneInput: {
        flex: 1,
        fontSize: normalize(14),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        paddingVertical: 0,
    },
    errorText: {
        fontSize: normalize(12),
        color: '#E53935',
        marginBottom: normalize(8),
        paddingHorizontal: Spacing.md,
        fontFamily: Typography.fontFamily.regular,
    },
    buttonContainer: { marginTop: Spacing.xl },
    gradientButton: { borderRadius: normalize(12) },
});

export default MyProfileScreen;