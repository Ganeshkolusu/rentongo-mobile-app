import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { hp, normalize, responsiveValue, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const AboutUsScreen = ({ navigation }) => {
    const features = [
        {
            id: 1,
            icon: 'car-sport',
            color: '#2196F3',
            bgColor: '#E3F2FD',
            title: 'Wide Selection',
            description: 'Choose from a diverse fleet of luxury vehicles and scooters for every need.',
        },
        {
            id: 2,
            icon: 'people',
            color: '#4CAF50',
            bgColor: '#E8F5E9',
            title: 'Community Driven',
            description: 'Connect with trusted vehicle owners who share in your community.',
        },
        {
            id: 3,
            icon: 'shield-checkmark',
            color: '#9C27B0',
            bgColor: '#F3E5F5',
            title: 'Verified Quality',
            description: 'All vehicles verified and rated by our community.',
        },
        {
            id: 4,
            icon: 'time',
            color: '#FF9800',
            bgColor: '#FFF3E0',
            title: '24/7 Service',
            description: 'Book anytime, anywhere with instant confirmation.',
        },
    ];

    const whyChooseUs = [
        'Transparent Pricing: No hidden fees, see exact costs upfront',
        'Secure Payments: Protected transactions with multiple payment options',
        'Customer Support: Dedicated support team available 24/7',
        'Flexible Bookings: Hourly, daily, or long-term rentals available',
    ];

    return (
        <View style={styles.container}>
            {/* ✅ Keep top gradient header */}
            <Header
                title="About Us"
                onBackPress={() => navigation.goBack()}
                showMoreButton={false}
                useGradient={true}
                gradientColors={Colors.gradient.primary}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ✅ Hero Section with your app gradient */}
                <LinearGradient
                    colors={Colors.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroSection}
                >
                    <Text style={styles.heroTitle}>RentOnGo Vehicle</Text>
                    <Text style={styles.heroSubtitle}>
                        Your trusted partner for vehicle rentals - connecting vehicle owners with riders since 2024.
                    </Text>
                </LinearGradient>

                {/* Mission Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Mission</Text>
                    <Text style={styles.sectionText}>
                        At RentOnGo Vehicle, we're revolutionizing the way people access transportation. Our mission is to make
                        vehicle rentals simple, affordable, and accessible to everyone while empowering vehicle owners to earn from
                        their unused assets.
                    </Text>
                </View>

                {/* ✅ Features Grid (2 per row) */}
                <View style={styles.featuresContainer}>
                    {features.map((feature) => (
                        <View key={feature.id} style={styles.featureCardWrapper}>
                            <View style={styles.featureCard}>
                                <View style={[styles.featureIconContainer, { backgroundColor: feature.bgColor }]}>
                                    <Ionicons name={feature.icon} size={28} color={feature.color} />
                                </View>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Story Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Our Story</Text>
                    <Text style={styles.sectionText}>
                        Founded in 2024, RentOnGo Vehicle was born from a simple observation: many vehicle owners have cars and
                        bikes sitting idle while countless people need affordable transportation. We created a platform that bridges
                        this gap, turning unused vehicles into income opportunities.
                    </Text>
                    <Text style={[styles.sectionText, styles.marginTop]}>
                        Today, we're proud to serve thousands of users across multiple cities, facilitating thousands of rides every
                        month. Our platform has helped vehicle owners earn extra income while providing riders with convenient,
                        cost-effective transportation options.
                    </Text>
                </View>

                {/* Why Choose Us Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Why Choose Us?</Text>
                    {whyChooseUs.map((item, index) => (
                        <View key={index} style={styles.whyChooseItem}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            <Text style={styles.whyChooseText}>{item}</Text>
                        </View>
                    ))}
                </View>

                {/* Get in Touch Section */}
                <View style={styles.contactSection}>
                    <Text style={styles.contactTitle}>Get in Touch</Text>
                    <Text style={styles.contactSubtitle}>Have questions or feedback? We'd love to hear from you!</Text>

                      <View style={styles.contactItem}>
                        <Ionicons name="mail" size={20} color="#2196F3" />
                        <Text style={styles.contactText}>Email: support@rentongovehicle.com</Text>
                    </View> 

                    {/* <View style={styles.contactItem}>
                        <Ionicons name="call" size={20} color="#4CAF50" />
                        <Text style={styles.contactText}>Phone: +91 8125081999 </Text>
                    </View> 

                    <View style={styles.contactItem}>
                        <Ionicons name="location" size={20} color="#FF9800" />
                        <Text style={styles.contactText}>Address: Hyderabad, Andhra Pradesh, India</Text>
                    </View> */}
                </View>

                <View style={styles.bottomSpacing} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background || '#F5F5F5',
    },
    content: {
        flex: 1,
    },
    heroSection: {
        marginHorizontal: responsiveValue(Spacing.md, Spacing.lg, Spacing.xl),
        marginTop: Spacing.lg,
        borderRadius: normalize(16),
        padding: Spacing.xl,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    heroTitle: {
        fontSize: normalize(24),
        fontWeight: '700',
        color: Colors.white,
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    heroSubtitle: {
        fontSize: normalize(14),
        color: Colors.white,
        fontFamily: Typography.fontFamily.regular,
        textAlign: 'center',
        lineHeight: normalize(22),
        opacity: 0.95,
    },
    section: {
        backgroundColor: Colors.white,
        marginHorizontal: responsiveValue(Spacing.md, Spacing.lg, Spacing.xl),
        marginTop: Spacing.lg,
        borderRadius: normalize(12),
        padding: Spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    sectionTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Colors.textPrimary || '#000',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.md,
    },
    sectionText: {
        fontSize: normalize(14),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        lineHeight: normalize(22),
    },
    marginTop: {
        marginTop: Spacing.md,
    },

    // ✅ 2 features per row
    featuresContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
    },
    featureCardWrapper: {
        width: '48%',
        marginBottom: Spacing.md,
    },
    featureCard: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.md,
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    featureIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    featureTitle: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Colors.textPrimary || '#333',
        fontFamily: Typography.fontFamily.medium,
        marginBottom: Spacing.xs,
        textAlign: 'center',
    },
    featureDescription: {
        fontSize: normalize(12),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        textAlign: 'center',
        lineHeight: normalize(18),
    },
    whyChooseItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    whyChooseText: {
        flex: 1,
        fontSize: normalize(14),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        marginLeft: Spacing.sm,
        lineHeight: normalize(22),
    },
    contactSection: {
        backgroundColor: Colors.white,
        marginHorizontal: responsiveValue(Spacing.md, Spacing.lg, Spacing.xl),
        marginTop: Spacing.lg,
        borderRadius: normalize(12),
        padding: Spacing.lg,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    contactTitle: {
        fontSize: normalize(18),
        fontWeight: '700',
        color: Colors.textPrimary || '#000',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.xs,
    },
    contactSubtitle: {
        fontSize: normalize(14),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        marginBottom: Spacing.lg,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    contactText: {
        fontSize: normalize(14),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        marginLeft: Spacing.sm,
        flex: 1,
    },
    bottomSpacing: {
        height: responsiveValue(hp(8), hp(10), hp(12)),
    },
});

export default AboutUsScreen;