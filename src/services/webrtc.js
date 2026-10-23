import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const createPeerConnection = () => new RTCPeerConnection(ICE_SERVERS);

export const getLocalAudioStream = () => mediaDevices.getUserMedia({ audio: true, video: false });

export { RTCSessionDescription, RTCIceCandidate };
