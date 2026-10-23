import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { hp, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const PrivacyPolicyScreen = ({ navigation }) => {
    const handleBackPress = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <Header title="Privacy Policy" onBackPress={handleBackPress} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.mainTitle}>Privacy Policy</Text>

                {/* Section 1: Introduction */}
                <Text style={styles.sectionTitle}>1. Introduction</Text>
                <Text style={styles.paragraph}>
                    This Privacy Policy explains how we collect, use, and protect your personal information when using the RentOnGoVehicle platform (mobile apps and web applications). By accessing or booking through our services, you agree to the practices described in this policy.
                </Text>

                {/* Section 2: Agreement Overview */}
                <Text style={styles.sectionTitle}>2. Agreement Overview</Text>
                <Text style={styles.paragraph}>
                    This Privacy Policy outlines our approach to handling your data by Manyam Consultancy & Technology Services Pvt Ltd.
                </Text>

                {/* Section 3: Modification of Terms */}
                <Text style={styles.sectionTitle}>3. Modification of Terms</Text>
                <Text style={styles.paragraph}>
                    We may update this Privacy Policy from time to time. Continued use of our platform constitutes acceptance of the updated terms. Users are encouraged to review this Privacy Policy periodically for changes.
                </Text>

                {/* Section 4: Information We Collect */}
                <Text style={styles.sectionTitle}>4. Information We Collect</Text>
                <Text style={styles.paragraph}>
                    We may collect the following information from users:
                </Text>
                <Text style={styles.bulletPoint}>• Personal Details: Name, contact number, email, address.</Text>
                <Text style={styles.bulletPoint}>• Identification: Government-issued ID and driver's license information.</Text>
                <Text style={styles.bulletPoint}>• Payment Details: Payment information processed securely by the vehicle owner or payment gateway.</Text>
                <Text style={styles.bulletPoint}>• Rental Information: Rental history, booking preferences, and communication with vehicle owners.</Text>
                <Text style={styles.bulletPoint}>• Device & Usage Data: IP address, device information, browser type, app usage, and cookies for analytics and service improvements.</Text>

                {/* Section 5: How We Use Your Information */}
                <Text style={styles.sectionTitle}>5. How We Use Your Information</Text>
                <Text style={styles.paragraph}>
                    We use your information to:
                </Text>
                <Text style={styles.bulletPoint}>• Process and confirm bookings.</Text>
                <Text style={styles.bulletPoint}>• Verify identity and eligibility to rent vehicles.</Text>
                <Text style={styles.bulletPoint}>• Improve customer service and user experience on our platform.</Text>
                <Text style={styles.bulletPoint}>• Communicate updates, offers, and relevant notifications.</Text>
                <Text style={styles.bulletPoint}>• Comply with legal, regulatory, and safety requirements.</Text>
                <Text style={styles.bulletPoint}>• Detect and prevent fraudulent or unauthorized activity.</Text>

                {/* Section 6: Sharing of Information */}
                <Text style={styles.sectionTitle}>6. Sharing of Information</Text>
                <Text style={styles.paragraph}>
                    We respect your privacy and do not sell your personal information. However, we may share information with trusted third parties when necessary, including:
                </Text>
                <Text style={styles.bulletPoint}>• Payment processors (handled by vehicle owners or third-party gateways).</Text>
                <Text style={styles.bulletPoint}>• Insurance companies.</Text>
                <Text style={styles.bulletPoint}>• Law enforcement or legal authorities if required by law.</Text>
                <Text style={styles.bulletPoint}>• Technical support or service providers to improve platform performance.</Text>

                {/* Section 7: Data Security */}
                <Text style={styles.sectionTitle}>7. Data Security</Text>
                <Text style={styles.paragraph}>
                    We implement industry-standard measures to protect your data against unauthorized access, misuse, or disclosure. While we strive to secure your data, no method of electronic storage or transmission is completely secure, and we cannot guarantee absolute security.
                </Text>

                {/* Section 8: Cookies & Tracking */}
                <Text style={styles.sectionTitle}>8. Cookies & Tracking</Text>
                <Text style={styles.paragraph}>
                    Our platform may use cookies and similar technologies to enhance your browsing experience, track analytics, and provide personalized offers. You may disable cookies in your browser or device settings; however, this may affect platform functionality.
                </Text>

                {/* Section 9: Your Rights */}
                <Text style={styles.sectionTitle}>9. Your Rights</Text>
                <Text style={styles.paragraph}>
                    As a user, you have the right to:
                </Text>
                <Text style={styles.bulletPoint}>• Access and update your personal information.</Text>
                <Text style={styles.bulletPoint}>• Request the deletion of your data where applicable.</Text>
                <Text style={styles.bulletPoint}>• Opt-out of marketing communications.</Text>
                <Text style={styles.bulletPoint}>• Withdraw consent for data processing where legally permissible.</Text>

                {/* Section 10: Retention of Data */}
                <Text style={styles.sectionTitle}>10. Retention of Data</Text>
                <Text style={styles.paragraph}>
                    We retain personal information only as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements.
                </Text>

                {/* Section 11: International Transfers */}
                <Text style={styles.sectionTitle}>11. International Transfers</Text>
                <Text style={styles.paragraph}>
                    If you access our platform from outside India, your data may be transferred to and processed in India in accordance with applicable laws. By using our services, you consent to such transfers.
                </Text>

                {/* Section 12: Contact Us */}
                <Text style={styles.sectionTitle}>12. Contact Us</Text>
                <Text style={styles.paragraph}>
                    If you have any questions about this Privacy Policy, please contact us at:
                </Text>
                <Text style={styles.contactInfo}>
                    Manyam Consultancy & Technology Services Pvt Ltd{'\n'}
                    Email: support@rentongovehicle.com
                </Text>

                <Text style={styles.lastUpdated}>
                    Last Updated: 2025
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: hp(5),
    },
    mainTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    paragraph: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        lineHeight: normalize(22),
        marginBottom: Spacing.md,
        textAlign: 'justify',
    },
    bulletPoint: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        lineHeight: normalize(22),
        marginBottom: Spacing.xs,
        marginLeft: Spacing.sm,
        paddingLeft: Spacing.xs,
    },
    contactInfo: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        lineHeight: normalize(24),
        marginTop: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    lastUpdated: {
        fontSize: Typography.fontSize.sm,
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.secondary,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: Spacing.xl,
        paddingTop: Spacing.lg,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});

export default PrivacyPolicyScreen;