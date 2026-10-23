import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { hp, normalize, responsiveValue, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const HelpScreen = ({ navigation }) => {
    const [expandedIndex, setExpandedIndex] = useState(null);

    const contactOptions = [
       
        {
            id: 1,
            title: 'Email Us',
            subtitle: 'support@rentongovehicle.com',
            icon: 'mail',
            color: '#2196F3',
            bgColor: '#E3F2FD',
            action: () => handleEmail(),
        },
        {
            id: 2,
            title: 'Live Chat',
            subtitle: 'Coming Soon',
            icon: 'chatbubble-ellipses',
            color: '#9C27B0',
            bgColor: '#F3E5F5',
            action: () => Alert.alert('Coming Soon', 'Chat feature will be available soon'),
        },
    ];

    const faqData = [
        {
            question: 'How do I book a vehicle?',
            answer: 'You can book a vehicle by browsing our available options, selecting your preferred vehicle, choosing your rental dates, and completing the booking process.',
        },
        // {
        //     question: 'What documents do I need?',
        //     answer: 'You need a valid driver\'s license, government-issued ID, and a payment method. Additional documents may be required for certain vehicle types.',
        // },
        {
            question: 'Can I cancel my booking?',
           answer: 'Yes, you can cancel your booking anytime before the pickup time. Refund eligibility will follow our cancellation policy.',

        },
        {
            question: 'How do I contact the vehicle owner?',
            answer: 'Once your booking is confirmed, you can contact the owner through our in-app chat or call feature available in the booking details.',
        },
        // {
        //     question: 'What payment methods do you accept?',
        //     answer: 'We accept all major credit/debit cards, UPI, net banking, and digital wallets for secure transactions.',
        // },
        {
            question: 'Is insurance included?',
            answer: 'Basic insurance coverage is included with all rentals. You can opt for additional coverage during the booking process.',
        },
        {
            question: 'What if I return the vehicle late?',
            answer: 'Late returns may incur additional charges as per our policy. Please contact support or the owner if you anticipate being late.',
        },
        {
            question: 'How do I become a vehicle owner?',
            answer: 'You can list your vehicle by going to the "List Your Vehicle" section, providing vehicle details, uploading photos, and completing the verification process.',
        },
        {
            question: 'What are your operating hours?',
            answer: 'Our customer support is available 24/7 to assist you with any queries or concerns.',
        },
        {
            question: 'How do I report an issue?',
            answer: 'You can report issues through the Help & Support section, use the in-app chat, or email us at support@rentongovehicle.com.',
        },
    ];

    const handleCall = (phoneNumber) => {
        const phone = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
        Linking.canOpenURL(phone)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(phone);
                } else {
                    Alert.alert('Error', 'Phone calling is not supported on this device');
                }
            })
            .catch(() => Alert.alert('Error', 'Failed to make call'));
    };

    const handleEmail = async () => {
        const email = 'support@rentongo.com';
        const subject = encodeURIComponent('Support Request');
        const body = encodeURIComponent('Please describe your issue here...');
        const mailUrl = `mailto:${email}?subject=${subject}&body=${body}`;

        try {
            const supported = await Linking.canOpenURL(mailUrl);

            if (supported) {
                await Linking.openURL(mailUrl);
            } else {
                // If mailto is not supported, show alternative options
                Alert.alert(
                    'Contact Support',
                    `Email: ${email}\n\nYou can copy this email address and use your preferred email app.`,
                    [
                        {
                            text: 'Copy Email',
                            onPress: () => {
                                // Try to open email in browser-based email
                                const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
                                Linking.openURL(gmailUrl).catch(() => {
                                    Alert.alert('Info', 'Please manually copy: support@rentongo.com');
                                });
                            }
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel'
                        }
                    ]
                );
            }
        } catch (error) {
            // Silent catch
            Alert.alert(
                'Contact Support',
                `Please send an email to:\n${email}`,
                [
                    {
                        text: 'Open in Browser',
                        onPress: () => {
                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
                            Linking.openURL(gmailUrl).catch(() => {
                                Alert.alert('Error', 'Please manually email: support@rentongo.com');
                            });
                        }
                    },
                    {
                        text: 'OK',
                        style: 'cancel'
                    }
                ]
            );
        }
    };

    const toggleFAQ = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <Header
                title="Help"
                onBackPress={() => navigation.goBack()}
                showMoreButton={false}
                useGradient={true}
                gradientColors={Colors.gradient.primary}
            />

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Contact Options */}
                <View style={styles.contactSection}>
                    {contactOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={styles.contactCard}
                            onPress={option.action}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: option.bgColor }]}>
                                <Ionicons name={option.icon} size={24} color={option.color} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactTitle}>{option.title}</Text>
                                <Text style={styles.contactSubtitle}>{option.subtitle}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
                    
                    {faqData.map((faq, index) => (
                        <View key={index} style={styles.faqCard}>
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleFAQ(index)}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.faqQuestion}>{faq.question}</Text>
                                <Ionicons
                                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={Colors.textSecondary || '#666'}
                                />
                            </TouchableOpacity>
                            
                            {expandedIndex === index && (
                                <View style={styles.faqAnswer}>
                                    <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Still Need Help Section */}
                <View style={styles.needHelpSection}>
                    <Text style={styles.needHelpTitle}>Still Need Help?</Text>
                    <Text style={styles.needHelpText}>
                        Our support team is available 24/7 to assist you with any questions or concerns.
                    </Text>
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
    contactSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: responsiveValue(Spacing.sm, Spacing.md, Spacing.lg),
        paddingVertical: Spacing.lg,
        gap: Spacing.sm,
    },
    contactCard: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
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
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    contactInfo: {
        alignItems: 'center',
    },
    contactTitle: {
        fontSize: normalize(11),
        fontWeight: '600',
        color: Colors.textPrimary || '#333',
        fontFamily: Typography.fontFamily.medium,
        marginBottom: 2,
    },
    contactSubtitle: {
        fontSize: normalize(10),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        textAlign: 'center',
    },
    faqSection: {
        paddingHorizontal: responsiveValue(Spacing.sm, Spacing.md, Spacing.lg),
        paddingTop: Spacing.md,
    },
    sectionTitle: {
        fontSize: responsiveValue(normalize(18), normalize(19), normalize(20)),
        fontWeight: '700',
        color: Colors.textPrimary || '#000',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.md,
    },
    faqCard: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        marginBottom: Spacing.sm,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
    },
    faqQuestion: {
        flex: 1,
        fontSize: normalize(14),
        fontWeight: '600',
        color: Colors.textPrimary || '#333',
        fontFamily: Typography.fontFamily.medium,
        marginRight: Spacing.sm,
    },
    faqAnswer: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        paddingTop: 0,
    },
    faqAnswerText: {
        fontSize: normalize(13),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        lineHeight: normalize(20),
    },
    needHelpSection: {
        marginHorizontal: responsiveValue(Spacing.sm, Spacing.md, Spacing.lg),
        marginTop: Spacing.lg,
        backgroundColor: Colors.white,
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
    needHelpTitle: {
        fontSize: normalize(16),
        fontWeight: '700',
        color: Colors.textPrimary || '#000',
        fontFamily: Typography.fontFamily.bold,
        marginBottom: Spacing.xs,
    },
    needHelpText: {
        fontSize: normalize(13),
        color: Colors.textSecondary || '#666',
        fontFamily: Typography.fontFamily.regular,
        lineHeight: normalize(20),
    },
    bottomSpacing: {
        height: responsiveValue(hp(8), hp(10), hp(12)),
    },
});

export default HelpScreen;