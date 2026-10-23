import * as ImagePicker from 'expo-image-picker';
import { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { bikeService } from '../api';
import BookingSuccessPopup from '../components/BookingSuccessPopup';
import Button from '../components/Button/Button';
import FormDropdown from '../components/FormDropdown';
import FormInput from '../components/FormInput';
import FormSwitch from '../components/FormSwitch';
import Header from '../components/Header/Header';
import PickupLocationMap from '../components/PickupLocationMap';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fuelTypeOptions, gearTypeOptions } from '../data/bikeOptions';
import { getCitiesForState, indianStatesOptions } from '../data/indianStates';
import { fetchPincodeDetails, formatCityOption, formatStateOption } from '../utils/pincodeUtils';
import {
    cleanVehicleText,
    isNonNegativeNumber,
    isPositiveNumber,
    isValidCoordinate,
    isValidMobileNumber,
    isValidPersonName,
    isValidPincode,
    isValidVehicleText,
} from '../utils/vehicleFormValidation';

const ListYourBikeScreen = ({ navigation, route }) => {
    const { showSuccess, showError } = useToast();

    // Bike Details
    const [bikeName, setBikeName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [model, setModel] = useState('');
    const [typeFuel, setTypeFuel] = useState('');
    const [typeGear, setTypeGear] = useState('');
    const [mileage, setMileage] = useState('');
    const [engineCC, setEngineCC] = useState('');
    const [insuranceNo, setInsuranceNo] = useState('');
    const [description, setDescription] = useState('');
    const [gpsAvailable, setGpsAvailable] = useState(false);

    // Price
    const [pricePerKm, setPricePerKm] = useState('');

    // Contact Information
    const [ownerName, setOwnerName] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // Required Documents
    const [drivingLicense, setDrivingLicense] = useState(true);
    const [aadharCard, setAadharCard] = useState(true);
    const [depositMoney, setDepositMoney] = useState('');

    // Vehicle Pickup Address
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [pickupArea, setPickupArea] = useState('');
    const [pincode, setPincode] = useState('');
    const [street, setStreet] = useState('');
    const [doorNumber, setDoorNumber] = useState('');

    // Pickup Location Coordinates (set from the map pin; empty until placed)
    const [pickupLatitude, setPickupLatitude] = useState('');
    const [pickupLongitude, setPickupLongitude] = useState('');

    // UI States
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [forceCloseDropdowns, setForceCloseDropdowns] = useState(false);
    const [loading, setLoading] = useState(false);
    const [bikeImages, setBikeImages] = useState({
        front: null,
        back: null,
        left: null,
        right: null
    });
    const [vehicleNumberError, setVehicleNumberError] = useState('');
    const [vehicleNumberValid, setVehicleNumberValid] = useState(false);

    // Ref to always have the latest bikeImages state (fixes stale closure issue)
    const bikeImagesRef = useRef(bikeImages);
    bikeImagesRef.current = bikeImages;
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Validation error states - stores error messages for each field
    const [errors, setErrors] = useState({});

    // Refs for scrolling to fields
    const scrollViewRef = useRef(null);
    const vehicleNumberRef = useRef(null);
    const mileageRef = useRef(null);
    const engineCCRef = useRef(null);
    const pricePerKmRef = useRef(null);
    const ownerNameRef = useRef(null);
    const contactNumberRef = useRef(null);
    const depositMoneyRef = useRef(null);
    const pickupLocationRef = useRef(null);
    const pincodeRef = useRef(null);
    const pickupAreaRef = useRef(null);
    const imagesRef = useRef(null);

    const { userId } = useAuth();

    // All bike data options are imported from ../data/bikeOptions.js
    // Indian states options imported from ../data/indianStates.js
    const stateOptions = indianStatesOptions;

    // Get cities based on selected state
    const cityOptions = getCitiesForState(state.label);

    const openCamera = useCallback(async (viewType) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showError('Camera permission is required to take photos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const imageData = {
                    uri: result.assets[0].uri,
                    type: 'image/jpeg',
                    name: `bike_${viewType}_${Date.now()}.jpg`,
                };

                // Use functional update to always get latest state
                setBikeImages(prevImages => {
                    const newState = { ...prevImages, [viewType]: imageData };
                    // Also update ref
                    bikeImagesRef.current = newState;
                    return newState;
                });

                // Clear images error when user uploads an image
                setErrors(prev => {
                    if (prev.images) {
                        return { ...prev, images: '' };
                    }
                    return prev;
                });
            }
        } catch (error) {
            // Silent catch
            showError('Failed to capture image');
        }
    }, []);

    const openGallery = useCallback(async (viewType) => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const imageData = {
                    uri: asset.uri,
                    type: asset.mimeType || 'image/jpeg',
                    name: `bike_${viewType}_${Date.now()}.jpg`,
                };

                // Use functional update to always get latest state
                setBikeImages(prevImages => {
                    const newState = { ...prevImages, [viewType]: imageData };
                    // Also update ref
                    bikeImagesRef.current = newState;
                    return newState;
                });

                // Clear images error when user uploads an image
                setErrors(prev => {
                    if (prev.images) {
                        return { ...prev, images: '' };
                    }
                    return prev;
                });
            }
        } catch (error) {
            // Silent catch
            showError('Failed to pick image');
        }
    }, []);

    const pickImageForView = useCallback((viewType) => {
        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                {
                    text: 'Camera',
                    onPress: () => openCamera(viewType),
                },
                {
                    text: 'Gallery',
                    onPress: () => openGallery(viewType),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
            { cancelable: true }
        );
    }, [openCamera, openGallery]);

    const removeImageForView = (viewType) => {
        setBikeImages(prev => ({
            ...prev,
            [viewType]: null
        }));
    };

    /**
     * Handle pincode change and auto-fill address details
     */
    const handlePincodeChange = async (text) => {
        setPincode(text);

        // Clear pincode error when user types
        if (errors.pincode) {
            setErrors(prev => ({ ...prev, pincode: '' }));
        }

        // Only fetch when pincode is 6 digits
        if (text.length === 6) {
            setPincodeLoading(true);
            const result = await fetchPincodeDetails(text);

            if (result.success) {
                // Auto-fill state
                const stateOption = formatStateOption(result.state);
                if (stateOption) {
                    setState(stateOption);
                }

                // Auto-fill city
                const cityOption = formatCityOption(result.city);
                if (cityOption) {
                    setCity(cityOption);
                }

                // Auto-fill area
                if (result.area) {
                    setPickupArea(result.area);
                }

                // Coordinates are not touched here - the map pin is the source of truth

                showSuccess('Address details auto-filled successfully!');
            } else {
                showError(result.error || 'Failed to fetch pincode details');
            }
            setPincodeLoading(false);
        }
    };

    /**
     * Handle a pin set on the pickup location map: store the coordinates and
     * auto-fill the address fields the reverse geocoder returned
     */
    const handlePickupLocationChange = ({ latitude, longitude, address = {} }) => {
        setPickupLatitude(String(latitude));
        setPickupLongitude(String(longitude));

        // Track which fields got a value so their errors can be cleared
        const filledFields = ['pickupLocation'];

        // Auto-fill state
        const stateOption = formatStateOption(address.state);
        if (stateOption) {
            setState(stateOption);
            filledFields.push('state');
        }

        // Auto-fill city
        const cityOption = formatCityOption(address.city);
        if (cityOption) {
            setCity(cityOption);
            filledFields.push('city');
        }

        // Auto-fill pincode
        if (address.pincode) {
            setPincode(address.pincode);
            filledFields.push('pincode');
        }

        // Auto-fill street
        if (address.street) {
            setStreet(address.street);
        }

        // Auto-fill pickup area
        if (address.area) {
            setPickupArea(address.area);
            filledFields.push('pickupArea');
        }

        setErrors(prev => {
            const next = { ...prev };
            filledFields.forEach(field => { next[field] = ''; });
            return next;
        });
    };

    /**
     * Format vehicle number as user types
     * Formats: Supports various Indian registration number formats
     */
    const formatVehicleNumber = (text) => {
        // Convert to uppercase
        let cleaned = text.toUpperCase();
        
        // Only allow alphanumeric characters
        cleaned = cleaned.replace(/[^A-Z0-9]/g, '');
        
        // Limit to 10 characters (Indian format)
        cleaned = cleaned.substring(0, 10);
        
        return cleaned;
    };

    /**
     * Validate Indian vehicle registration number format
     * Supports formats:
     * - AA00AA0 (7 chars): AP15GT1
     * - AA00AA00 (8 chars): AP16GH12
     * - AA00AA000 (9 chars): AP16GH123
     * - AA00AA0000 (10 chars): TS14DSD1234
     */
    const validateVehicleNumber = (number) => {
        // Convert to uppercase and trim
        const cleanNumber = number.trim().toUpperCase();

        // Empty check
        if (!cleanNumber) {
            return { valid: false, error: 'Vehicle number is required' };
        }

        // Length check - minimum 7, maximum 10
        if (cleanNumber.length < 7) {
            return { valid: false, error: 'Vehicle number is too short (minimum 7 characters)' };
        }

        if (cleanNumber.length > 10) {
            return { valid: false, error: 'Vehicle number is too long (maximum 10 characters)' };
        }

        // Check first 2 characters are letters (State Code)
        if (!/^[A-Z]{2}/.test(cleanNumber)) {
            return { valid: false, error: 'First 2 characters must be letters (State Code)' };
        }

        // Check next 2 characters are digits (RTO Code)
        if (!/^[A-Z]{2}[0-9]{2}/.test(cleanNumber)) {
            return { valid: false, error: 'Characters 3-4 must be digits (RTO Code)' };
        }

        // Check series (1-3 letters after RTO code)
        const afterRTO = cleanNumber.substring(4);
        const seriesMatch = afterRTO.match(/^[A-Z]{1,3}/);
        
        if (!seriesMatch) {
            return { valid: false, error: 'Invalid series format (must be 1-3 letters after RTO code)' };
        }

        const seriesLength = seriesMatch[0].length;
        const remainingChars = afterRTO.substring(seriesLength);

        // Check if remaining characters are digits
        if (!/^[0-9]+$/.test(remainingChars)) {
            return { valid: false, error: 'Number portion must contain only digits' };
        }

        // Validate digit count (1-4 digits allowed)
        const digitCount = remainingChars.length;
        if (digitCount < 1 || digitCount > 4) {
            return { valid: false, error: 'Invalid number of digits (must be 1-4 digits)' };
        }

        // Final pattern validation
        // Format: 2 letters + 2 digits + 1-3 letters + 1-4 digits
        const validPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,3}[0-9]{1,4}$/;

        if (!validPattern.test(cleanNumber)) {
            return { valid: false, error: 'Invalid vehicle number format' };
        }

        return { valid: true, error: '' };
    };

    /**
     * Handle vehicle number change with real-time validation
     */
    const handleVehicleNumberChange = (text) => {
        // Format the input
        const formatted = formatVehicleNumber(text);
        setVehicleNumber(formatted);

        // Clear previous errors
        if (errors.vehicleNumber) {
            setErrors(prev => ({ ...prev, vehicleNumber: '' }));
        }

        // Validate on each change
        const cleanNumber = formatted;
        
        // Only validate if user has typed at least state code + RTO
        if (cleanNumber.length >= 4) {
            const validation = validateVehicleNumber(formatted);
            
            if (cleanNumber.length >= 7) {
                // Only show validation result when minimum length is reached
                if (validation.valid) {
                    setVehicleNumberError('');
                    setVehicleNumberValid(true);
                } else {
                    setVehicleNumberError(validation.error);
                    setVehicleNumberValid(false);
                }
            } else {
                // Clear validation while typing
                setVehicleNumberError('');
                setVehicleNumberValid(false);
            }
        } else {
            setVehicleNumberError('');
            setVehicleNumberValid(false);
        }
    };

    const scrollToField = (fieldRef) => {
        if (fieldRef && fieldRef.current && scrollViewRef.current) {
            fieldRef.current.measureLayout(
                scrollViewRef.current,
                (x, y) => {
                    scrollViewRef.current.scrollTo({ y: y - 100, animated: true });
                },
                () => { }
            );
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let firstErrorRef = null;

        // Validate Bike Name (typed by the owner)
        if (!cleanVehicleText(bikeName)) {
            newErrors.bikeName = 'Please enter bike name';
        } else if (!isValidVehicleText(bikeName)) {
            newErrors.bikeName = 'Enter a valid bike name (2-50 letters/numbers)';
        }
        if (newErrors.bikeName && !firstErrorRef) firstErrorRef = scrollViewRef; // Scroll to top for first field

        // Validate Vehicle Number
        if (!vehicleNumber.trim()) {
            newErrors.vehicleNumber = 'Please enter vehicle number';
            if (!firstErrorRef) firstErrorRef = vehicleNumberRef;
        } else {
            const validation = validateVehicleNumber(vehicleNumber);
            if (!validation.valid) {
                newErrors.vehicleNumber = validation.error;
                if (!firstErrorRef) firstErrorRef = vehicleNumberRef;
                setVehicleNumberError(validation.error);
            } else {
                setVehicleNumberError('');
            }
        }

        // Validate Model (typed by the owner; the backend requires bikeModel)
        if (!cleanVehicleText(model)) {
            newErrors.model = 'Please enter bike model';
        } else if (!isValidVehicleText(model)) {
            newErrors.model = 'Enter a valid bike model (2-50 letters/numbers)';
        }
        if (newErrors.model && !firstErrorRef) firstErrorRef = scrollViewRef;

        // Validate Fuel Type (Dropdown)
        if (!typeFuel || !typeFuel.value) {
            newErrors.typeFuel = 'Please select fuel type';
            if (!firstErrorRef) firstErrorRef = scrollViewRef;
        }

        // Validate Gear Type (Dropdown)
        if (!typeGear || !typeGear.value) {
            newErrors.typeGear = 'Please select gear type';
            if (!firstErrorRef) firstErrorRef = scrollViewRef;
        }

        // Validate Mileage
        if (!mileage.trim()) {
            newErrors.mileage = 'Please enter mileage';
            if (!firstErrorRef) firstErrorRef = mileageRef;
        }

        // Validate Engine CC (skip for Electric bikes)
        if (typeFuel?.value !== 'electric' && !engineCC.trim()) {
            newErrors.engineCC = 'Please enter engine CC';
            if (!firstErrorRef) firstErrorRef = engineCCRef;
        }

        // Validate Price Per Km (greater than 0)
        if (!pricePerKm.trim()) {
            newErrors.pricePerKm = 'Please enter price per km';
            if (!firstErrorRef) firstErrorRef = pricePerKmRef;
        } else if (!isPositiveNumber(pricePerKm)) {
            newErrors.pricePerKm = 'Enter a valid price per km';
            if (!firstErrorRef) firstErrorRef = pricePerKmRef;
        }

        // Validate Owner Name
        if (!ownerName.trim()) {
            newErrors.ownerName = 'Please enter owner name';
            if (!firstErrorRef) firstErrorRef = ownerNameRef;
        } else if (!isValidPersonName(ownerName)) {
            newErrors.ownerName = 'Enter a valid name (letters, spaces and dots only)';
            if (!firstErrorRef) firstErrorRef = ownerNameRef;
        }

        // Validate Contact Number (Indian mobile)
        if (!isValidMobileNumber(contactNumber)) {
            newErrors.contactNumber = 'Enter a valid 10-digit mobile number';
            if (!firstErrorRef) firstErrorRef = contactNumberRef;
        }

        // Validate Deposit Money (optional, but must be a number if filled)
        if (depositMoney.trim() && !isNonNegativeNumber(depositMoney)) {
            newErrors.depositMoney = 'Enter a valid deposit amount';
            if (!firstErrorRef) firstErrorRef = depositMoneyRef;
        }

        // Validate Pickup Location (map pin)
        if (!isValidCoordinate(pickupLatitude, pickupLongitude)) {
            newErrors.pickupLocation = 'Please set the pickup location on the map';
            if (!firstErrorRef) firstErrorRef = pickupLocationRef;
        }

        // Validate State (Dropdown)
        if (!state || !state.value) {
            newErrors.state = 'Please select state';
            if (!firstErrorRef) firstErrorRef = scrollViewRef;
        }

        // Validate City (Dropdown)
        if (!city || !city.value) {
            newErrors.city = 'Please select city';
            if (!firstErrorRef) firstErrorRef = scrollViewRef;
        }

        // Validate Pickup Area
        if (!pickupArea.trim()) {
            newErrors.pickupArea = 'Please enter vehicle pickup area';
            if (!firstErrorRef) firstErrorRef = pickupAreaRef;
        } else if (pickupArea.trim().length < 2) {
            newErrors.pickupArea = 'Enter a valid pickup area';
            if (!firstErrorRef) firstErrorRef = pickupAreaRef;
        }

        // Validate Pincode
        if (!pincode.trim()) {
            newErrors.pincode = 'Please enter pincode';
            if (!firstErrorRef) firstErrorRef = pincodeRef;
        } else if (!isValidPincode(pincode)) {
            newErrors.pincode = 'Enter a valid 6-digit pincode';
            if (!firstErrorRef) firstErrorRef = pincodeRef;
        }

        // Check if at least one image is uploaded
        const hasImages = Object.values(bikeImages).some(img => img !== null);
        if (!hasImages) {
            newErrors.images = 'Please upload at least one bike image';
            if (!firstErrorRef) firstErrorRef = imagesRef;
        }

        setErrors(newErrors);

        // Scroll to first error field
        if (firstErrorRef && Object.keys(newErrors).length > 0) {
            scrollToField(firstErrorRef);
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        // Validate form
        if (!validateForm()) {
            return;
        }

        // Force close dropdowns
        setForceCloseDropdowns(true);
        setTimeout(() => setForceCloseDropdowns(false), 100);

        setLoading(true);

        try {
            // Create FormData - exactly like car submission
            const formData = new FormData();

            // Clean vehicle number (already clean, no spaces)
            const cleanVehicleNumber = vehicleNumber.toUpperCase().trim();

            // Add text fields - EXACTLY matching Postman format
            formData.append('userId', userId);
            formData.append('bikeNumber', cleanVehicleNumber);
            formData.append('description', description.trim() || 'No description');
            formData.append('pricePerKm', pricePerKm);
            formData.append('contactNumber', contactNumber.trim());
            formData.append('contactName', ownerName.trim());
            formData.append('latitude', pickupLatitude);
            formData.append('longitude', pickupLongitude);
            formData.append('InsuranceNo', insuranceNo.trim() || 'N/A');
            formData.append('bikeName', cleanVehicleText(bikeName));
            formData.append('bikeModel', cleanVehicleText(model));
            formData.append('pickupCityCountry', 'india');
            formData.append('pickupCityState', state.value);
            formData.append('pickupCityPinCode', pincode.trim());
            formData.append('pickupCity', city.value);
            formData.append('pickupArea', pickupArea.trim());

            // Add images (append all non-null images)
            Object.values(bikeImages).forEach((image) => {
                if (image) {
                    formData.append('bikeImages', {
                        uri: image.uri,
                        type: image.type,
                        name: image.name,
                    });
                }
            });

            // Call API
            const response = await bikeService.createBike(formData);

            // Show success popup
            setShowSuccessPopup(true);

        } catch (error) {
            // Silent catch

            // User-friendly error message
            let errorMessage = 'Failed to list your bike. Please try again.';

            if (error.message && error.message.includes('HTTP 403') && error.message.includes('Vehicle limit reached')) {
                Alert.alert(
                    'Vehicle limit reached',
                    'Upgrade to Pro to list more than one vehicle.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionScreen') },
                    ]
                );
                return;
            }

            if (error.message) {
                if (error.message.includes('Network')) {
                    errorMessage = 'Network connection issue. Please check your internet connection and try again.';
                } else if (error.message.includes('timeout')) {
                    errorMessage = 'Request timed out. Please try again.';
                } else if (error.message.includes('401') || error.message.includes('403')) {
                    errorMessage = 'Authentication error. Please login again.';
                } else if (error.message.includes('400')) {
                    errorMessage = 'Invalid data. Please check all fields and try again.';
                } else if (error.message.includes('500')) {
                    errorMessage = 'Server error. Please try again later.';
                }
            }

            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigation.goBack();
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleGoBack}
                title="List your Bike"
                useGradient={false}
                showIconBackground={true}
                extraTopPadding={true}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                <Text style={styles.sectionTitle}>Bike Details</Text>

                <FormInput
                    label="Bike Name"
                    value={bikeName}
                    onChangeText={(text) => {
                        setBikeName(text);
                        if (errors.bikeName) {
                            setErrors(prev => ({ ...prev, bikeName: '' }));
                        }
                    }}
                    autoCapitalize="words"
                    maxLength={50}
                    required
                    error={!!errors.bikeName}
                    errorMessage={errors.bikeName}
                />

                <View ref={vehicleNumberRef}>
                    <FormInput
                        label="Vehicle Number"
                        value={vehicleNumber}
                        onChangeText={handleVehicleNumberChange}
                        placeholder="Enter vehicle number"
                        autoCapitalize="characters"
                        error={!!errors.vehicleNumber}
                        errorMessage={errors.vehicleNumber}
                        required
                        maxLength={10}
                    />
                    <View style={styles.vehicleNumberFeedbackContainer}>
                        {vehicleNumberError ? (
                            <View style={styles.feedbackRow}>
                                <Icon name="error" size={16} color="#FF0000" />
                                <Text style={styles.errorText}>{vehicleNumberError}</Text>
                            </View>
                        ) : vehicleNumberValid ? (
                            <View style={styles.feedbackRow}>
                                <Icon name="check-circle" size={16} color="#4CAF50" />
                                <Text style={styles.successText}>Valid vehicle number</Text>
                            </View>
                        ) : vehicleNumber.length > 0 ? (
                            <Text style={styles.hintText}>Format: AA00AA0000 (e.g., AP15GT1, TS14DSD1234)</Text>
                        ) : null}
                    </View>
                </View>

                <FormInput
                    label="Model"
                    value={model}
                    onChangeText={(text) => {
                        setModel(text);
                        if (errors.model) {
                            setErrors(prev => ({ ...prev, model: '' }));
                        }
                    }}
                    autoCapitalize="words"
                    maxLength={50}
                    required
                    error={!!errors.model}
                    errorMessage={errors.model}
                />

                <FormDropdown
                    label="Fuel Type"
                    value={typeFuel}
                    onSelect={(selected) => {
                        setTypeFuel(selected);
                        if (errors.typeFuel) {
                            setErrors(prev => ({ ...prev, typeFuel: '' }));
                        }
                        // Clear Engine CC when Electric is selected
                        if (selected?.value === 'electric') {
                            setEngineCC('');
                            setErrors(prev => ({ ...prev, engineCC: '' }));
                        }
                    }}
                    options={fuelTypeOptions}
                    placeholder="Select fuel type"
                    forceClose={forceCloseDropdowns}
                    required
                    error={!!errors.typeFuel}
                    errorMessage={errors.typeFuel}
                />

                <FormDropdown
                    label="Gear Type"
                    value={typeGear}
                    onSelect={(selected) => {
                        setTypeGear(selected);
                        if (errors.typeGear) {
                            setErrors(prev => ({ ...prev, typeGear: '' }));
                        }
                    }}
                    options={gearTypeOptions}
                    placeholder="Select gear type"
                    forceClose={forceCloseDropdowns}
                    required
                    error={!!errors.typeGear}
                    errorMessage={errors.typeGear}
                />

                <View ref={mileageRef}>
                    <FormInput
                        label="Mileage"
                        value={mileage}
                        onChangeText={(text) => {
                            setMileage(text);
                            if (errors.mileage) {
                                setErrors(prev => ({ ...prev, mileage: '' }));
                            }
                        }}
                        placeholder="Enter mileage"
                        error={!!errors.mileage}
                        errorMessage={errors.mileage}
                        required
                        autoComplete="off"
                    />
                </View>

                <View ref={engineCCRef}>
                    <FormInput
                        label="Engine CC"
                        value={engineCC}
                        onChangeText={(text) => {
                            setEngineCC(text);
                            if (errors.engineCC) {
                                setErrors(prev => ({ ...prev, engineCC: '' }));
                            }
                        }}
                        placeholder={typeFuel?.value === 'electric' ? 'N/A for Electric' : 'Enter engine cc'}
                        keyboardType="numeric"
                        error={!!errors.engineCC}
                        errorMessage={errors.engineCC}
                        required={typeFuel?.value !== 'electric'}
                        autoComplete="off"
                        editable={typeFuel?.value !== 'electric'}
                    />
                </View>

                <FormInput
                    label="Insurance Number (Optional)"
                    value={insuranceNo}
                    onChangeText={setInsuranceNo}
                    placeholder="Enter insurance number"
                />

                <FormSwitch
                    label="GPS Available"
                    value={gpsAvailable}
                    onValueChange={setGpsAvailable}
                />

                <Text style={styles.sectionTitle}>Description</Text>
                <FormInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Bike condition, features, etc."
                    multiline={true}
                    numberOfLines={4}
                    style={styles.descriptionInput}
                />

                <Text style={styles.sectionTitle}>Price</Text>
                <View ref={pricePerKmRef}>
                    <FormInput
                        label="Price Per Km"
                        value={pricePerKm}
                        onChangeText={(text) => {
                            setPricePerKm(text);
                            if (errors.pricePerKm) {
                                setErrors(prev => ({ ...prev, pricePerKm: '' }));
                            }
                        }}
                        placeholder="Enter price per km"
                        keyboardType="numeric"
                        error={!!errors.pricePerKm}
                        errorMessage={errors.pricePerKm}
                        required
                        autoComplete="off"
                    />
                </View>

                <Text style={styles.sectionTitle}>Your Contact Information</Text>
                <View ref={ownerNameRef}>
                    <FormInput
                        label="Name"
                        value={ownerName}
                        onChangeText={(text) => {
                            setOwnerName(text);
                            if (errors.ownerName) {
                                setErrors(prev => ({ ...prev, ownerName: '' }));
                            }
                        }}
                        placeholder="Enter owner name"
                        error={!!errors.ownerName}
                        errorMessage={errors.ownerName}
                        required
                    />
                </View>

                <View ref={contactNumberRef}>
                    <FormInput
                        label="Contact Number"
                        value={contactNumber}
                        onChangeText={(text) => {
                            setContactNumber(text);
                            if (errors.contactNumber) {
                                setErrors(prev => ({ ...prev, contactNumber: '' }));
                            }
                        }}
                        placeholder="Enter phone number"
                        keyboardType="phone-pad"
                        maxLength={13}
                        error={!!errors.contactNumber}
                        errorMessage={errors.contactNumber}
                        required
                        selectionColor="#4285F4"
                        underlineColorAndroid="transparent"
                        autoComplete="off"
                        textContentType="none"
                    />
                </View>

                <Text style={styles.sectionTitle}>Customer Required Documents</Text>
                <FormSwitch
                    label="Driving License"
                    value={drivingLicense}
                    onValueChange={setDrivingLicense}
                />

                <FormSwitch
                    label="Aadhar Card"
                    value={aadharCard}
                    onValueChange={setAadharCard}
                />

                <View ref={depositMoneyRef}>
                    <FormInput
                        label="Deposit Money"
                        value={depositMoney}
                        onChangeText={(text) => {
                            setDepositMoney(text);
                            if (errors.depositMoney) {
                                setErrors(prev => ({ ...prev, depositMoney: '' }));
                            }
                        }}
                        placeholder="Enter deposit money"
                        keyboardType="numeric"
                        error={!!errors.depositMoney}
                        errorMessage={errors.depositMoney}
                        autoComplete="off"
                    />
                </View>

                <Text style={styles.sectionTitle}>Vehicle Pickup Location</Text>
                <View ref={pickupLocationRef}>
                    <PickupLocationMap
                        value={pickupLatitude !== '' && pickupLongitude !== ''
                            ? { latitude: Number(pickupLatitude), longitude: Number(pickupLongitude) }
                            : null}
                        onChange={handlePickupLocationChange}
                        required
                        error={!!errors.pickupLocation}
                        errorMessage={errors.pickupLocation}
                    />
                </View>

                <FormDropdown
                    label="State"
                    value={state}
                    onSelect={(selected) => {
                        setState(selected);
                        if (errors.state) {
                            setErrors(prev => ({ ...prev, state: '' }));
                        }
                    }}
                    options={stateOptions}
                    placeholder="Select state"
                    forceClose={forceCloseDropdowns}
                    required
                    error={!!errors.state}
                    errorMessage={errors.state}
                />

                <FormDropdown
                    label="City"
                    value={city}
                    onSelect={(selected) => {
                        setCity(selected);
                        if (errors.city) {
                            setErrors(prev => ({ ...prev, city: '' }));
                        }
                    }}
                    options={cityOptions}
                    placeholder="Select city"
                    forceClose={forceCloseDropdowns}
                    required
                    error={!!errors.city}
                    errorMessage={errors.city}
                />

                <View ref={pickupAreaRef}>
                    <FormInput
                        label="Pickup Area"
                        value={pickupArea}
                        onChangeText={(text) => {
                            setPickupArea(text);
                            if (errors.pickupArea) {
                                setErrors(prev => ({ ...prev, pickupArea: '' }));
                            }
                        }}
                        error={!!errors.pickupArea}
                        errorMessage={errors.pickupArea}
                        required
                    />
                </View>

                <View ref={pincodeRef}>
                    <FormInput
                        label="Pincode"
                        value={pincode}
                        onChangeText={handlePincodeChange}
                        placeholder="Enter pincode"
                        keyboardType="numeric"
                        maxLength={6}
                        error={!!errors.pincode}
                        errorMessage={errors.pincode}
                        required
                    />
                    {pincodeLoading && (
                        <ActivityIndicator
                            size="small"
                            color={Colors.primary}
                            style={{ marginTop: -Spacing.sm, marginBottom: Spacing.sm }}
                        />
                    )}
                </View>

                <FormInput
                    label="Street"
                    value={street}
                    onChangeText={setStreet}
                    placeholder="Enter street"
                />

                <FormInput
                    label="Door Number"
                    value={doorNumber}
                    onChangeText={setDoorNumber}
                    placeholder="Enter door number"
                />

                <Text style={styles.sectionTitle}>Bike Photos</Text>
                <Text style={styles.imageHintText}>Upload images from different angles</Text>

                <View ref={imagesRef} style={styles.imageGridContainer}>
                    {/* Front View */}
                    <View style={styles.imageBoxWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.imageUploadBox,
                                !!errors.images && !bikeImages.front && styles.imageUploadBoxError
                            ]}
                            onPress={() => pickImageForView('front')}
                            activeOpacity={0.7}
                        >
                            {bikeImages.front && bikeImages.front.uri ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        key={bikeImages.front.uri}
                                        source={{ uri: bikeImages.front.uri }}
                                        style={styles.uploadedImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImageForView('front')}
                                    >
                                        <Icon name="close" size={16} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Icon name="add-a-photo" size={32} color={!!errors.images ? '#FF0000' : Colors.text.secondary} />
                                    <Text style={[styles.imageBoxLabel, !!errors.images && styles.imageBoxLabelError]}>Front View</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {!!errors.images && !bikeImages.front && (
                            <Text style={styles.imageBoxErrorText}>Please upload image</Text>
                        )}
                    </View>

                    {/* Back View */}
                    <View style={styles.imageBoxWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.imageUploadBox,
                                !!errors.images && !bikeImages.back && styles.imageUploadBoxError
                            ]}
                            onPress={() => pickImageForView('back')}
                            activeOpacity={0.7}
                        >
                            {bikeImages.back && bikeImages.back.uri ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        key={bikeImages.back.uri}
                                        source={{ uri: bikeImages.back.uri }}
                                        style={styles.uploadedImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImageForView('back')}
                                    >
                                        <Icon name="close" size={16} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Icon name="add-a-photo" size={32} color={!!errors.images ? '#FF0000' : Colors.text.secondary} />
                                    <Text style={[styles.imageBoxLabel, !!errors.images && styles.imageBoxLabelError]}>Back View</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {!!errors.images && !bikeImages.back && (
                            <Text style={styles.imageBoxErrorText}>Please upload image</Text>
                        )}
                    </View>

                    {/* Left View */}
                    <View style={styles.imageBoxWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.imageUploadBox,
                                !!errors.images && !bikeImages.left && styles.imageUploadBoxError
                            ]}
                            onPress={() => pickImageForView('left')}
                            activeOpacity={0.7}
                        >
                            {bikeImages.left && bikeImages.left.uri ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        key={bikeImages.left.uri}
                                        source={{ uri: bikeImages.left.uri }}
                                        style={styles.uploadedImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImageForView('left')}
                                    >
                                        <Icon name="close" size={16} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Icon name="add-a-photo" size={32} color={!!errors.images ? '#FF0000' : Colors.text.secondary} />
                                    <Text style={[styles.imageBoxLabel, !!errors.images && styles.imageBoxLabelError]}>Left View</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {!!errors.images && !bikeImages.left && (
                            <Text style={styles.imageBoxErrorText}>Please upload image</Text>
                        )}
                    </View>

                    {/* Right View */}
                    <View style={styles.imageBoxWrapper}>
                        <TouchableOpacity
                            style={[
                                styles.imageUploadBox,
                                !!errors.images && !bikeImages.right && styles.imageUploadBoxError
                            ]}
                            onPress={() => pickImageForView('right')}
                            activeOpacity={0.7}
                        >
                            {bikeImages.right && bikeImages.right.uri ? (
                                <View style={styles.imageContainer}>
                                    <Image
                                        key={bikeImages.right.uri}
                                        source={{ uri: bikeImages.right.uri }}
                                        style={styles.uploadedImage}
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        style={styles.removeImageButton}
                                        onPress={() => removeImageForView('right')}
                                    >
                                        <Icon name="close" size={16} color={Colors.white} />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <>
                                    <Icon name="add-a-photo" size={32} color={!!errors.images ? '#FF0000' : Colors.text.secondary} />
                                    <Text style={[styles.imageBoxLabel, !!errors.images && styles.imageBoxLabelError]}>Right View</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        {!!errors.images && !bikeImages.right && (
                            <Text style={styles.imageBoxErrorText}>Please upload image</Text>
                        )}
                    </View>
                </View>

                <Button
                    title={loading ? 'Posting...' : 'Post Now'}
                    onPress={handleSubmit}
                    variant="filled"
                    style={styles.button}
                    disabled={loading}
                />

                {loading && (
                    <ActivityIndicator
                        size="large"
                        color={Colors.primary}
                        style={styles.loader}
                    />
                )}
            </ScrollView>

            <BookingSuccessPopup
                visible={showSuccessPopup}
                onClose={handleSuccessClose}
                title="Posted Successfully"
                message="Your listed bike will be visible to all users"
                showDocuments={false}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    vehicleNumberFeedbackContainer: {
        marginTop: -Spacing.xs,
        marginBottom: Spacing.sm,
        marginLeft: Spacing.xs,
    },
    feedbackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    errorText: {
        color: '#FF0000',
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
    },
    successText: {
        color: '#4CAF50',
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
    },
    hintText: {
        color: Colors.text.secondary,
        fontSize: Typography.fontSize.xs,
        fontFamily: Typography.fontFamily.regular,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    descriptionInput: {
        marginBottom: Spacing.xl,
    },
    imageHintText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginBottom: Spacing.md,
        fontFamily: Typography.fontFamily.regular,
    },
    imageGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    imageBoxWrapper: {
        width: '48%',
        marginBottom: Spacing.md,
    },
    imageUploadBox: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F8F9FA',
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    imageUploadBoxError: {
        borderColor: '#FF0000',
        borderStyle: 'solid',
        backgroundColor: '#FFE5E5',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        borderRadius: BorderRadius.md,
    },
    imageBoxLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.medium,
    },
    imageBoxLabelError: {
        color: '#FF0000',
    },
    imageBoxErrorText: {
        color: '#FF0000',
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
        textAlign: 'center',
        fontFamily: Typography.fontFamily.regular,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: Colors.error,
        borderRadius: BorderRadius.full,
        width: normalize(24),
        height: normalize(24),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    button: {
        marginTop: Spacing.lg,
        marginBottom: Platform.OS === 'android' ? Spacing.xxxxl : Spacing.lg,
    },
    loader: {
        marginVertical: Spacing.lg,
    },
});

export default ListYourBikeScreen;