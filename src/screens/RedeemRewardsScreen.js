import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import Button from '../components/Button/Button';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { hp, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const RedeemRewardsScreen = ({ navigation }) => {
    const [upiId, setUpiId] = useState('');
    const [transactions] = useState([
        {
            id: 1,
            amount: '₹100',
            status: 'Completed',
            date: '25-08-2025',
        },
        {
            id: 2,
            amount: '₹100',
            status: 'Pending',
            date: '25-08-2025',
        },
    ]);

    const handleRedeem = () => {
        if (upiId.trim()) {
            // Handle redemption logic
        }
    };

    return (
        <View style={styles.container}>
            <Header
                onBackPress={() => navigation.goBack()}
                title="Redeem Rewards"
                gradientColors={Colors.gradient.primary}
            />

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Total Rewards Card */}
                <View style={styles.rewardsCard}>
                    <Image
                        source={require('../assets/Icons/coin.png')}
                        style={styles.coinIcon}
                    />
                    <View style={styles.rewardInfo}>
                        <Text style={styles.rewardLabel}>Total Rewards</Text>
                        <Text style={styles.rewardAmount}>₹100</Text>
                    </View>
                </View>

                {/* UPI Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your UPI ID (e.g. name@upi)"
                        placeholderTextColor={Colors.text.secondary}
                        value={upiId}
                        onChangeText={setUpiId}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Redeem Button */}
                <LinearGradient
                    colors={['#141248', '#63C8FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                    <Button
                        title="Redeem Now"
                        onPress={handleRedeem}
                        style={styles.redeemButton}
                        textStyle={styles.redeemButtonText}
                    />
                </LinearGradient>

                {/* Transaction History */}
                <View style={styles.historySection}>
                    <Text style={styles.historyTitle}>Transaction History</Text>

                    <View style={styles.tableHeader}>
                        <Text style={styles.headerText}>Amount</Text>
                        <Text style={styles.headerText}>Status</Text>
                        <Text style={styles.headerText}>Date</Text>
                    </View>

                    {transactions.map((transaction) => (
                        <View key={transaction.id} style={styles.tableRow}>
                            <Text style={styles.amountText}>{transaction.amount}</Text>
                            <Text style={[
                                styles.statusText,
                                transaction.status === 'Completed'
                                    ? styles.statusCompleted
                                    : styles.statusPending
                            ]}>
                                {transaction.status}
                            </Text>
                            <Text style={styles.dateText}>{transaction.date}</Text>
                        </View>
                    ))}
                </View>

                {/* Info Text */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoIcon}>
                        <Text style={styles.infoIconText}>ⓘ</Text>
                    </View>
                    <Text style={styles.infoText}>
                        Rewards will be transferred to your UPI ID within 3-5 business days after verification.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        paddingBottom: hp(10),
    },
    rewardsCard: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        padding: Spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    coinIcon: {
        width: normalize(50),
        height: normalize(50),
        marginRight: Spacing.md,
    },
    rewardInfo: {
        flex: 1,
    },
    rewardLabel: {
        fontSize: normalize(14),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        marginBottom: normalize(4),
    },
    rewardAmount: {
        fontSize: normalize(24),
        fontWeight: 'bold',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.bold,
    },
    inputContainer: {
        marginBottom: Spacing.lg,
    },
    input: {
        backgroundColor: Colors.white,
        borderRadius: normalize(12),
        paddingHorizontal: Spacing.lg,
        paddingVertical: normalize(16),
        fontSize: normalize(16),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    gradientButton: {
        borderRadius: normalize(12),
        marginBottom: Spacing.xl,
    },
    redeemButton: {
        backgroundColor: 'transparent',
    },
    redeemButtonText: {
        color: Colors.white,
        fontSize: normalize(16),
        fontWeight: '600',
        fontFamily: Typography.fontFamily.semiBold,
    },
    historySection: {
        marginBottom: Spacing.xl,
    },
    historyTitle: {
        fontSize: normalize(18),
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.semiBold,
        marginBottom: Spacing.md,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        marginBottom: Spacing.sm,
    },
    headerText: {
        fontSize: normalize(14),
        fontWeight: '600',
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.semiBold,
        flex: 1,
        textAlign: 'center',
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    amountText: {
        fontSize: normalize(14),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.medium,
        flex: 1,
        textAlign: 'center',
    },
    statusText: {
        fontSize: normalize(14),
        fontFamily: Typography.fontFamily.medium,
        flex: 1,
        textAlign: 'center',
    },
    statusCompleted: {
        color: '#4CAF50',
    },
    statusPending: {
        color: '#FF9800',
    },
    dateText: {
        fontSize: normalize(14),
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        flex: 1,
        textAlign: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: normalize(8),
        padding: Spacing.md,
        marginTop: Spacing.xxxxxl,
    },
    infoIcon: {
        width: normalize(18),
        height: normalize(18),
        borderRadius: normalize(10),
        backgroundColor: Colors.text.secondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    infoIconText: {
        color: Colors.white,
        fontSize: normalize(12),
        fontWeight: 'bold',
    },
    infoText: {
        flex: 1,
        fontSize: normalize(11),
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: normalize(18),
    },
});

export default RedeemRewardsScreen;