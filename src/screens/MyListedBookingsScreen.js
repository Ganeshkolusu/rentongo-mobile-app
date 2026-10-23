import { useFocusEffect } from "@react-navigation/native";
import React, { useState, useRef } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors } from "../constants/Colors";
import { useAuth } from "../context/AuthContext";
import { useDataCache } from "../context/DataCacheContext";

const MyListedBookingsScreen = ({ route }) => {
  const { userId } = useAuth();
  const { myVehicles, fetchMyVehicles, loadingStates, initialLoadDone } = useDataCache();

  const [vehicles, setVehicles] = useState(myVehicles || []);
  const [loading, setLoading] = useState(!initialLoadDone.myVehicles);
  const [refreshing, setRefreshing] = useState(false);
  const initialFetchDone = useRef(initialLoadDone.myVehicles);

  const fetchListedVehicles = async (forceRefresh = false) => {
    if (!userId) return;

    try {
      const data = await fetchMyVehicles(userId, forceRefresh);
      if (Array.isArray(data)) {
        setVehicles(data);
      } else {
        setVehicles([]);
      }
    } catch (error) {
      // Silent catch
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // If we already have cached data, show it immediately
      if (myVehicles && myVehicles.length > 0) {
        setVehicles(myVehicles);
        setLoading(false);

        // Background refresh only if not done recently
        if (!initialFetchDone.current) {
          initialFetchDone.current = true;
          fetchListedVehicles(false);
        }
      } else if (!initialFetchDone.current) {
        // No cached data, fetch from API
        initialFetchDone.current = true;
        fetchListedVehicles(false);
      }
    }, [myVehicles])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListedVehicles(true); // Force refresh
  };

  if (loading && vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (vehicles.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.noData}>No vehicles listed yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[Colors.primary]}
        />
      }
    >
      {vehicles.map((vehicle, index) => (
        <View key={vehicle._id || index} style={styles.card}>
          <Image
            source={{ uri: vehicle.carImages?.[0] || vehicle.bikeImages?.[0] || "https://via.placeholder.com/150" }}
            style={styles.image}
          />
          <View style={styles.info}>
            <Text style={styles.title}>{vehicle.CarName || vehicle.bikeName} {vehicle.CarModel || vehicle.bikeModel}</Text>
            <Text style={styles.subtitle}>₹{vehicle.RentPerDay || vehicle.pricePerKm}/day</Text>
            <Text style={styles.details}>
              {vehicle.fuelType} | {vehicle.transmissionType}
            </Text>
            <Text style={styles.area}>📍 {vehicle.pickupArea || vehicle.pickupCity}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noData: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  image: {
    width: 100,
    height: 80,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  info: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 4,
  },
  details: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  area: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
  },
});

export default MyListedBookingsScreen;
