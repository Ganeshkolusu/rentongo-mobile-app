import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Sound from 'react-native-sound';
import { endCall, startCall } from '../api/callingApi';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import SocketService from '../services/SocketService';
import { createPeerConnection, getLocalAudioStream, RTCSessionDescription, RTCIceCandidate } from '../services/webrtc';

const CallScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const { stopRingtone } = useSocket();
  const {
    callType = 'audio',
    isIncoming = false,
    receiverId,
    receiverName,
    receiverAvatar,
    callId: initialCallId,
    bookingId,
  } = route.params || {};

  const [callId, setCallId] = useState(initialCallId);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'incoming' : 'connecting');

  const callTimerRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringtoneSoundRef = useRef(null);

  // WebRTC state — kept in refs since they must survive across renders
  // without triggering re-renders themselves
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingOfferRef = useRef(route.params?.offer || null);
  const pendingIceCandidatesRef = useRef([]);
  const remoteDescriptionSetRef = useRef(false);

  const otherPartyId = receiverId; // for both directions, "receiverId" here means "the other party"

  const flushPendingIceCandidates = async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;
    const queued = pendingIceCandidatesRef.current;
    pendingIceCandidatesRef.current = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        // Ignore individual candidate failures — not fatal to the call
      }
    }
  };

  // callIdForIce/targetUserId are passed explicitly (not read from state)
  // since this closure is created before the caller-side callId state update
  // has committed
  const setupPeerConnection = (callIdForIce, targetUserId) => {
    const pc = createPeerConnection();
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        SocketService.sendIceCandidate({
          callId: callIdForIce,
          targetUserId,
          candidate: event.candidate,
        });
      }
    };

    return pc;
  };

  const teardownCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    remoteDescriptionSetRef.current = false;
    pendingIceCandidatesRef.current = [];
  };

  // Play ringtone for caller (connecting state)
  const playCallerRingtone = () => {
    Sound.setCategory('Playback');
    const ringtone = new Sound('ringtone.mp3', Sound.MAIN_BUNDLE, (error) => {
      if (error) {

        return;
      }
      ringtone.setNumberOfLoops(-1);
      ringtone.play();

    });
    ringtoneSoundRef.current = ringtone;
  };

  // Stop ringtone
  const stopCallerRingtone = () => {
    if (ringtoneSoundRef.current) {
      ringtoneSoundRef.current.stop();
      ringtoneSoundRef.current.release();
      ringtoneSoundRef.current = null;

    }
    // Also stop receiver ringtone from SocketContext
    if (stopRingtone) {
      stopRingtone();
    }
  };

  useEffect(() => {
    if (!isIncoming) {
      initiateCall();
      // Play ringtone for caller when connecting
      playCallerRingtone();
    }

    // Pulse animation for connecting state
    if (callStatus === 'connecting') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
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
    }

    // Stop ringtone when call becomes active
    if (callStatus === 'active') {
      stopCallerRingtone();
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      // Cleanup ringtone on unmount
      stopCallerRingtone();
    };
  }, [callStatus]);

  useEffect(() => {
    if (callStatus === 'active') {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  // Listen for call answered event
  useEffect(() => {

    // Listen for when receiver answers the call — carries the real SDP answer
    SocketService.onCallAnswered(async (data) => {

      // Only update status if this is our call
      if (data.callId === callId) {
        const pc = peerConnectionRef.current;
        if (pc && data.answer) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            remoteDescriptionSetRef.current = true;
            await flushPendingIceCandidates();
          } catch (error) {
            // Ignore — call may still work partially, or user will hang up
          }
        }

        stopCallerRingtone();
        setCallStatus('active');
      }
    });

    // Listen for the incoming SDP offer (callee side) — may arrive before
    // or after the user taps Accept, so just stash it either way
    SocketService.onCallOffer((data) => {
      if (!callId || data.callId === callId) {
        pendingOfferRef.current = data.offer;
      }
    });

    // Listen for ICE candidates from the other party
    SocketService.onIceCandidate(async (data) => {
      if (data.callId !== callId) return;
      const pc = peerConnectionRef.current;
      if (pc && remoteDescriptionSetRef.current) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          // Ignore individual candidate failures
        }
      } else {
        pendingIceCandidatesRef.current.push(data.candidate);
      }
    });

    // Listen for call rejected
    SocketService.onCallRejected((data) => {

      if (data.callId === callId) {
        stopCallerRingtone();
        teardownCall();
        Alert.alert('Call Declined', 'The receiver declined your call.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    });

    // Listen for call ended
    SocketService.onCallEnded((data) => {

      if (data.callId === callId) {
        stopCallerRingtone();
        teardownCall();
        navigation.goBack();
      }
    });

    return () => {

      SocketService.removeListener('callAnswer');
      SocketService.removeListener('callOffer');
      SocketService.removeListener('iceCandidate');
      SocketService.removeListener('callRejected');
      SocketService.removeListener('callEnded');
    };
  }, [callId]);

  // Release the mic/peer connection if the screen unmounts mid-call
  useEffect(() => {
    return () => teardownCall();
  }, []);

  const initiateCall = async () => {
    try {
      const callerId = user?.userId || user?._id || user?.id;


      // Get caller's socket ID from SocketService
      const callerSocketId = SocketService.socket?.id;


      const callData = {
        callerId,
        receiverId,
        callType,
        callerSocketId,
      };

      const response = await startCall(callData);


      // Extract call ID from various possible response structures
      // Backend can return: response.callId, response.data._id, or response.call._id
      const newCallId = response.callId || response.data?._id || response.call?._id;


      if (response && newCallId) {
        setCallId(newCallId);

        // Also emit Socket.io event for real-time notification
        SocketService.initiateCall({
          callId: newCallId,
          callerId,
          receiverId,
          callerName: user?.name || user?.contactName || 'User',
          callerSocketId,
          callType: 'audio',
        });

        // Set up the actual audio transport: grab the mic, create the peer
        // connection, and send the SDP offer to the receiver
        const stream = await getLocalAudioStream();
        localStreamRef.current = stream;

        const pc = setupPeerConnection(newCallId, receiverId);
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        SocketService.sendCallOffer({ callId: newCallId, receiverId, offer });

      } else {

        throw new Error('No call ID received from backend');
      }
    } catch (error) {

      Alert.alert('Call Failed', 'Unable to start the call. Please try again.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleAnswerCall = async () => {
    try {
      // Stop ringtone when answering
      stopCallerRingtone();

      if (!pendingOfferRef.current) {
        throw new Error('No call offer received yet');
      }

      const stream = await getLocalAudioStream();
      localStreamRef.current = stream;

      const pc = setupPeerConnection(callId, otherPartyId);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      remoteDescriptionSetRef.current = true;
      await flushPendingIceCandidates();

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      SocketService.answerCall({ callId, callerId: otherPartyId, answer });
      setCallStatus('active');
    } catch (error) {

      Alert.alert('Error', 'Unable to answer the call.');
    }
  };

  const handleEndCall = async () => {
    try {
      stopCallerRingtone();
      teardownCall();
      if (callId) {
        SocketService.endCall(callId);
        await endCall(callId);
      }
      setCallStatus('ended');
      navigation.goBack();
    } catch (error) {

      navigation.goBack();
    }
  };

  const handleRejectCall = async () => {
    try {
      stopCallerRingtone();
      teardownCall();
      if (callId) {
        SocketService.rejectCall(callId);
        const { rejectCall } = require('../api/callingApi');
        await rejectCall(callId);
      }
      navigation.goBack();
    } catch (error) {

      navigation.goBack();
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    const track = localStreamRef.current?.getAudioTracks?.()[0];
    if (track) track.enabled = !nextMuted;
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callStatus) {
      case 'incoming':
        return 'Incoming Call';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return formatDuration(callDuration);
      case 'ended':
        return 'Call Ended';
      default:
        return '';
    }
  };

  return (
    <LinearGradient colors={Colors.gradient.primary} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} animated={true} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.minimizeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-down" size={28} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.statusText}>{getStatusText()}</Text>
        <View style={styles.minimizeButton} />
      </View>

      {/* Caller/Receiver Info */}
      <View style={styles.userInfo}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          {receiverAvatar ? (
            <Image source={{ uri: receiverAvatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={normalize(80)} color={Colors.white} />
            </View>
          )}
        </Animated.View>
        
        <Text style={styles.userName}>{receiverName || 'Unknown User'}</Text>
        <View style={styles.callTypeBadge}>
          <Ionicons
            name={callType === 'video' ? 'videocam' : 'call'}
            size={normalize(16)}
            color={Colors.white}
          />
          <Text style={styles.callTypeText}>
            {callType === 'video' ? 'Video Call' : 'Audio Call'}
          </Text>
        </View>
      </View>

      {/* Video Preview (for video calls) */}
      {callType === 'video' && isVideoEnabled && callStatus === 'active' && (
        <View style={styles.videoContainer}>
          <View style={styles.localVideoPlaceholder}>
            <Ionicons name="videocam" size={32} color={Colors.white} />
            <Text style={styles.videoPlaceholderText}>Your video</Text>
          </View>
        </View>
      )}

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        {callStatus === 'incoming' && (
          <View style={styles.incomingControls}>
            <TouchableOpacity
              style={styles.controlButtonLarge}
              onPress={handleRejectCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.gradientButton}
              >
                <Ionicons name="close" size={normalize(36)} color={Colors.white} />
              </LinearGradient>
              <Text style={styles.controlLabelLarge}>{'Decline'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButtonLarge}
              onPress={handleAnswerCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#27AE60', '#229954']}
                style={styles.gradientButton}
              >
                <Ionicons name="call" size={normalize(36)} color={Colors.white} />
              </LinearGradient>
              <Text style={styles.controlLabelLarge}>{'Accept'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(callStatus === 'connecting' || callStatus === 'active') && (
          <View style={styles.activeControls}>
            <View style={styles.controlRow}>
              <TouchableOpacity
                style={styles.smallControlButton}
                onPress={toggleMute}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.iconCircle,
                  isMuted && styles.activeIconCircle
                ]}>
                  <Ionicons
                    name={isMuted ? 'mic-off' : 'mic'}
                    size={normalize(24)}
                    color={Colors.white}
                  />
                </View>
                <Text style={styles.controlLabel}>
                  {isMuted ? 'Unmute' : 'Mute'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.smallControlButton}
                onPress={toggleSpeaker}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.iconCircle,
                  isSpeakerOn && styles.activeIconCircle
                ]}>
                  <Ionicons
                    name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                    size={normalize(24)}
                    color={Colors.white}
                  />
                </View>
                <Text style={styles.controlLabel}>{'Speaker'}</Text>
              </TouchableOpacity>

              {callType === 'video' && (
                <TouchableOpacity
                  style={styles.smallControlButton}
                  onPress={toggleVideo}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.iconCircle,
                    !isVideoEnabled && styles.activeIconCircle
                  ]}>
                    <Ionicons
                      name={isVideoEnabled ? 'videocam' : 'videocam-off'}
                      size={normalize(24)}
                      color={Colors.white}
                    />
                  </View>
                  <Text style={styles.controlLabel}>{'Video'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.endCallButtonContainer}
              onPress={handleEndCall}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#E74C3C', '#C0392B']}
                style={styles.endCallButton}
              >
                <Ionicons 
                  name="call" 
                  size={normalize(32)} 
                  color={Colors.white}
                  style={styles.endCallIcon}
                />
              </LinearGradient>
              <Text style={styles.endCallText}>{'End Call'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  minimizeButton: {
    width: normalize(40),
    height: normalize(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: normalize(16),
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Typography.fontFamily.semiBold,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  avatar: {
    width: normalize(140),
    height: normalize(140),
    borderRadius: normalize(70),
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing.lg,
  },
  avatarPlaceholder: {
    width: normalize(140),
    height: normalize(140),
    borderRadius: normalize(70),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: Spacing.lg,
  },
  userName: {
    fontSize: normalize(28),
    fontWeight: 'bold',
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing.sm,
  },
  callTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: normalize(20),
  },
  callTypeText: {
    fontSize: normalize(14),
    color: Colors.white,
    marginLeft: Spacing.xs,
    fontFamily: Typography.fontFamily.medium,
  },
  videoContainer: {
    position: 'absolute',
    top: normalize(100),
    right: Spacing.md,
    width: normalize(120),
    height: normalize(160),
    borderRadius: normalize(12),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  localVideoPlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: Colors.white,
    fontSize: normalize(12),
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  controlsContainer: {
    paddingBottom: normalize(50),
    paddingHorizontal: Spacing.lg,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButtonLarge: {
    alignItems: 'center',
  },
  gradientButton: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  controlLabelLarge: {
    color: Colors.white,
    fontSize: normalize(14),
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
  activeControls: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: normalize(40),
  },
  smallControlButton: {
    alignItems: 'center',
  },
  iconCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(30),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  controlLabel: {
    color: Colors.white,
    fontSize: normalize(12),
    marginTop: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  endCallButtonContainer: {
    alignItems: 'center',
  },
  endCallButton: {
    width: normalize(70),
    height: normalize(70),
    borderRadius: normalize(35),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  endCallIcon: {
    transform: [{ rotate: '135deg' }],
  },
  endCallText: {
    color: Colors.white,
    fontSize: normalize(14),
    marginTop: Spacing.sm,
    fontFamily: Typography.fontFamily.semiBold,
  },
});

export default CallScreen;