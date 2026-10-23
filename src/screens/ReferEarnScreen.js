import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Button from '../components/Button/Button';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { hp, normalize, Spacing, wp } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const ReferEarnScreen = ({ navigation }) => {
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const faqs = [
        {
            id: 1,
            question: 'How does the referral program work?',
            answer: 'Share your unique referral code with friends. When they sign up and complete their first booking, both you and your friend earn rewards!'
        },
        {
            id: 2,
            question: 'How much can I earn?',
            answer: 'You can earn up to ₹100 for each successful referral. Your friend also gets ₹50 off on their first booking!'
        },
        {
            id: 3,
            question: 'When will I receive my rewards?',
            answer: 'Rewards are credited within 24-48 hours after your friend completes their first booking.'
        },
        {
            id: 4,
            question: 'Is there a limit on referrals?',
            answer: 'No! You can refer as many friends as you want and earn unlimited rewards.'
        }
    ];

    const toggleFAQ = (id) => {
        setExpandedFAQ(expandedFAQ === id ? null : id);
    };

    const ReferStep = ({ icon, titleKey, showArrow, arrowType }) => (
        <View style={styles.stepWrapper}>
            <View style={styles.stepContainer}>
                <View style={styles.iconWithArrow}>
                    <View style={styles.stepIconContainer}>
                        <Image source={icon} style={styles.stepIcon} />
                    </View>
                    {showArrow && (
                        <Image
                            source={arrowType === 'line110'
                                ? require('../assets/Icons/Line 110.png')
                                : require('../assets/Icons/Line 111.png')
                            }
                            style={[
                                styles.arrowImage,
                                arrowType === 'line110' ? styles.arrowLeft : styles.arrowRight
                            ]}
                        />
                    )}
                </View>
                <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{titleKey}</Text>
                </View>
            </View>
        </View>
    );

    const FAQItem = ({ item }) => (
        <TouchableOpacity
            style={styles.faqItem}
            onPress={() => toggleFAQ(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.faqHeader}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Image
                    source={require('../assets/Icons/dropdown.png')}
                    style={[
                        styles.faqIcon,
                        expandedFAQ === item.id && styles.faqIconExpanded
                    ]}
                />
            </View>
            {expandedFAQ === item.id && (
                <Text style={styles.faqAnswer}>{item.answer}</Text>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Header
                onBackPress={() => navigation.goBack()}
                title="Refer & Earn"
                gradientColors={Colors.gradient.primary}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Earnings Card */}
                <View style={styles.earningsContainer}>
                    <LinearGradient
                        colors={['#141248', '#63C8FF']}
                        style={styles.earningsCard}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <View style={styles.earningsHeader}>
                            <Text style={styles.earningsTitle}>Refer Your Friends</Text>
                            <View style={styles.coinsContainer}>
                                <Image
                                    source={require('../assets/Icons/coins.png')}
                                    style={[styles.coinIcon, styles.coin1]}
                                />
                            </View>
                        </View>
                        <Text style={styles.earningsAmount}>Earn ₹100</Text>
                    </LinearGradient>

                    <View style={styles.rewardsBox}>
                        <Image
                            source={require('../assets/Icons/coin.png')}
                            style={styles.rewardIcon}
                        />
                        <View style={styles.rewardInfo}>
                            <Text style={styles.rewardLabel}>Total Rewards</Text>
                            <Text style={styles.rewardAmount}>₹100</Text>
                        </View>
                        <Button
                            title="Redeem"
                            onPress={() => navigation.navigate('RedeemRewardsScreen')}
                            variant="primary"
                            style={styles.redeemButton}
                            textStyle={styles.redeemButtonText}
                        />
                    </View>
                </View>

                {/* Steps Section */}
                <View style={styles.stepsContainer}>
                    <ReferStep
                        icon={require('../assets/Icons/link.png')}
                        titleKey="Share your unique referral link with friends"
                        showArrow={true}
                        arrowType="line110"
                    />
                    <ReferStep
                        icon={require('../assets/Icons/ticket.png')}
                        titleKey="Your friend signs up and completes their first booking"
                        showArrow={true}
                        arrowType="line111"
                    />
                    <ReferStep
                        icon={require('../assets/Icons/wallet.png')}
                        titleKey="Both of you earn rewards!"
                        showArrow={false}
                    />
                </View>

                {/* FAQ Section */}
                <View style={styles.faqSection}>
                    <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                    {faqs.map((item) => (
                        <FAQItem key={item.id} item={item} />
                    ))}
                </View>
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
        paddingBottom: hp(10),
    },
    earningsContainer: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
    },
    earningsCard: {
        borderRadius: normalize(16),
        padding: Spacing.lg,
        paddingBottom: normalize(40),
        minHeight: hp(16),
    },
    earningsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.xs,
    },
    earningsTitle: {
        fontSize: normalize(18),
        color: Colors.white,
        fontFamily: Typography.fontFamily.medium,
        opacity: 0.95,
    },
    coinsContainer: {
        width: wp(20),
        height: wp(10),
        position: 'relative',
    },
    coinIcon: {
        width: normalize(80),
        height: normalize(80),
        position: 'absolute',
    },
    coin1: {
        top: -5,
        right: 0,
    },
    coin2: {
        top: 0,
        right: 15,
    },
    coin3: {
        top: 5,
        right: 30,
    },
    earningsAmount: {
        fontSize: normalize(32),
        fontWeight: 'bold',
        color: Colors.white,
        fontFamily: Typography.fontFamily.bold,
    },
    rewardsBox: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: normalize(-20),
        marginHorizontal: Spacing.md,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    rewardIcon: {
        width: normalize(40),
        height: normalize(40),
        marginRight: Spacing.md,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardLabel: {
        fontSize: normalize(12),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: normalize(2),
    },
    rewardAmount: {
        fontSize: normalize(18),
        fontWeight: 'bold',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
    },
    redeemButton: {
        paddingHorizontal: Spacing.xs,
        paddingVertical: Spacing.xs,
        minWidth: wp(32),
    },
    redeemButtonText: {
        fontSize: normalize(14),
    },
    stepsContainer: {
        marginTop: Spacing.xl,
        marginHorizontal: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        backgroundColor: Colors.background,
        borderRadius: normalize(12),
        minHeight: hp(25),
    },
    stepWrapper: {
        // paddingHorizontal: normalize(0),
        overflow: 'visible',
    },
    stepContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: normalize(-10),
    },
    iconWithArrow: {
        // alignItems: 'center',
        // marginRight: Spacing.md,
        minHeight: normalize(80),
        width: normalize(80),
        overflow: 'visible',
    },
    stepIconContainer: {
        width: normalize(40),
        height: normalize(40),
        borderRadius: normalize(20),
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    stepIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.primary,
    },
    stepContent: {
        flex: 1,
        paddingTop: normalize(8),
    },
    stepTitle: {
        fontSize: normalize(14),
        color: Colors.black,
        fontFamily: Typography.fontFamily.medium,
        lineHeight: normalize(20),
    },
    stepDescription: {
        fontSize: normalize(12),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginTop: normalize(2),
    },
    arrowImage: {
        width: normalize(30),
        height: normalize(40),
        marginTop: normalize(5),
        resizeMode: 'contain',
    },
    arrowRight: {
        marginRight: normalize(28),
        alignSelf: 'flex-end',
        marginTop: normalize(-1)
    },
    arrowLeft: {
        marginLeft: normalize(-15),
        alignSelf: 'flex-start',
        marginTop: normalize(-5)
    },
    faqSection: {
        marginTop: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    faqTitle: {
        fontSize: normalize(18),
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.semiBold,
        marginBottom: Spacing.md,
    },
    faqItem: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        flex: 1,
        fontSize: normalize(14),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        paddingRight: Spacing.sm,
    },
    faqIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.text.secondary,
    },
    faqIconExpanded: {
        transform: [{ rotate: '180deg' }],
    },
    faqAnswer: {
        marginTop: Spacing.sm,
        fontSize: normalize(13),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: normalize(18),
    }
});

export default ReferEarnScreen;