import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import Sound from 'react-native-sound';
import { rejectCall } from '../api/callingApi';
import { useSocket } from '../context/SocketContext';

const IncomingCallScreen = ({ route, navigation }) => {
  const {
    callId,
    callerId,
    callerName,
    callerAvatar,
    callType = 'audio', // 'audio' or 'video'
    offer, // WebRTC offer from Socket.io
  } = route.params || {};

  const { socket } = useSocket();
  const [pulseAnim] = useState(new Animated.Value(1));
  const ringtoneRef = useRef(null);


  useEffect(() => {

    // Enable playback in silence mode (iOS)
    Sound.setCategory('Playback');

    // Load and play ringtone
    const ringtone = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {

        return;
      }


      // Play ringtone in loop
      ringtone.setNumberOfLoops(-1); // Loop indefinitely
      ringtone.play((success) => {
        if (!success) {

        } else {

        }
      });
    });

    ringtoneRef.current = ringtone;

    // Start pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Vibrate pattern for incoming call
    if (Platform.OS === 'android') {

      const pattern = [0, 500, 200, 500];
      Vibration.vibrate(pattern, true);
    }

    return () => {

      // Stop ringtone when component unmounts
      if (ringtoneRef.current) {
        ringtoneRef.current.stop(() => {
          ringtoneRef.current.release();

        });
      }
      Vibration.cancel();
    };
  }, []);

  const handleAnswer = () => {

    // Stop ringtone
    if (ringtoneRef.current) {

      ringtoneRef.current.stop(() => {
        ringtoneRef.current.release();
      });
    }
    Vibration.cancel();

    // The real SDP answer is created once CallScreen sets up its own
    // RTCPeerConnection — sending a stub answer here would prematurely tell
    // the caller the callee answered with an empty (invalid) SDP.
    navigation.replace('CallScreen', {
      callId,
      isIncoming: true,
      receiverId: callerId,
      receiverName: callerName,
      receiverAvatar: callerAvatar,
      callType,
      offer, // Pass WebRTC offer to CallScreen if it was already received
    });

  };

  const handleReject = async () => {
    try {
      // Stop ringtone
      if (ringtoneRef.current) {
        ringtoneRef.current.stop(() => {
          ringtoneRef.current.release();
        });
      }
      Vibration.cancel();

      if (callId) {
        // Reject call via Socket.io for real-time notification
        if (socket) {
          socket.rejectCall(callId);

        }

        // Also call API for persistence
        await rejectCall(callId);
      }

      navigation.goBack();
    } catch (error) {

      navigation.goBack();
    }
  };

  return (
    <LinearGradient colors={['#667EEA', '#764BA2']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} animated={true} />

      {/* Call Type Indicator */}
      <View style={styles.callTypeContainer}>
        <Ionicons
          name={callType === 'video' ? 'videocam' : 'call'}
          size={24}
          color="#FFFFFF"
        />
        <Text style={styles.callTypeText}>
          {callType === 'video' ? 'Video Call' : 'Audio Call'}
        </Text>
      </View>

      {/* Caller Info */}
      <View style={styles.callerInfo}>
        <Animated.View
          style={[
            styles.avatarContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          {callerAvatar ? (
            <Image source={{ uri: callerAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={100} color="#FFFFFF" />
            </View>
          )}
        </Animated.View>

        <Text style={styles.callerName}>{callerName || 'Unknown Caller'}</Text>
        <Text style={styles.incomingText}>Incoming Call</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Reject Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={handleReject}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="close" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.actionLabel}>Decline</Text>
        </TouchableOpacity>

        {/* Answer Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.answerButton]}
          onPress={handleAnswer}
          activeOpacity={0.8}
        >
          <View style={styles.iconWrapper}>
            <Ionicons name="call" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.actionLabel}>Accept</Text>
        </TouchableOpacity>
      </View>

      {/* Swipe up to answer hint (optional) */}
      <View style={styles.hintContainer}>
        <Ionicons name="chevron-up" size={24} color="rgba(255,255,255,0.5)" />
        <Text style={styles.hintText}>Swipe to Answer</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
  },
  callTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  callTypeText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  callerInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 30,
  },
  avatar: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#FFFFFF',
  },
  callerName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  incomingText: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  actionButton: {
    alignItems: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  rejectButton: {
    opacity: 1,
  },
  answerButton: {
    opacity: 1,
  },
  rejectButton: {
    elevation: 8,
  },
  answerButton: {
    elevation: 8,
  },
  'rejectButton iconWrapper': {
    backgroundColor: '#E74C3C',
  },
  'answerButton iconWrapper': {
    backgroundColor: '#27AE60',
  },
  actionLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hintContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
  },
});

// Apply dynamic styles for reject button
const rejectButtonStyle = StyleSheet.create({
  iconWrapper: {
    backgroundColor: '#E74C3C',
  },
});

// Apply dynamic styles for answer button
const answerButtonStyle = StyleSheet.create({
  iconWrapper: {
    backgroundColor: '#27AE60',
  },
});

export default IncomingCallScreen;
