import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Icon from 'react-native-vector-icons/Ionicons';
import Header from '../../components/Header/Header';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { useToast } from '../../context/ToastContext';

// Default region - Hyderabad
const DEFAULT_REGION = {
  latitude: 17.3850,
  longitude: 78.4867,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapPickerScreen = ({ navigation, route }) => {
  const { showError, showWarning } = useToast();
  const mapRef = useRef(null);
  const isMountedRef = useRef(true);

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 17.3850,
    longitude: 78.4867,
  });
  const [address, setAddress] = useState('Hyderabad, India');
  const [searchText, setSearchText] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const fetchAddress = async (latitude, longitude) => {
    if (!isMountedRef.current) return;
    try {
      const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (!isMountedRef.current) return;
      if (geocode && geocode.length > 0) {
        const place = geocode[0];
        const parts = [place.name, place.street, place.city].filter(Boolean);
        setAddress(parts.join(', ') || 'Selected Location');
      } else {
        setAddress('Selected Location');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setAddress('Selected Location');
      }
    }
  };

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setSelectedLocation({ latitude, longitude });
    fetchAddress(latitude, longitude);
  };

  const handleMyLocation = async () => {
    try {
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled || !isMountedRef.current) return;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || !isMountedRef.current) return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        maximumAge: 10000,
        timeout: 5000,
      });

      if (!isMountedRef.current) return;

      const { latitude, longitude } = position.coords;

      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }

      setSelectedLocation({ latitude, longitude });
      fetchAddress(latitude, longitude);
    } catch (error) {
      // Keep current location on error
    }
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      showWarning('Please enter a location to search');
      return;
    }

    Keyboard.dismiss();
    setSearchLoading(true);

    try {
      // Add "India" to search query for better results
      const searchQuery = searchText.toLowerCase().includes('india')
        ? searchText
        : `${searchText}, India`;

      const geocodeResults = await Location.geocodeAsync(searchQuery);

      if (geocodeResults && geocodeResults.length > 0) {
        const { latitude, longitude } = geocodeResults[0];

        // Animate map to the searched location
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }, 500);
        }

        // Update selected location and marker
        setSelectedLocation({ latitude, longitude });
        fetchAddress(latitude, longitude);
      } else {
        showWarning('Could not find the location. Please try a different search term.');
      }
    } catch (error) {
      showError('Failed to search location. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSaveLocation = () => {
    const sourceScreen = route.params?.sourceScreen || 'ChangeLocationScreen';
    navigation.navigate(sourceScreen, {
      selectedLocation: {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: address,
      },
    });
  };

  const handleBackPress = () => navigation.goBack();

  return (
    <View style={styles.container}>
      <Header title="Choose Location" onBackPress={handleBackPress} />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={Colors.grey} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location (e.g., Kukatpally, Hyderabad)"
            placeholderTextColor={Colors.grey}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={Colors.grey} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={searchLoading}
        >
          {searchLoading ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Icon name="search" size={20} color={Colors.white} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={DEFAULT_REGION}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
          moveOnMarkerPress={false}
        >
          <Marker
            coordinate={selectedLocation}
            pinColor="#4FC3F7"
          />
        </MapView>

        <TouchableOpacity style={styles.myLocationButton} onPress={handleMyLocation}>
          <Icon name="location" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.locationCard}>
        <View style={styles.cardContent}>
          <Icon name="location" size={24} color="#4FC3F7" />
          <View style={styles.locationInfo}>
            <Text style={styles.selectedLocationTitle}>Selected Location</Text>
            <Text style={styles.selectedLocationAddress}>{address}</Text>
            <Text style={styles.coordinates}>
              {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomContainer}>
        <TouchableOpacity onPress={handleSaveLocation} activeOpacity={0.8}>
          <LinearGradient
            colors={['#4FC3F7', '#1976D2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButton}
          >
            <Text style={styles.saveButtonText}>Save Location</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  searchButton: {
    backgroundColor: '#4FC3F7',
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  myLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4FC3F7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  locationCard: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: 12,
    elevation: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  locationInfo: { flex: 1, marginLeft: Spacing.md },
  selectedLocationTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  selectedLocationAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  coordinates: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  saveButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
});

export default MapPickerScreen;
