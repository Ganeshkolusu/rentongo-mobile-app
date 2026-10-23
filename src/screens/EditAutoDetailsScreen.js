import React, { useState, useEffect, useRef } from 'react';
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
import Button from '../components/Button/Button';
import Header from '../components/Header/Header';
import PickupLocationMap from '../components/PickupLocationMap';
import { getAutoById, updateAuto, deleteAuto } from '../api/autoApi';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
    isPositiveNumber,
    isValidCoordinate,
    isValidMobileNumber,
    isValidPersonName,
} from '../utils/vehicleFormValidation';

const EditAutoDetailsScreen = ({ navigation, route }) => {
    const { autoId } = route.params || {};

    // Loading states
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Auto Details
    const [autoNumber, setAutoNumber] = useState('');
    const [description, setDescription] = useState('');
    const [pricePerKm, setPricePerKm] = useState('');
    const [contactName, setContactName] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [autoImages, setAutoImages] = useState([]);

    // Pickup Location Coordinates (loaded from the saved auto; empty lets the map auto-locate)
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

    // Fetch auto details on mount
    useEffect(() => {
        if (autoId) {
            fetchAutoDetails();
        } else {
            setLoading(false);
        }
    }, [autoId]);

    const fetchAutoDetails = async () => {
        try {
            setLoading(true);
            const response = await getAutoById(autoId);

            if (response && response.auto) {
                const auto = response.auto;

                setAutoNumber(auto.AutoNumber || '');
                setDescription(auto.description || '');
                setPricePerKm(auto.pricePerKm?.toString() || '');
                setContactName(auto.contactName || '');
                setContactNumber(auto.contactNumber || '');
                setSavedPickupLocation(auto);

                if (auto.autoImages && auto.autoImages.length > 0) {
                    const images = auto.autoImages.map((img, index) => ({
                        uri: typeof img === 'string' ? img : img.uri,
                        isExisting: true,
                        type: 'image/jpeg',
                        name: `auto_${index}.jpg`,
                    }));
                    setAutoImages(images);
                }
            } else if (response && response.data) {
                const auto = response.data;

                setAutoNumber(auto.AutoNumber || '');
                setDescription(auto.description || '');
                setPricePerKm(auto.pricePerKm?.toString() || '');
                setContactName(auto.contactName || '');
                setContactNumber(auto.contactNumber || '');
                setSavedPickupLocation(auto);

                if (auto.autoImages && auto.autoImages.length > 0) {
                    const images = auto.autoImages.map((img, index) => ({
                        uri: typeof img === 'string' ? img : img.uri,
                        isExisting: true,
                        type: 'image/jpeg',
                        name: `auto_${index}.jpg`,
                    }));
                    setAutoImages(images);
                }
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to load auto details');
        } finally {
            setLoading(false);
        }
    };

    /**
     * Load the saved pickup pin (left empty if missing so the map auto-locates)
     */
    const setSavedPickupLocation = (auto) => {
        if (isValidCoordinate(auto.latitude, auto.longitude)) {
            setPickupLatitude(String(auto.latitude));
            setPickupLongitude(String(auto.longitude));
        }
    };

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

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleDeletePress = () => {
        Alert.alert(
            'Delete Auto',
            'Are you sure you want to delete this auto?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (!autoId) {
                                return;
                            }

                            const response = await deleteAuto(autoId);

                            if (response?.message?.includes('deleted') || response?.success) {
                                Alert.alert('Success', 'Auto deleted successfully', [
                                    {
                                        text: 'OK',
                                        onPress: () => navigation.goBack(),
                                    },
                                ]);
                            } else {
                                Alert.alert('Error', 'Failed to delete auto');
                            }
                        } catch (error) {

                            Alert.alert('Error', 'Failed to delete auto');
                        }
                    },
                },
            ]
        );
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
                    Alert.alert('Permission Denied', 'Photo library permission is required');
                    return;
                }
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: 5 - autoImages.length,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map((asset, index) => ({
                    uri: asset.uri,
                    type: asset.type || 'image/jpeg',
                    name: asset.fileName || `auto_${Date.now()}_${index}.jpg`,
                    isExisting: false,
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
     * Validate form; scrolls to the first invalid field
     */
    const validateForm = () => {
        const newErrors = {};
        let firstErrorRef = null;

        if (!autoNumber.trim()) {
            newErrors.autoNumber = 'Please enter auto number';
            if (!firstErrorRef) firstErrorRef = autoNumberRef;
        }

        if (!description.trim()) {
            newErrors.description = 'Please enter description';
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
     * Handle Save
     */
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setUpdating(true);

            // Prepare update data
            const updateData = {
                AutoNumber: autoNumber.trim(),
                description: description.trim(),
                pricePerKm: parseFloat(pricePerKm),
                contactNumber: contactNumber.trim(),
                contactName: contactName.trim(),
                latitude: pickupLatitude,
                longitude: pickupLongitude,
            };

            // Add new images (not existing ones)
            const newImages = autoImages.filter(img => !img.isExisting);
            if (newImages.length > 0) {
                updateData.autoImages = newImages;
            }


            const response = await updateAuto(autoId, updateData);

            if (response?.success || response?.message?.includes('updated')) {
                Alert.alert('Success', 'Auto details updated successfully', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            } else {
                Alert.alert('Error', response?.message || 'Failed to update auto details');
            }
        } catch (error) {

            Alert.alert('Error', 'Failed to update auto details');
        } finally {
            setUpdating(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <View style={styles.container}>
                <Header
                    onBackPress={handleBackPress}
                    title="Edit Auto"
                    useGradient={false}
                    showIconBackground={true}
                />
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading auto details...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleBackPress}
                title="Edit Auto"
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
                        placeholder="Describe the auto condition"
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
                <Text style={styles.sectionTitle}>Contact Info</Text>

                <View ref={contactNameRef}>
                    <FormInput
                        label="Contact Name"
                        value={contactName}
                        onChangeText={handleFieldChange(setContactName, 'contactName')}
                        placeholder="Your name"
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
                <Text style={styles.sectionSubtitle}>Add up to 5 photos</Text>
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

                {/* Action Buttons */}
                <View style={styles.buttonGroup}>
                    <Button
                        title={updating ? 'Saving...' : 'Save Changes'}
                        onPress={handleSave}
                        disabled={updating}
                        style={styles.saveButton}
                    />

                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={handleDeletePress}
                        disabled={updating}
                    >
                        <Text style={styles.deleteButtonText}>Delete Auto</Text>
                    </TouchableOpacity>
                </View>

                {updating && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={Colors.primary} />
                        <Text style={styles.loadingText}>Updating your auto...</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    buttonGroup: {
        marginVertical: Spacing.xl,
    },
    saveButton: {
        marginBottom: Spacing.md,
    },
    deleteButton: {
        backgroundColor: Colors.white,
        borderWidth: 2,
        borderColor: Colors.error || '#E53935',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    deleteButtonText: {
        color: Colors.error || '#E53935',
        fontSize: normalize(16),
        fontWeight: 'bold',
        fontFamily: Typography.fontFamily.bold,
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

export default EditAutoDetailsScreen;
