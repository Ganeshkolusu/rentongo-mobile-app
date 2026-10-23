import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
// Note: Platform is used for Android version check
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius, normalize } from '../constants/Dimensions';
import FormInput from '../components/FormInput';
import PhotoUpload from '../components/PhotoUpload';
import Button from '../components/Button/Button';
import BookingSuccessPopup from '../components/BookingSuccessPopup';
import Header from '../components/Header/Header';
import PickupLocationMap from '../components/PickupLocationMap';
import { createAuto } from '../api/autoApi';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../context/AuthContext';
import {
    isPositiveNumber,
    isValidCoordinate,
    isValidMobileNumber,
    isValidPersonName,
} from '../utils/vehicleFormValidation';

const ListYourAutoScreen = ({ navigation, route }) => {
    // Auto Details
    const [autoNumber, setAutoNumber] = useState('');
    const [description, setDescription] = useState('');

    // Price
    const [pricePerKm, setPricePerKm] = useState('');

    // Contact Information
    const [contactName, setContactName] = useState('');
    const [contactNumber, setContactNumber] = useState('');

    // UI States
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [loading, setLoading] = useState(false);
    const [autoImages, setAutoImages] = useState([]);

    // Pickup Location Coordinates (set from the map pin; empty until placed)
    const [pickupLatitude, setPickupLatitude] = useState('');
    const [pickupLongitude, setPickupLongitude] = useState('');

    // Validation error states - stores error messages for each field
    const [errors, setErrors] = useState({});

    // Refs for scrolling to fields
    const scrollViewRef = useRef(null);
    const autoNumberRef = useRef(null);
    const descriptionRef = useRef(null);
    const pricePerKmRef = useRef(null);
    const contactNameRef = useRef(null);
    const contactNumberRef = useRef(null);
    const pickupLocationRef = useRef(null);
    const imagesRef = useRef(null);

    // Get userId from context
    const { user } = useAuth();

    /**
     * Handle a pin set on the pickup location map. Autos only store
     * coordinates (no address fields), so the geocoded address is not used.
     */
    const handlePickupLocationChange = ({ latitude, longitude }) => {
        setPickupLatitude(String(latitude));
        setPickupLongitude(String(longitude));
        if (errors.pickupLocation) {
            setErrors(prev => ({ ...prev, pickupLocation: '' }));
        }
    };

    /**
     * Update a field and clear its error
     */
    const handleFieldChange = (setter, field) => (text) => {
        setter(text);
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    /**
     * Pick images from gallery - uses Photo Picker on Android 13+ (no permissions needed)
     */
    const pickImages = async () => {
        try {
            // Android 13+ uses Photo Picker which doesn't require permissions
            if (Platform.OS !== 'android' || Platform.Version < 33) {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Photo library permission is required to upload images');
                    return;
                }
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 5,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map((asset, index) => ({
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `auto_${Date.now()}_${index}.jpg`,
                }));
                setAutoImages([...autoImages, ...newImages]);
                if (errors.images) {
                    setErrors(prev => ({ ...prev, images: '' }));
                }
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to pick images');
        }
    };

    /**
     * Remove an image
     */
    const removeImage = (index) => {
        const updatedImages = autoImages.filter((_, i) => i !== index);
        setAutoImages(updatedImages);
    };

    const handleGoBack = () => {
        navigation.goBack();
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
     * Validate form data; scrolls to the first invalid field
     */
    const validateForm = () => {
        const newErrors = {};
        let firstErrorRef = null;

        if (!autoNumber.trim()) {
            newErrors.autoNumber = 'Please enter auto number';
            if (!firstErrorRef) firstErrorRef = autoNumberRef;
        }

        if (!description.trim()) {
            newErrors.description = 'Please enter auto description';
            if (!firstErrorRef) firstErrorRef = descriptionRef;
        }

        // Price per km (greater than 0)
        if (!pricePerKm.trim()) {
            newErrors.pricePerKm = 'Please enter price per km';
            if (!firstErrorRef) firstErrorRef = pricePerKmRef;
        } else if (!isPositiveNumber(pricePerKm)) {
            newErrors.pricePerKm = 'Enter a valid price per km';
            if (!firstErrorRef) firstErrorRef = pricePerKmRef;
        }

        // Contact name
        if (!contactName.trim()) {
            newErrors.contactName = 'Please enter contact name';
            if (!firstErrorRef) firstErrorRef = contactNameRef;
        } else if (!isValidPersonName(contactName)) {
            newErrors.contactName = 'Enter a valid name (letters, spaces and dots only)';
            if (!firstErrorRef) firstErrorRef = contactNameRef;
        }

        // Contact number (Indian mobile)
        if (!isValidMobileNumber(contactNumber)) {
            newErrors.contactNumber = 'Enter a valid 10-digit mobile number';
            if (!firstErrorRef) firstErrorRef = contactNumberRef;
        }

        // Pickup location (map pin)
        if (!isValidCoordinate(pickupLatitude, pickupLongitude)) {
            newErrors.pickupLocation = 'Please set the pickup location on the map';
            if (!firstErrorRef) firstErrorRef = pickupLocationRef;
        }

        if (autoImages.length === 0) {
            newErrors.images = 'Please add at least one auto image';
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

    /**
     * Submit auto listing
     */
    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const autoData = {
                userId: user?.userId,
                AutoNumber: autoNumber.trim(),
                description: description.trim(),
                pricePerKm: parseFloat(pricePerKm),
                contactNumber: contactNumber.trim(),
                contactName: contactName.trim(),
                latitude: parseFloat(pickupLatitude),
                longitude: parseFloat(pickupLongitude),
                autoImages: autoImages,
            };


            const response = await createAuto(autoData);

            if (response && response.success) {
                setShowSuccessPopup(true);
            } else {
                Alert.alert('Error', response?.message || 'Failed to list auto');
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to list your auto');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccessPopup(false);
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleGoBack}
                title="List Your Auto"
                useGradient={false}
                showIconBackground={true}
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Auto Details */}
                <Text style={styles.sectionTitle}>Auto Details</Text>

                <View ref={autoNumberRef}>
                    <FormInput
                        label="Auto Number"
                        value={autoNumber}
                        onChangeText={handleFieldChange(setAutoNumber, 'autoNumber')}
                        placeholder="e.g., AP 09 AB 1234"
                        autoCapitalize="characters"
                        error={!!errors.autoNumber}
                        errorMessage={errors.autoNumber}
                        required
                    />
                </View>

                <View ref={descriptionRef}>
                    <FormInput
                        label="Description"
                        value={description}
                        onChangeText={handleFieldChange(setDescription, 'description')}
                        placeholder="Describe auto condition and features"
                        multiline
                        numberOfLines={4}
                        style={styles.textArea}
                        error={!!errors.description}
                        errorMessage={errors.description}
                        required
                    />
                </View>

                {/* Pricing */}
                <Text style={styles.sectionTitle}>Price</Text>

                <View ref={pricePerKmRef}>
                    <FormInput
                        label="Price Per Km"
                        value={pricePerKm}
                        onChangeText={handleFieldChange(setPricePerKm, 'pricePerKm')}
                        placeholder="₹ 15"
                        keyboardType="decimal-pad"
                        error={!!errors.pricePerKm}
                        errorMessage={errors.pricePerKm}
                        required
                    />
                </View>

                {/* Contact Information */}
                <Text style={styles.sectionTitle}>Contact Information</Text>

                <View ref={contactNameRef}>
                    <FormInput
                        label="Contact Name"
                        value={contactName}
                        onChangeText={handleFieldChange(setContactName, 'contactName')}
                        placeholder="Your Name"
                        error={!!errors.contactName}
                        errorMessage={errors.contactName}
                        required
                    />
                </View>

                <View ref={contactNumberRef}>
                    <FormInput
                        label="Contact Number"
                        value={contactNumber}
                        onChangeText={handleFieldChange(setContactNumber, 'contactNumber')}
                        placeholder="10-digit mobile number"
                        keyboardType="phone-pad"
                        maxLength={10}
                        error={!!errors.contactNumber}
                        errorMessage={errors.contactNumber}
                        required
                    />
                </View>

                {/* Pickup Location */}
                <Text style={styles.sectionTitle}>Auto Pickup Location</Text>
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

                {/* Auto Images */}
                <Text style={styles.sectionTitle}>Auto Photos</Text>
                <Text style={styles.sectionSubtitle}>Add up to 5 photos of your auto</Text>
                {errors.images ? <Text style={styles.errorText}>{errors.images}</Text> : null}

                <View ref={imagesRef} style={styles.imagesContainer}>
                    {autoImages.map((image, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image source={{ uri: image.uri }} style={styles.autoImage} />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => removeImage(index)}
                            >
                                <Icon name="close" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {autoImages.length < 5 && (
                        <TouchableOpacity style={styles.addImageButton} onPress={pickImages}>
                            <Icon name="add-a-photo" size={32} color={Colors.primary} />
                            <Text style={styles.addImageText}>Add Photo</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Submit Button */}
                <Button
                    title={loading ? 'Submitting...' : 'List Your Auto'}
                    onPress={handleSubmit}
                    disabled={loading}
                    style={styles.submitButton}
                />

                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingText}>Creating your listing...</Text>
                    </View>
                )}
            </ScrollView>

            {/* Success Popup */}
            {showSuccessPopup && (
                <BookingSuccessPopup
                    visible={showSuccessPopup}
                    onClose={handleSuccessClose}
                    title="Success"
                    message="Auto listed successfully!"
                />
            )}
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
        paddingHorizontal: Spacing.md,
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        fontFamily: Typography.fontFamily.bold,
        color: Colors.black,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    sectionSubtitle: {
        fontSize: normalize(14),
        color: Colors.gray,
        marginBottom: Spacing.sm,
    },
    errorText: {
        color: '#FF0000',
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: Spacing.sm,
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: Spacing.md,
    },
    imageWrapper: {
        width: normalize(100),
        height: normalize(100),
        marginRight: Spacing.sm,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        position: 'relative',
    },
    autoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 5,
        right: 5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addImageButton: {
        width: normalize(100),
        height: normalize(100),
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.lightGray,
    },
    addImageText: {
        fontSize: normalize(12),
        color: Colors.primary,
        marginTop: Spacing.xs,
        fontWeight: '600',
    },
    submitButton: {
        marginVertical: Spacing.xl,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    loadingText: {
        marginLeft: Spacing.sm,
        color: Colors.gray,
        fontSize: normalize(14),
    },
});

export default ListYourAutoScreen;
