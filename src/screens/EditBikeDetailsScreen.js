import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { bikeService } from '../api';
import Button from '../components/Button/Button';
import FormDropdown from '../components/FormDropdown';
import FormInput from '../components/FormInput';
import FormSwitch from '../components/FormSwitch';
import PickupLocationMap from '../components/PickupLocationMap';
import { Colors } from '../constants/Colors';
import { useDataCache } from '../context/DataCacheContext';
import { useToast } from '../context/ToastContext';
import { getCitiesForState, indianStatesOptions } from '../data/indianStates';
import { fetchPincodeDetails, formatCityOption, formatStateOption } from '../utils/pincodeUtils';
import {
    isNonNegativeNumber,
    isPositiveNumber,
    isValidCoordinate,
    isValidMobileNumber,
    isValidPersonName,
    isValidPincode,
} from '../utils/vehicleFormValidation';

const EditBikeDetailsScreen = ({ navigation, route }) => {
    const { showSuccess, showError, showWarning } = useToast();
    const { bikeId, bike } = route.params || {};

    // Get cache functions
    const { updateVehicleInCache, deleteVehicleFromCache, refreshCache } = useDataCache();

    // Loading states
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Editable form fields
    const [vehicleName, setVehicleName] = useState('');
    const [speed, setSpeed] = useState('');
    const [rentPrice, setRentPrice] = useState('');
    const [selectedUnit, setSelectedUnit] = useState({ value: 'hour', label: 'Hour' });
    const [description, setDescription] = useState('');
    const [additionalImages, setAdditionalImages] = useState([]);
    const [isAvailable, setIsAvailable] = useState(false);
    const [vehicleImage, setVehicleImage] = useState(require('../assets/Images/car.png'));
    
    // Contact Information
    const [name, setName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    
    // Customer Required Documents
    const [requireDrivingLicense, setRequireDrivingLicense] = useState(false);
    const [requireAadharCard, setRequireAadharCard] = useState(false);
    const [depositMoney, setDepositMoney] = useState('');
    
    // Vehicle Pickup Address
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [street, setStreet] = useState('');
    const [doorNumber, setDoorNumber] = useState('');
    const [pincodeLoading, setPincodeLoading] = useState(false);

    // Pickup Location Coordinates (loaded from the saved bike; empty lets the map auto-locate)
    const [pickupLatitude, setPickupLatitude] = useState('');
    const [pickupLongitude, setPickupLongitude] = useState('');

    // Validation error states - stores error messages for each field
    const [errors, setErrors] = useState({});

    // Refs for scrolling to fields
    const scrollViewRef = useRef(null);
    const rentPriceRef = useRef(null);
    const nameRef = useRef(null);
    const contactNumberRef = useRef(null);
    const depositMoneyRef = useRef(null);
    const pickupLocationRef = useRef(null);
    const stateRef = useRef(null);
    const cityRef = useRef(null);
    const pincodeRef = useRef(null);
    const pickupAreaRef = useRef(null);

    // Dropdown Options
    const unitOptions = [
        { value: 'hour', label: 'Hour' },
        { value: 'day', label: 'Day' },
       
    ];

    // Indian states options imported from ../data/indianStates.js
    const stateOptions = indianStatesOptions;

    // Get cities based on selected state
    const cityOptions = getCitiesForState(state.label);

    // Fetch bike details on mount
    useEffect(() => {
        if (bikeId) {
            fetchBikeDetails();
        } else {
            setLoading(false);
        }
    }, [bikeId]);

    const fetchBikeDetails = async () => {
        try {
            setLoading(true);
            const response = await bikeService.getBikeById(bikeId);
            
            if (response && response.bike) {
                const bike = response.bike;
                
                const bikeName = `${bike.BikeName} ${bike.BikeModel || ''}`.trim();
                const bikeSpeed = bike.mileage || '50 kmpl';
                const bikePrice = bike.RentPerHour?.toString() || '';
                const bikeImage = bike.bikeImages && bike.bikeImages.length > 0 
                    ? { uri: bike.bikeImages[0] } 
                    : require('../assets/Images/car.png');
                const bikeAvailable = bike.isAvailable !== false;

                // Set vehicle image
                setVehicleImage(bikeImage);

                // Set editable form fields
                setVehicleName(bikeName);
                setRentPrice(bikePrice);
                setDescription(bike.description || '');
                setIsAvailable(bikeAvailable);
                setSpeed(bikeSpeed);
                
                setName(bike.contactName || '');
                setContactNumber(bike.contactNumber || '');
                
                setRequireDrivingLicense(bike.drivingLicenseRequired === 'true' || bike.drivingLicenseRequired === true);
                setRequireAadharCard(bike.AadharCardRequired === 'true' || bike.AadharCardRequired === true);
                setDepositMoney(bike.DepositAmount?.toString() || '');
                
                setState({ label: bike.pickupCityState, value: bike.pickupCityState });
                setCity({ label: bike.pickupCity, value: bike.pickupCity });
                setPincode(bike.pickupCityPinCode || '');
                setStreet(bike.pickupArea || '');
                setDoorNumber(bike.doorNumber || '');

                // Saved pickup pin (leave empty if missing so the map auto-locates)
                if (isValidCoordinate(bike.latitude, bike.longitude)) {
                    setPickupLatitude(String(bike.latitude));
                    setPickupLongitude(String(bike.longitude));
                }
            }
        } catch (error) {

            showError('Failed to load bike details');
        } finally {
            setLoading(false);
        }
    };

    const handleBackPress = () => navigation.goBack();

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
            setPincodeLoading(false);

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

                // Auto-fill street/area
                if (result.area) {
                    setStreet(result.area);
                }

                showSuccess('Address details auto-filled successfully!');
            } else {
                showError(result.error || 'Failed to fetch pincode details');
            }
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

        // Auto-fill pickup area (saved as pickupArea on this screen)
        if (address.area) {
            setStreet(address.area);
            filledFields.push('pickupArea');
        }

        setErrors(prev => {
            const next = { ...prev };
            filledFields.forEach(field => { next[field] = ''; });
            return next;
        });
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
     * Validate form fields; scrolls to the first invalid field
     */
    const validateForm = () => {
        const newErrors = {};
        let firstErrorRef = null;

        // Validate Rent Price (greater than 0)
        if (!rentPrice.trim()) {
            newErrors.rentPrice = 'Please enter rent price';
            if (!firstErrorRef) firstErrorRef = rentPriceRef;
        } else if (!isPositiveNumber(rentPrice)) {
            newErrors.rentPrice = 'Enter a valid rent price';
            if (!firstErrorRef) firstErrorRef = rentPriceRef;
        }

        // Validate Owner Name
        if (!name.trim()) {
            newErrors.name = 'Please enter owner name';
            if (!firstErrorRef) firstErrorRef = nameRef;
        } else if (!isValidPersonName(name)) {
            newErrors.name = 'Enter a valid name (letters, spaces and dots only)';
            if (!firstErrorRef) firstErrorRef = nameRef;
        }

        // Validate Contact Number (Indian mobile)
        if (!isValidMobileNumber(contactNumber)) {
            newErrors.contactNumber = 'Enter a valid 10-digit mobile number';
            if (!firstErrorRef) firstErrorRef = contactNumberRef;
        }

        // Validate Deposit Money (optional, but must be a number if filled)
        if (String(depositMoney).trim() && !isNonNegativeNumber(depositMoney)) {
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
            if (!firstErrorRef) firstErrorRef = stateRef;
        }

        // Validate City (Dropdown)
        if (!city || !city.value) {
            newErrors.city = 'Please select city';
            if (!firstErrorRef) firstErrorRef = cityRef;
        }

        // Validate Pincode
        if (!pincode.trim()) {
            newErrors.pincode = 'Please enter pincode';
            if (!firstErrorRef) firstErrorRef = pincodeRef;
        } else if (!isValidPincode(pincode)) {
            newErrors.pincode = 'Enter a valid 6-digit pincode';
            if (!firstErrorRef) firstErrorRef = pincodeRef;
        }

        // Validate Pickup Area
        if (!street.trim()) {
            newErrors.pickupArea = 'Please enter vehicle pickup area';
            if (!firstErrorRef) firstErrorRef = pickupAreaRef;
        } else if (street.trim().length < 2) {
            newErrors.pickupArea = 'Enter a valid pickup area';
            if (!firstErrorRef) firstErrorRef = pickupAreaRef;
        }

        setErrors(newErrors);

        // Scroll to first error field
        if (firstErrorRef && Object.keys(newErrors).length > 0) {
            scrollToField(firstErrorRef);
            return false;
        }

        return true;
    };

    const handleDeletePress = () => {
        Alert.alert(
            'Delete Bike',
            'Are you sure you want to delete this bike?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!bikeId) {
                                return;
                            }

                            const response = await bikeService.deleteBike(bikeId);

                            if (response?.message?.includes('deleted') || response?.success) {
                                // Update cache - remove deleted bike from lists
                                deleteVehicleFromCache(bikeId, 'bike');
                                // Also force refresh to ensure lists are updated
                                refreshCache('nearbyBikes', null, {});

                                showSuccess('Bike deleted successfully!');
                                navigation.navigate('MyListedBookingsScreen', { refresh: true });
                            }
                        } catch (error) {

                            showError('Failed to delete bike');
                        }
                    },
                },
            ]
        );
    };

    const pickImage = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 2000,
            maxWidth: 2000,
            quality: 1,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) return;
            if (response.errorMessage) {
                showError(response.errorMessage);
            } else if (response.assets && response.assets[0]) {
                if (additionalImages.length < 4) {
                    setAdditionalImages([...additionalImages, response.assets[0].uri]);
                } else {
                    showWarning('You can only add up to 4 photos.');
                }
            }
        });
    };

    const removeImage = (index) => {
        const newImages = additionalImages.filter((_, i) => i !== index);
        setAdditionalImages(newImages);
    };

    const handleSave = async () => {
        if (!vehicleName.trim()) {
            showError('Please fill all required fields');
            return;
        }

        if (!validateForm()) {
            return;
        }

        try {
            setUpdating(true);

            const formData = new FormData();
            
            // Split vehicle name back to BikeName and BikeModel if needed
            const nameParts = vehicleName.trim().split(' ');
            const bikeName = nameParts[0] || vehicleName;
            const bikeModel = nameParts.slice(1).join(' ') || '';
            
            formData.append('BikeName', bikeName);
            if (bikeModel) {
                formData.append('BikeModel', bikeModel);
            }
            formData.append('RentPerHour', rentPrice);
            formData.append('description', description);
            formData.append('isAvailable', isAvailable); // Changed from 'Available' to 'isAvailable'
            formData.append('mileage', speed);
            formData.append('contactName', name);
            formData.append('contactNumber', contactNumber);
            formData.append('AadharCardRequired', requireAadharCard);
            formData.append('drivingLicenseRequired', requireDrivingLicense);
            formData.append('DepositAmount', depositMoney);
            formData.append('pickupArea', street);
            formData.append('pickupCity', city.value);
            formData.append('pickupCityState', state.value);
            formData.append('pickupCityPinCode', pincode);
            formData.append('doorNumber', doorNumber);
            formData.append('latitude', pickupLatitude);
            formData.append('longitude', pickupLongitude);

            // Add newly picked images
            additionalImages.forEach((imgUri, index) => {
                const fileName = imgUri.split('/').pop();
                const match = /\.(\w+)$/.exec(fileName);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                formData.append('bikeImages', { 
                    uri: imgUri, 
                    name: fileName || `image_${index}.jpg`, 
                    type 
                });
            });


            const response = await bikeService.updateBike(bikeId, formData);

            if (response?.success || response?.message?.includes('updated')) {
                // Update cache with new bike data
                const updatedBikeData = {
                    BikeName: vehicleName,
                    bikeName: vehicleName,
                    name: vehicleName,
                    RentPerHour: rentPrice,
                    pricePerKm: rentPrice,
                    price: rentPrice,
                    description: description,
                    isAvailable: isAvailable,
                    mileage: speed,
                    contactName: name,
                    contactNumber: contactNumber,
                    pickupArea: street,
                    pickupCity: city.value,
                    pickupCityState: state.value,
                    pickupCityPinCode: pincode,
                    latitude: pickupLatitude,
                    longitude: pickupLongitude,
                };
                updateVehicleInCache(bikeId, updatedBikeData, 'bike');
                // Force refresh to recalculate distances and ensure lists are updated
                refreshCache('nearbyBikes', null, {});

                showSuccess('Bike details updated successfully!');
                navigation.goBack();
            } else {
                showError(response?.message || 'Failed to update bike details');
            }
        } catch (error) {

            showError(error?.message || 'Something went wrong while updating bike');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, styles.centerContent]}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Loading bike details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.innerContainer}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                            <Ionicons name="chevron-back" size={28} color="#000" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Edit your Bike</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
                            <Ionicons name="trash-outline" size={28} color="#FF3B30" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        ref={scrollViewRef}
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Vehicle Info Card */}
                        <View style={styles.vehicleCard}>
                            <Image source={
                                additionalImages.length > 0 
                                    ? { uri: additionalImages[0] } 
                                    : vehicleImage
                            } style={styles.vehicleImage} />
                            <View style={styles.vehicleInfo}>
                                <View style={styles.vehicleHeaderRow}>
                                    <Text style={styles.vehicleName}>{vehicleName || 'Vehicle Name'}</Text>

                                    <TouchableOpacity
                                        style={[
                                            styles.toggleContainer,
                                            isAvailable ? styles.toggleContainerOn : styles.toggleContainerOff,
                                        ]}
                                        onPress={() => setIsAvailable(!isAvailable)}
                                        activeOpacity={0.8}
                                    >
                                        <View
                                            style={[
                                                styles.toggleThumb,
                                                isAvailable ? styles.toggleThumbOn : styles.toggleThumbOff,
                                            ]}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <Text style={[
                                    styles.availabilityStatusText,
                                    isAvailable ? styles.availabilityStatusOn : styles.availabilityStatusOff
                                ]}>
                                    {isAvailable ? '● Available' : '● Not Available'}
                                </Text>

                                <View style={styles.speedRow}>
                                    <Image
                                        source={require('../assets/Icons/bikespeed.png')}
                                        style={styles.speedIcon}
                                    />
                                    <Text style={styles.speedText}>{speed}</Text>
                                </View>

                                <View style={styles.infoRow}>
                                    <Image
                                        source={require('../assets/Icons/location.png')}
                                        style={styles.icon}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.infoText} numberOfLines={2}>
                                        {street && city.label ? `${street}, ${city.label}` : 'No location set'}
                                    </Text>
                                </View>

                                <Text style={styles.vehiclePrice}>
                                    ₹{rentPrice || '0'}/{selectedUnit.label.toLowerCase()}
                                </Text>
                            </View>
                        </View>

                        {/* Description */}
                        <Text style={styles.sectionTitle}>Description</Text>
                        <FormInput
                            label=""
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Bike Description"
                            multiline
                            numberOfLines={4}
                            style={{ marginBottom: 8 }}
                        />

                        {/* Price */}
                        <Text style={styles.sectionTitle}>Price</Text>
                        <View style={styles.priceSection}>
                            <View ref={rentPriceRef} style={styles.priceInputContainer}>
                                <FormInput
                                    label="Rent Price (per hour / per day)"
                                    value={rentPrice}
                                    onChangeText={(text) => {
                                        setRentPrice(text);
                                        if (errors.rentPrice) {
                                            setErrors(prev => ({ ...prev, rentPrice: '' }));
                                        }
                                    }}
                                    placeholder="250"
                                    keyboardType="numeric"
                                    style={{ flex: 1, marginRight: 8 }}
                                    error={!!errors.rentPrice}
                                    errorMessage={errors.rentPrice}
                                    required
                                />
                            </View>
                            <View style={styles.unitDropdownContainer}>
                                <FormDropdown
                                    label="Unit"
                                    value={selectedUnit}
                                    onSelect={setSelectedUnit}
                                    options={unitOptions}
                                    placeholder="Select Unit"
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </View>

                        {/* Contact Information */}
                        <Text style={styles.sectionTitle}>Your Contact information</Text>
                        <View ref={nameRef}>
                            <FormInput
                                label="Name"
                                value={name}
                                onChangeText={(text) => {
                                    setName(text);
                                    if (errors.name) {
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                                placeholder="Manoj Kumar"
                                error={!!errors.name}
                                errorMessage={errors.name}
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
                                keyboardType="phone-pad"
                                maxLength={13}
                                error={!!errors.contactNumber}
                                errorMessage={errors.contactNumber}
                                required
                            />
                        </View>

                        {/* Customer Required Documents */}
                        <Text style={styles.sectionTitle}>Customer Required Documents</Text>
                        
                        <FormSwitch
                            label="Driving License"
                            value={requireDrivingLicense}
                            onValueChange={setRequireDrivingLicense}
                        />

                        <FormSwitch
                            label="Aadhar Card"
                            value={requireAadharCard}
                            onValueChange={setRequireAadharCard}
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
                                keyboardType="numeric"
                                error={!!errors.depositMoney}
                                errorMessage={errors.depositMoney}
                            />
                        </View>

                        {/* Vehicle Pickup Address */}
                        <Text style={styles.sectionTitle}>Vehicle Pickup Address</Text>

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
                                placeholder="Select State"
                                required
                                error={!!errors.state}
                                errorMessage={errors.state}
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
                                placeholder="Select City"
                                required
                                error={!!errors.city}
                                errorMessage={errors.city}
                            />
                        </View>

                        <View ref={pincodeRef}>
                            <FormInput
                                label="Pincode"
                                value={pincode}
                                onChangeText={handlePincodeChange}
                                keyboardType="numeric"
                                maxLength={6}
                                required
                                error={!!errors.pincode}
                                errorMessage={errors.pincode}
                            />
                        </View>
                        {pincodeLoading && (
                            <ActivityIndicator
                                size="small"
                                color={Colors.primary}
                                style={{ marginTop: -8, marginBottom: 8 }}
                            />
                        )}

                        {/* Saved to the bike's pickupArea */}
                        <View ref={pickupAreaRef}>
                            <FormInput
                                label="Pickup Area"
                                value={street}
                                onChangeText={(text) => {
                                    setStreet(text);
                                    if (errors.pickupArea) {
                                        setErrors(prev => ({ ...prev, pickupArea: '' }));
                                    }
                                }}
                                required
                                error={!!errors.pickupArea}
                                errorMessage={errors.pickupArea}
                            />
                        </View>

                        <FormInput
                            label="Door Number"
                            value={doorNumber}
                            onChangeText={setDoorNumber}
                        />

                        {/* Add Photos */}
                        <TouchableOpacity style={styles.addPhotosButton} onPress={pickImage}>
                            <Ionicons name="image-outline" size={40} color="#BDC3C7" />
                            <Text style={styles.addPhotosText}>Add photos</Text>
                        </TouchableOpacity>

                        {additionalImages.length > 0 && (
                            <ScrollView 
                                horizontal 
                                showsHorizontalScrollIndicator={false} 
                                style={styles.imagesScroll}
                            >
                                {additionalImages.map((image, index) => (
                                    <View key={index} style={styles.imageItem}>
                                        <Image source={{ uri: image }} style={styles.thumbnail} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#FF3B30" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <Text style={styles.photoHint}>
                            Photos: {additionalImages.length}/4. Select a main image and add supporting pictures to highlight your bike.
                        </Text>

                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {/* Save Button */}
                    <View style={styles.saveButtonContainer}>
                        <Button 
                            title={updating ? "Saving..." : "Save & Close"} 
                            onPress={handleSave}
                            disabled={updating}
                        />
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContent: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: 15,
    },
    innerContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 25,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5E5',
    },
    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    deleteButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        textAlign: 'center',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    vehicleCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
        marginVertical: 12,
        padding: 12,
    },
    vehicleImage: {
        width: 120,
        height: 100,
        borderRadius: 12,
        marginRight: 12,
    },
    vehicleInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    vehicleHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    vehicleName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        flexShrink: 1,
    },
    toggleContainer: {
        width: 51,
        height: 31,
        borderRadius: 15.5,
        padding: 2,
        justifyContent: 'center',
    },
    toggleContainerOn: {
        backgroundColor: '#34C759',
        alignItems: 'flex-end',
    },
    toggleContainerOff: {
        backgroundColor: '#E5E5EA',
        alignItems: 'flex-start',
    },
    toggleThumb: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2.5,
        elevation: 4,
    },
    toggleThumbOn: {},
    toggleThumbOff: {},
    availabilityStatusText: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 4,
    },
    availabilityStatusOn: {
        color: '#34C759',
    },
    availabilityStatusOff: {
        color: '#8E8E93',
    },
    speedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    speedText: {
        fontSize: 13,
        color: '#666',
        marginLeft: 4,
    },
    speedIcon: {
        width: 16,
        height: 16,
        resizeMode: 'contain',
        marginRight: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#444',
        flexShrink: 1,
    },
    vehiclePrice: {
        fontSize: 15,
        fontWeight: '700',
        color: '#000',
        marginTop: 6,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 5,
        marginTop: 8,
    },
    priceSection: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    priceInputContainer: {
        flex: 2,
    },
    unitDropdownContainer: {
        flex: 1,
    },
    addPhotosButton: {
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: 8,
        borderStyle: 'dashed',
        paddingVertical: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAFAFA',
        marginBottom: 12,
        marginTop: 8,
    },
    addPhotosText: {
        fontSize: 15,
        color: '#555',
        marginTop: 8,
        fontWeight: '500',
    },
    imagesScroll: {
        marginVertical: 12,
    },
    imageItem: {
        marginRight: 12,
        position: 'relative',
    },
    thumbnail: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    photoHint: {
        fontSize: 11,
        color: '#999',
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: -80,
    },
    saveButtonContainer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
    },
});

export default EditBikeDetailsScreen;