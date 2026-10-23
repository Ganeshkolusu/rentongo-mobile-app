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
import { carService } from '../api';
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
import { fuelOptions, seaterOptions, transmissionOptions } from '../data/carOptions';
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

// Image view labels - moved outside component to prevent recreation on every render
const IMAGE_VIEWS = [
    { key: 'front', label: 'Front' },
    { key: 'back', label: 'Back' },
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
    { key: 'inside', label: 'Inside' },
];

const ListYourCarScreen = ({ navigation, route }) => {
    const { showSuccess, showError } = useToast();

    // Car Details
    const [carName, setCarName] = useState('');
    const [vehicleNumber, setVehicleNumber] = useState('');
    const [model, setModel] = useState('');
    const [fuel, setFuel] = useState('');
    const [transmission, setTransmission] = useState('');
    const [seater, setSeater] = useState('');
    const [totalKm, setTotalKm] = useState('');
    const [acAvailable, setAcAvailable] = useState(true);
    const [gpsAvailable, setGpsAvailable] = useState(false);
    const [description, setDescription] = useState('');

    // Price
    const [rentPerHour, setRentPerHour] = useState('');
    const [rentPerDay, setRentPerDay] = useState('');

    // With-driver option
    const [driverAvailable, setDriverAvailable] = useState(false);
    const [driverFee, setDriverFee] = useState('');

    // Contact Information
    const [ownerName, setOwnerName] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // Required Documents
    const [drivingLicense, setDrivingLicense] = useState(true);
    const [aadharCard, setAadharCard] = useState(true);
    const [depositVehicle, setDepositVehicle] = useState(false);
    const [depositMoney, setDepositMoney] = useState('');

    // Vehicle Pickup Address
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [street, setStreet] = useState('');
    const [doorNumber, setDoorNumber] = useState('');
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupArea, setPickupArea] = useState('');

    // Pickup Location Coordinates (set from the map pin; empty until placed)
    const [pickupLatitude, setPickupLatitude] = useState('');
    const [pickupLongitude, setPickupLongitude] = useState('');

    // UI States
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [forceCloseDropdowns, setForceCloseDropdowns] = useState(false);
    const [loading, setLoading] = useState(false);
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Car Images - separate state for each view
    const [carImages, setCarImages] = useState({
        front: null,
        back: null,
        left: null,
        right: null,
        inside: null,
    });

    // Validation error states - stores error messages for each field
    const [errors, setErrors] = useState({});
    const [vehicleNumberError, setVehicleNumberError] = useState('');
    const [vehicleNumberValid, setVehicleNumberValid] = useState(false);

    // Ref to always have the latest carImages state (fixes stale closure issue)
    const carImagesRef = useRef(carImages);
    carImagesRef.current = carImages;

    // Refs for scrolling to fields and opening dropdowns
    const scrollViewRef = useRef(null);
    const carNameRef = useRef(null);
    const vehicleNumberRef = useRef(null);
    const modelRef = useRef(null);
    const seaterRef = useRef(null);
    const fuelRef = useRef(null);
    const transmissionRef = useRef(null);
    const totalKmRef = useRef(null);
    const rentPerHourRef = useRef(null);
    const rentPerDayRef = useRef(null);
    const driverFeeRef = useRef(null);
    const ownerNameRef = useRef(null);
    const contactNumberRef = useRef(null);
    const depositMoneyRef = useRef(null);
    const pickupLocationRef = useRef(null);
    const stateRef = useRef(null);
    const cityRef = useRef(null);
    const pickupAreaRef = useRef(null);
    const pincodeRef = useRef(null);
    const imagesRef = useRef(null);

    // Get userId from route or use default
    const { userId } = useAuth();

    // All car data options are imported from ../data/carOptions.js

    // Use all Indian states from indianStates.js
    const stateOptions = indianStatesOptions;

    // Dynamic city options based on selected state
    const cityOptions = getCitiesForState(state.label);

    /**
     * Handle pincode change with auto-fill functionality
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
     * Open camera for a specific view
     */
    const openCamera = useCallback(async (imageKey) => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showError('Camera permission is required');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                const asset = result.assets[0];
                const imageData = {
                    uri: asset.uri,
                    type: 'image/jpeg',
                    name: `car_${imageKey}_${Date.now()}.jpg`,
                };
                // Use functional update to always get latest state
                setCarImages(prevImages => {
                    const newState = { ...prevImages, [imageKey]: imageData };
                    // Also update ref
                    carImagesRef.current = newState;
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
            showError('Failed to open camera');
        }
    }, []);

    const openGallery = useCallback(async (imageKey) => {
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
                    type: 'image/jpeg',
                    name: `car_${imageKey}_${Date.now()}.jpg`,
                };
                // Use functional update to always get latest state
                setCarImages(prevImages => {
                    const newState = { ...prevImages, [imageKey]: imageData };
                    // Also update ref
                    carImagesRef.current = newState;
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
            showError('Failed to open gallery');
        }
    }, []);

    /**
     * Pick image for a specific view (front, back, left, right, inside)
     */
    const pickImage = useCallback((imageKey) => {
        // Show options for camera or gallery
        Alert.alert(
            'Select Image',
            'Choose an option',
            [
                {
                    text: 'Camera',
                    onPress: () => openCamera(imageKey),
                },
                {
                    text: 'Gallery',
                    onPress: () => openGallery(imageKey),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    }, [openCamera, openGallery]);

    /**
     * Remove image for a specific view
     */
    const removeImage = (imageKey) => {
        setCarImages(prev => ({ ...prev, [imageKey]: null }));
    };

    /**
     * Get all images as array for API submission
     */
    const getImagesArray = () => {
        return Object.values(carImages).filter(img => img !== null);
    };

    /**
     * Format vehicle number as user types
     * Formats: TS09EA1234 (no spaces)
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
     * Accepts: AP16GH1, AP16GH12, AP16GH123, AP16GH1234 (9-10 characters)
     */
    const validateVehicleNumber = (number) => {
        // Convert to uppercase and trim
        const cleanNumber = number.trim().toUpperCase();

        // Empty check
        if (!cleanNumber) {
            return { valid: false, error: 'Vehicle number is required' };
        }

        // Length check: minimum 9, maximum 10
        if (cleanNumber.length < 7) {
            return { valid: false, error: 'Vehicle number is too short (min 9 characters)' };
        }

        if (cleanNumber.length > 10) {
            return { valid: false, error: 'Vehicle number is too long (max 10 characters)' };
        }

        // Check first 2 characters are letters (State Code)
        if (!/^[A-Z]{2}/.test(cleanNumber)) {
            return { valid: false, error: 'First 2 characters must be letters (State Code)' };
        }

        // Check next 2 characters are digits (RTO Code)
        if (!/^[A-Z]{2}[0-9]{2}/.test(cleanNumber)) {
            return { valid: false, error: 'Characters 3-4 must be digits (RTO Code)' };
        }

        // Check series (1-2 letters) after RTO code
        const afterRTO = cleanNumber.substring(4);
        const seriesMatch = afterRTO.match(/^[A-Z]{1,2}/);
        
        if (!seriesMatch) {
            return { valid: false, error: 'Invalid series format (must be 1-2 letters after RTO code)' };
        }

        // Full pattern: 2 letters + 2 digits + 1-2 letters + 1-4 digits
        const indianPattern = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/;

        if (!indianPattern.test(cleanNumber)) {
            return { valid: false, error: 'Invalid vehicle number format' };
        }

        // Extract registration number (last digits)
        const digitsAfterSeries = cleanNumber.substring(4).match(/[0-9]+$/);
        
        if (!digitsAfterSeries) {
            return { valid: false, error: 'Registration number missing' };
        }

        const registrationNumber = digitsAfterSeries[0];
        
        // Registration number must be 1-4 digits
        if (registrationNumber.length < 1 || registrationNumber.length > 4) {
            return { valid: false, error: 'Registration number must be 1-4 digits' };
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

        // Only validate if user has typed at least state code + RTO (4 chars)
        if (formatted.length >= 4) {
            const validation = validateVehicleNumber(formatted);
            
            // Show validation when minimum valid length (9) is reached
            if (formatted.length >= 9) {
                if (validation.valid) {
                    setVehicleNumberError('');
                    setVehicleNumberValid(true);
                } else {
                    setVehicleNumberError(validation.error);
                    setVehicleNumberValid(false);
                }
            } else {
                // Still typing, clear validation
                setVehicleNumberError('');
                setVehicleNumberValid(false);
            }
        } else {
            setVehicleNumberError('');
            setVehicleNumberValid(false);
        }
    };

    /**
     * Scroll to a specific field
     */
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

    /**
     * Open dropdown programmatically
     */
    const openDropdown = (dropdownRef) => {
        if (dropdownRef && dropdownRef.current && dropdownRef.current.openDropdown) {
            // Give time for scroll to complete before opening dropdown
            setTimeout(() => {
                dropdownRef.current.openDropdown();
            }, 300);
        }
    };

    /**
     * Validate form fields with enhanced error tracking
     */
    const validateForm = () => {
        const newErrors = {};
        let firstErrorRef = null;
        let firstErrorType = null; // 'dropdown' or 'input'

        // Validate Car Name (typed by the owner)
        if (!cleanVehicleText(carName)) {
            newErrors.carName = 'Please enter car name';
        } else if (!isValidVehicleText(carName)) {
            newErrors.carName = 'Enter a valid car name (2-50 letters/numbers)';
        }
        if (newErrors.carName && !firstErrorRef) {
            firstErrorRef = carNameRef;
            firstErrorType = 'input';
        }

        // Validate Vehicle Number
        if (!vehicleNumber.trim()) {
            newErrors.vehicleNumber = 'Please enter vehicle number';
            if (!firstErrorRef) {
                firstErrorRef = vehicleNumberRef;
                firstErrorType = 'input';
            }
        } else {
            const validation = validateVehicleNumber(vehicleNumber);
            if (!validation.valid) {
                newErrors.vehicleNumber = validation.error;
                if (!firstErrorRef) {
                    firstErrorRef = vehicleNumberRef;
                    firstErrorType = 'input';
                }
                setVehicleNumberError(validation.error);
            } else {
                setVehicleNumberError('');
            }
        }

        // Validate Model (typed by the owner; the backend requires CarModel)
        if (!cleanVehicleText(model)) {
            newErrors.model = 'Please enter car model';
        } else if (!isValidVehicleText(model)) {
            newErrors.model = 'Enter a valid car model (2-50 letters/numbers)';
        }
        if (newErrors.model && !firstErrorRef) {
            firstErrorRef = modelRef;
            firstErrorType = 'input';
        }

        // Validate Seater (Dropdown)
        if (!seater || !seater.value) {
            newErrors.seater = 'Please select number of seats';
            if (!firstErrorRef) {
                firstErrorRef = seaterRef;
                firstErrorType = 'dropdown';
            }
        }

        // Validate Fuel (Dropdown)
        if (!fuel || !fuel.value) {
            newErrors.fuel = 'Please select fuel type';
            if (!firstErrorRef) {
                firstErrorRef = fuelRef;
                firstErrorType = 'dropdown';
            }
        }

        // Validate Transmission (Dropdown)
        if (!transmission || !transmission.value) {
            newErrors.transmission = 'Please select transmission type';
            if (!firstErrorRef) {
                firstErrorRef = transmissionRef;
                firstErrorType = 'dropdown';
            }
        }

        // Validate Total Km (0 or more)
        if (!totalKm.trim()) {
            newErrors.totalKm = 'Please enter total kilometers driven';
            if (!firstErrorRef) {
                firstErrorRef = totalKmRef;
                firstErrorType = 'input';
            }
        } else if (!isNonNegativeNumber(totalKm)) {
            newErrors.totalKm = 'Enter a valid total km';
            if (!firstErrorRef) {
                firstErrorRef = totalKmRef;
                firstErrorType = 'input';
            }
        }

        // Validate Rent Per Hour (greater than 0)
        if (!rentPerHour.trim()) {
            newErrors.rentPerHour = 'Please enter rent per hour';
            if (!firstErrorRef) {
                firstErrorRef = rentPerHourRef;
                firstErrorType = 'input';
            }
        } else if (!isPositiveNumber(rentPerHour)) {
            newErrors.rentPerHour = 'Enter a valid rent per hour';
            if (!firstErrorRef) {
                firstErrorRef = rentPerHourRef;
                firstErrorType = 'input';
            }
        }

        // Validate Rent Per Day (greater than 0)
        if (!rentPerDay.trim()) {
            newErrors.rentPerDay = 'Please enter rent per day';
            if (!firstErrorRef) {
                firstErrorRef = rentPerDayRef;
                firstErrorType = 'input';
            }
        } else if (!isPositiveNumber(rentPerDay)) {
            newErrors.rentPerDay = 'Enter a valid rent per day';
            if (!firstErrorRef) {
                firstErrorRef = rentPerDayRef;
                firstErrorType = 'input';
            }
        }

        // Validate Driver Fee (only when with-driver option is on)
        if (driverAvailable && !isNonNegativeNumber(driverFee)) {
            newErrors.driverFee = 'Enter a valid driver fee';
            if (!firstErrorRef) {
                firstErrorRef = driverFeeRef;
                firstErrorType = 'input';
            }
        }

        // Validate Owner Name
        if (!ownerName.trim()) {
            newErrors.ownerName = 'Please enter owner name';
            if (!firstErrorRef) {
                firstErrorRef = ownerNameRef;
                firstErrorType = 'input';
            }
        } else if (!isValidPersonName(ownerName)) {
            newErrors.ownerName = 'Enter a valid name (letters, spaces and dots only)';
            if (!firstErrorRef) {
                firstErrorRef = ownerNameRef;
                firstErrorType = 'input';
            }
        }

        // Validate Contact Number (Indian mobile)
        if (!isValidMobileNumber(contactNumber)) {
            newErrors.contactNumber = 'Enter a valid 10-digit mobile number';
            if (!firstErrorRef) {
                firstErrorRef = contactNumberRef;
                firstErrorType = 'input';
            }
        }

        // Validate Deposit Money (optional, but must be a number if filled)
        if (depositMoney.trim() && !isNonNegativeNumber(depositMoney)) {
            newErrors.depositMoney = 'Enter a valid deposit amount';
            if (!firstErrorRef) {
                firstErrorRef = depositMoneyRef;
                firstErrorType = 'input';
            }
        }

        // Validate Pickup Location (map pin)
        if (!isValidCoordinate(pickupLatitude, pickupLongitude)) {
            newErrors.pickupLocation = 'Please set the pickup location on the map';
            if (!firstErrorRef) {
                firstErrorRef = pickupLocationRef;
                firstErrorType = 'input';
            }
        }

        // Validate State (Dropdown)
        if (!state || !state.value) {
            newErrors.state = 'Please select state';
            if (!firstErrorRef) {
                firstErrorRef = stateRef;
                firstErrorType = 'dropdown';
            }
        }

        // Validate City (Dropdown)
        if (!city || !city.value) {
            newErrors.city = 'Please select city';
            if (!firstErrorRef) {
                firstErrorRef = cityRef;
                firstErrorType = 'dropdown';
            }
        }

        // Validate Pickup Area
        if (!pickupArea.trim()) {
            newErrors.pickupArea = 'Please enter vehicle pickup area';
            if (!firstErrorRef) {
                firstErrorRef = pickupAreaRef;
                firstErrorType = 'input';
            }
        } else if (pickupArea.trim().length < 2) {
            newErrors.pickupArea = 'Enter a valid pickup area';
            if (!firstErrorRef) {
                firstErrorRef = pickupAreaRef;
                firstErrorType = 'input';
            }
        }

        // Validate Pincode
        if (!pincode.trim()) {
            newErrors.pincode = 'Please enter pincode';
            if (!firstErrorRef) {
                firstErrorRef = pincodeRef;
                firstErrorType = 'input';
            }
        } else if (!isValidPincode(pincode)) {
            newErrors.pincode = 'Enter a valid 6-digit pincode';
            if (!firstErrorRef) {
                firstErrorRef = pincodeRef;
                firstErrorType = 'input';
            }
        }

        // Check if at least one image is uploaded
        const imagesArray = getImagesArray();
        if (imagesArray.length === 0) {
            newErrors.images = 'Please upload at least one car image';
            if (!firstErrorRef) {
                firstErrorRef = imagesRef;
                firstErrorType = 'input';
            }
        }

        setErrors(newErrors);

        // Scroll to first error field and open dropdown if needed
        if (firstErrorRef && Object.keys(newErrors).length > 0) {
            scrollToField(firstErrorRef);

            // If the first error is a dropdown, open it automatically
            if (firstErrorType === 'dropdown') {
                openDropdown(firstErrorRef);
            }

            return false;
        }

        return true;
    };

    /**
     * Submit car listing to API
     */
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
            // Create FormData for multipart/form-data request
            const formData = new FormData();

            // Clean vehicle number (already clean, no spaces)
            const cleanVehicleNumber = vehicleNumber.toUpperCase().trim();

            // Add text fields
            formData.append('userId', userId);
            formData.append('CarName', cleanVehicleText(carName));
            formData.append('CarModel', cleanVehicleText(model));
            formData.append('CarNumber', cleanVehicleNumber);
            formData.append('Carseater', seater.value);
            formData.append('gps', gpsAvailable.toString());
            formData.append('fuelType', fuel.value);
            formData.append('transmissionType', transmission.value);
            formData.append('kmDriven', totalKm);
            formData.append('Ac_available', acAvailable.toString());
            formData.append('description', description.trim() || 'No description');
            formData.append('RentPerHour', rentPerHour);
            formData.append('RentPerDay', rentPerDay);
            formData.append('driverAvailable', driverAvailable.toString());
            if (driverAvailable) {
                formData.append('driverFee', driverFee || '0');
            }
            formData.append('contactNumber', contactNumber.trim());
            formData.append('contactName', ownerName.trim());
            formData.append('drivingLicenseRequired', drivingLicense.toString());
            formData.append('AadharCardRequired', aadharCard.toString());
            formData.append('DepositAmount', depositMoney || '0');
            formData.append('DepositVehicle', depositVehicle.toString());
            formData.append('pickupLatitude', pickupLatitude);
            formData.append('pickupLongitude', pickupLongitude);
            formData.append('pickupCity', city.value);
            formData.append('pickupCityPinCode', pincode.trim());
            formData.append('pickupCityState', state.value);
            formData.append('pickupCityCountry', 'india');
            formData.append('pickupArea', pickupArea.trim());

            // Add images - get all non-null images from the object
            const imagesArray = getImagesArray();

            imagesArray.forEach((image, index) => {
                formData.append('carImages', {
                    uri: image.uri,
                    type: image.type,
                    name: image.name,
                });
            });

            // Call API using carService
            const response = await carService.createCar(formData);
            // Show success popup
            setShowSuccessPopup(true);

        } catch (error) {
            const message = error.message || 'Failed to list your car. Please try again.';

            if (message.includes('HTTP 403') && message.includes('Vehicle limit reached')) {
                Alert.alert(
                    'Vehicle limit reached',
                    'Upgrade to Pro to list more than one vehicle.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'View Plans', onPress: () => navigation.navigate('SubscriptionScreen') },
                    ]
                );
            } else {
                showError(message);
            }
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
                title="List your Car"
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
                <Text style={styles.sectionTitle}>Car Details</Text>

                <View ref={carNameRef}>
                    <FormInput
                        label="Car Name"
                        value={carName}
                        onChangeText={(text) => {
                            setCarName(text);
                            if (errors.carName) {
                                setErrors(prev => ({ ...prev, carName: '' }));
                            }
                        }}
                        autoCapitalize="words"
                        maxLength={50}
                        error={!!errors.carName}
                        errorMessage={errors.carName}
                        required
                    />
                </View>

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
                            <Text style={styles.hintText}>Format: AA00AA0000 (9-10 chars)</Text>
                        ) : null}
                    </View>
                </View>

                <View ref={modelRef}>
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
                        error={!!errors.model}
                        errorMessage={errors.model}
                        required
                    />
                </View>

                <View ref={seaterRef}>
                    <FormDropdown
                        label="Seater"
                        value={seater}
                        onSelect={(selected) => {
                            setSeater(selected);
                            if (errors.seater) {
                                setErrors(prev => ({ ...prev, seater: '' }));
                            }
                        }}
                        options={seaterOptions}
                        placeholder="Select seater"
                        forceClose={forceCloseDropdowns}
                        error={!!errors.seater}
                        errorMessage={errors.seater}
                        required
                    />
                </View>

                <View ref={fuelRef}>
                    <FormDropdown
                        label="Fuel"
                        value={fuel}
                        onSelect={(selected) => {
                            setFuel(selected);
                            if (errors.fuel) {
                                setErrors(prev => ({ ...prev, fuel: '' }));
                            }
                        }}
                        options={fuelOptions}
                        placeholder="Select fuel type"
                        forceClose={forceCloseDropdowns}
                        error={!!errors.fuel}
                        errorMessage={errors.fuel}
                        required
                    />
                </View>

                <View ref={transmissionRef}>
                    <FormDropdown
                        label="Transmission"
                        value={transmission}
                        onSelect={(selected) => {
                            setTransmission(selected);
                            if (errors.transmission) {
                                setErrors(prev => ({ ...prev, transmission: '' }));
                            }
                        }}
                        options={transmissionOptions}
                        placeholder="Select transmission"
                        forceClose={forceCloseDropdowns}
                        error={!!errors.transmission}
                        errorMessage={errors.transmission}
                        required
                    />
                </View>

                <View ref={totalKmRef}>
                    <FormInput
                        label="Total Km Vehicle run"
                        value={totalKm}
                        onChangeText={(text) => {
                            setTotalKm(text);
                            if (errors.totalKm) {
                                setErrors(prev => ({ ...prev, totalKm: '' }));
                            }
                        }}
                        placeholder="Enter total km vehicle run"
                        keyboardType="numeric"
                        error={!!errors.totalKm}
                        errorMessage={errors.totalKm}
                        required
                        autoComplete="off"
                    />
                </View>

                <FormSwitch
                    label="AC Available"
                    value={acAvailable}
                    onValueChange={setAcAvailable}
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
                    placeholder="Car condition, features, etc."
                    multiline={true}
                    numberOfLines={4}
                    style={styles.descriptionInput}
                />

                <Text style={styles.sectionTitle}>Price</Text>
                <View ref={rentPerHourRef}>
                    <FormInput
                        label="Rent Per Hour"
                        value={rentPerHour}
                        onChangeText={(text) => {
                            setRentPerHour(text);
                            if (errors.rentPerHour) {
                                setErrors(prev => ({ ...prev, rentPerHour: '' }));
                            }
                        }}
                        placeholder="Enter rent per hour"
                        keyboardType="numeric"
                        error={!!errors.rentPerHour}
                        errorMessage={errors.rentPerHour}
                        required
                        autoComplete="off"
                    />
                </View>

                <View ref={rentPerDayRef}>
                    <FormInput
                        label="Rent Per Day"
                        value={rentPerDay}
                        onChangeText={(text) => {
                            setRentPerDay(text);
                            if (errors.rentPerDay) {
                                setErrors(prev => ({ ...prev, rentPerDay: '' }));
                            }
                        }}
                        placeholder="Enter rent per day"
                        keyboardType="numeric"
                        error={!!errors.rentPerDay}
                        errorMessage={errors.rentPerDay}
                        required
                        autoComplete="off"
                    />
                </View>

                <FormSwitch
                    label="Offer a with-driver option"
                    value={driverAvailable}
                    onValueChange={setDriverAvailable}
                />
                {driverAvailable && (
                    <View ref={driverFeeRef}>
                        <FormInput
                            label="Driver Fee (₹, flat)"
                            value={driverFee}
                            onChangeText={(text) => {
                                setDriverFee(text);
                                if (errors.driverFee) {
                                    setErrors(prev => ({ ...prev, driverFee: '' }));
                                }
                            }}
                            placeholder="Added when a customer books with a driver"
                            keyboardType="numeric"
                            error={!!errors.driverFee}
                            errorMessage={errors.driverFee}
                            required
                            autoComplete="off"
                        />
                    </View>
                )}

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
                        placeholder="Enter contact number"
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

                <FormSwitch
                    label="Deposit Vehicle"
                    value={depositVehicle}
                    onValueChange={setDepositVehicle}
                />

                <View style={styles.orContainer}>
                    <Text style={styles.orText}>Or</Text>
                </View>

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

                <View ref={stateRef}>
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
                        error={!!errors.state}
                        errorMessage={errors.state}
                        required
                    />
                </View>

                <View ref={cityRef}>
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
                        error={!!errors.city}
                        errorMessage={errors.city}
                        required
                    />
                </View>

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

                <Text style={styles.sectionTitle}>Car Images</Text>
                <Text style={styles.imageHintText}>Upload images of your car from different angles</Text>

                <View ref={imagesRef} style={styles.imageGridContainer}>
                    {IMAGE_VIEWS.map(({ key, label }) => (
                        <View key={key} style={styles.imageBoxWrapper}>
                            <TouchableOpacity
                                style={[
                                    styles.imageUploadBox,
                                    !!errors.images && !carImages[key] && styles.imageUploadBoxError
                                ]}
                                onPress={() => pickImage(key)}
                                activeOpacity={0.7}
                            >
                                {carImages[key] ? (
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: carImages[key].uri }}
                                            style={styles.uploadedImage}
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(key)}
                                        >
                                            <Icon name="close" size={16} color={Colors.white} />
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <>
                                        <Icon
                                            name="camera-alt"
                                            size={28}
                                            color={!!errors.images ? '#FF0000' : Colors.text.secondary}
                                        />
                                        <Text style={[
                                            styles.imageBoxLabel,
                                            !!errors.images && styles.imageBoxLabelError
                                        ]}>
                                            {label}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            {!!errors.images && !carImages[key] && (
                                <Text style={styles.imageBoxErrorText}>Please upload image</Text>
                            )}
                        </View>
                    ))}
                </View>

                <Text style={styles.imageCountText}>
                    {Object.values(carImages).filter(img => img !== null).length} of 5 images uploaded
                </Text>

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
                message="Your listed car will be visible to all users"
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
    addressInput: {
        marginBottom: Spacing.md,
    },
    orContainer: {
        alignItems: 'center',
        marginVertical: Spacing.md,
    },
    orText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
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
        marginBottom: Spacing.sm,
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
        borderRadius: BorderRadius.md - 2,
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
    },
    button: {
        marginBottom: Platform.OS === 'android' ? Spacing.xxxxl : Spacing.lg,

    },
    loader: {
        marginVertical: Spacing.lg,
    },
});

export default ListYourCarScreen;