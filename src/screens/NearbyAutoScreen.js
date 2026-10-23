import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Dimensions';
import Header from '../components/Header/Header';
import NavBar from '../navigations/NavBar';
import AutoCard from '../components/Rental/AutoCard';
import { getSafeImageSource } from '../config/apiConfig';
import { getNearbyAutos } from '../api/autoApi';

const NearbyAutoScreen = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState("Rental");
    const [autosData, setAutosData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Default location (Hyderabad)
    const latitude = 17.4417;
    const longitude = 78.4416;

    /**
     * Fetch nearby autos from API
     */
    const fetchNearbyAutos = async (isRefreshing = false) => {
        try {
            if (!isRefreshing) {
                setLoading(true);
            }
            setError(null);

            const data = await getNearbyAutos({
                latitude,
                longitude,
            });

            if (data.success && Array.isArray(data.autos)) {
                setAutosData(data.autos);
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (err) {
            setError(err.message || 'Failed to load nearby autos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    /**
     * Handle pull-to-refresh
     */
    const onRefresh = () => {
        setRefreshing(true);
        fetchNearbyAutos(true);
    };

    useEffect(() => {
        fetchNearbyAutos();
    }, []);

    /**
     * Navigation handlers
     */
    const handleAutoPress = (auto) => {
       navigation.navigate('AutoDetailsScreen', { autoId: auto._id });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleTabPress = (tabKey) => {
        navigation.navigate('DashBoard', { activeTab: tabKey });
    };

    /**
     * Render auto item
     */
    const renderAutoCard = (auto, index) => {
        const imageSource = getSafeImageSource(
            auto.autoImages,
            require('../assets/Images/auto.png')
        );

        return (
            <AutoCard
                key={auto._id || `auto-${index}`}
                auto={{
                    id: auto._id,
                    name: auto.AutoNumber || `Auto ${index + 1}`,
                    rating: parseFloat(auto.averageRating) || 0,
                    seats: 3, // Auto-rickshaws typically have 3 seats
                    price: auto.pricePerKm,
                    image: imageSource,
                    location: auto.location || 'Hyderabad',
                }}
                onPress={() => handleAutoPress(auto)}
            />
        );
    };

    /**
     * Render UI
     */
    return (
        <View style={styles.container}>
            <Header
                onBackPress={handleBackPress}
                title="Nearby Autos"
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
            >
                {loading && !refreshing && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator
                            size="large"
                            color={Colors.primary}
                        />
                        <Text style={styles.loadingText}>
                            Loading nearby autos...
                        </Text>
                    </View>
                )}

                {error && !loading && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <Text
                            style={styles.retryText}
                            onPress={() => fetchNearbyAutos()}
                        >
                            Retry
                        </Text>
                    </View>
                )}

                {!loading && !error && autosData.length === 0 && (
                    <View style={styles.centerContainer}>
                        <Text style={styles.noDataText}>
                            No autos found
                        </Text>
                        <Text style={styles.noDataSubtext}>
                            Try adjusting your location
                        </Text>
                    </View>
                )}

                {!loading && !error && autosData.map(renderAutoCard)}
            </ScrollView>

            <NavBar activeTab={activeTab} setActiveTab={handleTabPress} />
        </View>
    );
};

export default NearbyAutoScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
        marginTop: Spacing.lg,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 130,
    },
    centerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 50,
        paddingHorizontal: Spacing.lg,
    },
    loadingText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 12,
    },
    errorText: {
        textAlign: 'center',
        color: Colors.error || '#E53935',
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    retryText: {
        textAlign: 'center',
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        textDecorationLine: 'underline',
    },
    noDataText: {
        textAlign: 'center',
        color: Colors.textPrimary || '#333',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    noDataSubtext: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
});
