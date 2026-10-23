import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CFEnvironment } from 'cashfree-pg-api-contract';
import { CFPaymentGatewayService, CFSession } from 'react-native-cashfree-pg-sdk';
import { subscriptionService } from '../api';
import { Colors } from '../constants/Colors';
import { Spacing, normalize } from '../constants/Dimensions';

const CASHFREE_ENV = (process.env.CASHFREE_ENV || 'SANDBOX').toUpperCase() === 'PRODUCTION'
  ? CFEnvironment.PRODUCTION
  : CFEnvironment.SANDBOX;

const SubscriptionScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const callbackSet = useRef(false);

  const loadStatus = async () => {
    try {
      const data = await subscriptionService.getMyStatus();
      setStatus(data);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to load subscription status');
    }
  };

  useEffect(() => {
    loadStatus();

    if (!callbackSet.current) {
      CFPaymentGatewayService.setCallback({
        onVerify: () => {
          // The webhook is the source of truth for activation; poll our own
          // status a couple of times as a UX fallback in case it lags.
          loadStatus();
          setTimeout(loadStatus, 3000);
          setTimeout(loadStatus, 8000);
        },
        onError: (error) => {
          Alert.alert('Payment Failed', error?.getMessage?.() || 'Payment was not completed');
        },
      });
      callbackSet.current = true;
    }

    return () => {
      CFPaymentGatewayService.removeCallback();
      callbackSet.current = false;
    };
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const order = await subscriptionService.createOrder('pro');
      const session = new CFSession(order.paymentSessionId, order.orderId, CASHFREE_ENV);
      CFPaymentGatewayService.doWebPayment(session);
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to start payment');
    } finally {
      setLoading(false);
    }
  };

  const isPro = status?.plan === 'pro' && status?.status === 'active';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Owner Plans</Text>
      <Text style={styles.subtitle}>Choose a plan to list your vehicles.</Text>

      {status && (
        <Text style={styles.currentPlan}>
          Current plan: <Text style={styles.bold}>{isPro ? 'Pro' : 'Free'}</Text>
          {isPro && status.expiresAt ? ` — renews/expires ${new Date(status.expiresAt).toLocaleDateString()}` : ''}
        </Text>
      )}

      <View style={[styles.card, !isPro && styles.cardActive]}>
        <Text style={styles.planName}>Free</Text>
        <Text style={styles.price}>₹0</Text>
        <Text style={styles.feature}>✓ List 1 vehicle</Text>
        <Text style={styles.featureMuted}>✗ Priority placement in search</Text>
        {!isPro && <Text style={styles.currentBadge}>Current plan</Text>}
      </View>

      <View style={[styles.card, isPro && styles.cardActive]}>
        <Text style={styles.planName}>Pro</Text>
        <Text style={styles.price}>₹499<Text style={styles.pricePeriod}>/30 days</Text></Text>
        <Text style={styles.feature}>✓ Unlimited vehicles</Text>
        <Text style={styles.feature}>✓ Priority placement in nearby-vehicle search</Text>
        {isPro ? (
          <Text style={styles.currentBadge}>Current plan</Text>
        ) : (
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg },
  title: { fontSize: normalize(24), fontWeight: '800', color: Colors.black, marginBottom: Spacing.xs },
  subtitle: { fontSize: normalize(14), color: Colors.text?.secondary || '#666', marginBottom: Spacing.lg },
  currentPlan: { fontSize: normalize(13), color: Colors.text?.secondary || '#666', marginBottom: Spacing.lg },
  bold: { fontWeight: '700', color: Colors.black },
  card: {
    borderWidth: 2,
    borderColor: Colors.border || '#E0E0E0',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardActive: { borderColor: Colors.primary },
  planName: { fontSize: normalize(18), fontWeight: '700', color: Colors.black, marginBottom: Spacing.xs },
  price: { fontSize: normalize(28), fontWeight: '800', color: Colors.black, marginBottom: Spacing.sm },
  pricePeriod: { fontSize: normalize(14), fontWeight: '500', color: Colors.text?.secondary || '#666' },
  feature: { fontSize: normalize(13), color: Colors.text?.secondary || '#444', marginBottom: 4 },
  featureMuted: { fontSize: normalize(13), color: Colors.text?.secondary || '#999', marginBottom: 4 },
  currentBadge: {
    marginTop: Spacing.sm,
    textAlign: 'center',
    color: Colors.primary,
    fontWeight: '700',
    fontSize: normalize(13),
  },
  upgradeButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  upgradeButtonText: { color: Colors.white, fontWeight: '700', fontSize: normalize(14) },
});

export default SubscriptionScreen;
