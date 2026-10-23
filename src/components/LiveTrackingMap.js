import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import SocketService from '../services/SocketService';
import { fetchData } from '../config/apiConfig';
import { Colors } from '../constants/Colors';

/**
 * Renders the other party's live-moving location for a confirmed booking.
 * Mirrors the backend's joinBooking/updateLocation/locationUpdate socket flow.
 */
const LiveTrackingMap = ({ bookingId, markerLabel = 'Owner' }) => {
  const mapRef = useRef(null);
  const [point, setPoint] = useState(null);
  const [path, setPath] = useState([]);

  useEffect(() => {
    if (!bookingId) return undefined;

    let isMounted = true;

    SocketService.joinBookingTracking(bookingId);

    SocketService.onLocationUpdate((update) => {
      if (!isMounted) return;
      const next = { latitude: update.latitude, longitude: update.longitude };
      setPoint(next);
      setPath((prev) => [...prev, next].slice(-200));
      mapRef.current?.animateToRegion(
        { ...next, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        500
      );
    });

    // Seed with the last known point so the map isn't empty before the first live ping
    (async () => {
      try {
        const data = await fetchData(`/getLatestLocation/${bookingId}`);
        if (isMounted && data?.point) {
          setPoint({ latitude: data.point.latitude, longitude: data.point.longitude });
        }
      } catch (error) {
        // No prior location yet — fine, wait for the first live update
      }
    })();

    return () => {
      isMounted = false;
      SocketService.removeListener('locationUpdate');
    };
  }, [bookingId]);

  if (!point) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.emptyText}>Waiting for {markerLabel.toLowerCase()}'s location...</Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{ ...point, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
    >
      {path.length > 1 && (
        <Polyline coordinates={path} strokeColor={Colors.primary} strokeWidth={4} />
      )}
      <Marker coordinate={point} title={markerLabel} />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 300,
  },
  emptyState: {
    flex: 1,
    minHeight: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    marginTop: 8,
    color: Colors.text?.secondary || '#666',
    fontSize: 13,
  },
});

export default LiveTrackingMap;
