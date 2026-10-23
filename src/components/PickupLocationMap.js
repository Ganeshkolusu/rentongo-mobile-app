import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { BorderRadius, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

// Whole-India view, used only until the owner's location is known.
const INDIA_REGION = {
    latitude: 21.0,
    longitude: 78.0,
    latitudeDelta: 20,
    longitudeDelta: 20,
};
const PIN_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

/**
 * Turn an expo-location reverse-geocode result into the form's address fields.
 */
const toAddress = (place) => {
    if (!place) return {};
    return {
        state: place.region || '',
        city: place.city || place.subregion || '',
        pincode: place.postalCode || '',
        street: place.street || place.name || '',
        area: place.district || place.subregion || place.name || '',
        formatted: [place.name, place.street, place.district, place.city, place.region, place.postalCode]
            .filter(Boolean)
            .filter((part, i, all) => all.indexOf(part) === i)
            .join(', '),
    };
};

/**
 * Inline map for choosing a vehicle's pickup point.
 *
 * Starts at the owner's current location (when `value` is empty and permission
 * is granted). The owner can tap the map, drag the pin, or search a place.
 * Every change calls `onChange({ latitude, longitude, address })`, where
 * `address` is `{ state, city, pincode, street, area, formatted }` from reverse
 * geocoding (fields may be empty strings if the lookup fails).
 *
 * @param {{latitude:number, longitude:number}|null} value - current pin, or null
 */
const PickupLocationMap = ({
    value,
    onChange,
    label = 'Pickup Location',
    required = false,
    error = false,
    errorMessage = '',
    autoLocate = true,
}) => {
    const mapRef = useRef(null);
    const isMountedRef = useRef(true);
    const [locating, setLocating] = useState(false);
    const [resolving, setResolving] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searching, setSearching] = useState(false);
    const [formatted, setFormatted] = useState('');
    const [hint, setHint] = useState('');

    const hasPin = !!value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude);

    useEffect(() => () => { isMountedRef.current = false; }, []);

    const moveCamera = (latitude, longitude) => {
        mapRef.current?.animateToRegion({ latitude, longitude, ...PIN_DELTA }, 500);
    };

    const placePin = async (latitude, longitude) => {
        setHint('');
        setResolving(true);
        let address = {};
        try {
            const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            address = toAddress(geocode?.[0]);
        } catch (e) {
            // Keep the pin even if the address lookup fails; fields stay editable.
        }
        if (!isMountedRef.current) return;
        setResolving(false);
        setFormatted(address.formatted || '');
        onChange?.({ latitude, longitude, address });
    };

    const locateMe = async () => {
        setLocating(true);
        try {
            if (!(await Location.hasServicesEnabledAsync())) {
                setHint('Turn on location services, or tap the map to set the pickup point.');
                return;
            }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setHint('Location permission denied. Tap the map to set the pickup point.');
                return;
            }
            const position = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            if (!isMountedRef.current) return;
            const { latitude, longitude } = position.coords;
            moveCamera(latitude, longitude);
            await placePin(latitude, longitude);
        } catch (e) {
            if (isMountedRef.current) {
                setHint('Could not get your location. Tap the map to set the pickup point.');
            }
        } finally {
            if (isMountedRef.current) setLocating(false);
        }
    };

    useEffect(() => {
        if (hasPin) {
            moveCamera(value.latitude, value.longitude);
        } else if (autoLocate) {
            locateMe();
        }
        // Only on mount: later pin changes come from this component itself.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSearch = async () => {
        const query = searchText.trim();
        if (!query) return;
        Keyboard.dismiss();
        setSearching(true);
        try {
            const results = await Location.geocodeAsync(
                query.toLowerCase().includes('india') ? query : `${query}, India`
            );
            if (!isMountedRef.current) return;
            if (results?.length) {
                const { latitude, longitude } = results[0];
                moveCamera(latitude, longitude);
                await placePin(latitude, longitude);
            } else {
                setHint('Place not found. Try a different name, or tap the map.');
            }
        } catch (e) {
            if (isMountedRef.current) setHint('Search failed. Please try again.');
        } finally {
            if (isMountedRef.current) setSearching(false);
        }
    };

    const onMapPress = (e) => {
        const { latitude, longitude } = e.nativeEvent.coordinate;
        placePin(latitude, longitude);
    };

    return (
        <View style={styles.container}>
            {label ? (
                <Text style={styles.label}>
                    {label}
                    {required && <Text style={styles.requiredAsterisk}> *</Text>}
                </Text>
            ) : null}

            <View style={styles.searchRow}>
                <TextInput
                    style={styles.searchInput}
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    placeholder="Search area or landmark"
                    placeholderTextColor={Colors.text.light}
                />
                <TouchableOpacity style={styles.iconButton} onPress={handleSearch} disabled={searching}>
                    {searching
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Icon name="search" size={20} color={Colors.white} />}
                </TouchableOpacity>
            </View>

            <View style={[styles.mapWrapper, error && !hasPin && styles.mapWrapperError]}>
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={hasPin ? { ...value, ...PIN_DELTA } : INDIA_REGION}
                    onPress={onMapPress}
                    showsUserLocation
                    showsMyLocationButton={false}
                    toolbarEnabled={false}
                >
                    {hasPin && (
                        <Marker
                            coordinate={{ latitude: value.latitude, longitude: value.longitude }}
                            draggable
                            onDragEnd={onMapPress}
                            pinColor="#1976D2"
                        />
                    )}
                </MapView>

                <TouchableOpacity style={styles.locateButton} onPress={locateMe} disabled={locating}>
                    {locating
                        ? <ActivityIndicator size="small" color={Colors.white} />
                        : <Icon name="locate" size={22} color={Colors.white} />}
                </TouchableOpacity>
            </View>

            <View style={styles.statusRow}>
                <Icon name="location" size={16} color={hasPin ? '#1976D2' : Colors.grey} />
                <Text style={styles.statusText} numberOfLines={2}>
                    {resolving
                        ? 'Finding address…'
                        : hasPin
                            ? (formatted || `${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`)
                            : 'Tap the map or drag the pin to set where renters pick up the vehicle.'}
                </Text>
            </View>
            {hint ? <Text style={styles.hintText}>{hint}</Text> : null}
            {error && errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.md,
        lineHeight: Typography.lineHeight.md,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    requiredAsterisk: {
        color: '#FF0000',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        borderWidth: normalize(1),
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        backgroundColor: Colors.white,
        fontFamily: Typography.fontFamily.regular,
    },
    iconButton: {
        width: normalize(44),
        height: normalize(44),
        borderRadius: BorderRadius.md,
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapWrapper: {
        height: normalize(240),
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        borderWidth: normalize(1),
        borderColor: Colors.border,
    },
    mapWrapperError: {
        borderColor: '#FF0000',
        borderWidth: normalize(2),
    },
    map: {
        flex: 1,
    },
    locateButton: {
        position: 'absolute',
        right: Spacing.sm,
        bottom: Spacing.sm,
        width: normalize(44),
        height: normalize(44),
        borderRadius: normalize(22),
        backgroundColor: '#1976D2',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    statusText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    hintText: {
        fontSize: Typography.fontSize.sm,
        color: '#E65100',
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.regular,
    },
    errorMessage: {
        color: '#FF0000',
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.regular,
    },
});

export default PickupLocationMap;
