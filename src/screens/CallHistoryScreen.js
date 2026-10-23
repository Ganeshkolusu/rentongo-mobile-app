import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getCallHistory } from '../api/callingApi';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';

const CallHistoryScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      setLoading(true);
      const userId = user?.userId || user?.id;
      const response = await getCallHistory(userId);
      
      if (response && response.data) {
        setCallHistory(response.data);
      }
    } catch (error) {
      // Silent catch
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCallHistory();
    setRefreshing(false);
  }, []);

  const formatCallTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return 'Not connected';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCallIcon = (call) => {
    const isOutgoing = call.callerId === (user?.userId || user?.id);
    const isMissed = call.status === 'missed' || call.status === 'rejected';
    const isVideo = call.callType === 'video';

    if (isMissed) {
      return {
        name: isVideo ? 'videocam' : 'call',
        color: Colors.error || '#E74C3C',
      };
    }

    return {
      name: isOutgoing 
        ? (isVideo ? 'videocam' : 'call-outline')
        : (isVideo ? 'videocam' : 'call'),
      color: isOutgoing ? Colors.success || '#27AE60' : Colors.primary || '#4A90E2',
    };
  };

  const handleCallPress = (call) => {
    const isOutgoing = call.callerId === (user?.userId || user?.id);
    const contactId = isOutgoing ? call.receiverId : call.callerId;
    const contactName = isOutgoing ? call.receiverName : call.callerName;
    const contactAvatar = isOutgoing ? call.receiverAvatar : call.callerAvatar;

    navigation.navigate('CallScreen', {
      callType: call.callType,
      isIncoming: false,
      receiverId: contactId,
      receiverName: contactName,
      receiverAvatar: contactAvatar,
    });
  };

  const renderCallItem = ({ item }) => {
    const icon = getCallIcon(item);
    const isOutgoing = item.callerId === (user?.userId || user?.id);
    const contactName = isOutgoing ? item.receiverName : item.callerName;
    const contactAvatar = isOutgoing ? item.receiverAvatar : item.callerAvatar;

    return (
      <TouchableOpacity 
        style={styles.callItem}
        onPress={() => handleCallPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {contactAvatar ? (
            <Image source={{ uri: contactAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={24} color={Colors.text.secondary} />
            </View>
          )}
        </View>

        <View style={styles.callInfo}>
          <Text style={styles.contactName}>{contactName || 'Unknown'}</Text>
          <View style={styles.callDetails}>
            <Ionicons 
              name={icon.name} 
              size={16} 
              color={icon.color}
              style={styles.callTypeIcon}
            />
            <Text style={[
              styles.callStatus,
              item.status === 'missed' && styles.missedCall
            ]}>
              {item.status === 'missed' ? 'Missed' : formatDuration(item.duration)}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.callTime}>{formatCallTime(item.timestamp)}</Text>
          <TouchableOpacity
            style={styles.infoButton}
            onPress={() => {
              // Navigate to call details or contact info
            }}
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Header
          title={'Call History'}
          onBackPress={() => navigation.goBack()}
          useGradient={true}
          gradientColors={Colors.gradient.primary}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{'Loading call history...'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title={'Call History'}
        onBackPress={() => navigation.goBack()}
        useGradient={true}
        gradientColors={Colors.gradient.primary}
      />

      {callHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="call-outline" size={80} color={Colors.text.secondary} />
          <Text style={styles.emptyText}>{'No call history'}</Text>
          <Text style={styles.emptySubtext}>
            {'Your calls will appear here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={callHistory}
          renderItem={renderCallItem}
          keyExtractor={(item) => item.id || item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background || '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: normalize(14),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: normalize(18),
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    fontFamily: Typography.fontFamily.semiBold,
  },
  emptySubtext: {
    fontSize: normalize(14),
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  listContent: {
    padding: Spacing.sm,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderRadius: normalize(12),
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatarContainer: {
    marginRight: Spacing.md,
  },
  avatar: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
  },
  avatarPlaceholder: {
    width: normalize(50),
    height: normalize(50),
    borderRadius: normalize(25),
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: normalize(16),
    fontWeight: '600',
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.semiBold,
    marginBottom: normalize(4),
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callTypeIcon: {
    marginRight: Spacing.xs,
  },
  callStatus: {
    fontSize: normalize(13),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  missedCall: {
    color: Colors.error || '#E74C3C',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  callTime: {
    fontSize: normalize(12),
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
    marginBottom: Spacing.xs,
  },
  infoButton: {
    padding: Spacing.xs,
  },
});

export default CallHistoryScreen;