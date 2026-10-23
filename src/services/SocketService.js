import { io } from 'socket.io-client';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Socket.io Service
 * Handles real-time communication for:
 * - Chat messaging
 * - Voice/Video calling
 * - Booking/Order alerts
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.listeners = new Map();
  }

  /**
   * Initialize socket connection
   * @param {string} userId - Current user ID
   */
  connect(userId) {
    if (this.socket && this.isConnected) {

      return;
    }

    this.userId = userId;

    // Create socket connection with optimized settings for mobile
    this.socket = io(API_CONFIG.BASE_URL, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 500,        // Faster initial reconnect
      reconnectionDelayMax: 3000,    // Reduced max delay
      reconnectionAttempts: 3,       // Fewer attempts to avoid battery drain
      timeout: 8000,                 // Faster timeout
      forceNew: true,                // Force new connection to avoid stale connections
      query: {
        userId: userId,
      },
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      this.isConnected = true;

      // Join this user's room so io.to(userId).emit(...) reaches this socket
      // (the backend only listens for "join", never "register")

      this.socket.emit('join', userId);

      // Debug: Listen for ALL events to see if we're receiving anything

      const originalOnevent = this.socket.onevent;
      this.socket.onevent = function(packet) {
        const args = packet.data || [];

        originalOnevent.call(this, packet);
      };
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;

    });

    this.socket.on('connect_error', (error) => {

    });

    this.socket.on('reconnect', (attemptNumber) => {

    });

    this.socket.on('reconnect_error', (error) => {

    });

    // Listen for registration confirmation from backend
    this.socket.on('registered', (data) => {

    });

    // Listen for registration errors
    this.socket.on('registration_error', (error) => {

    });


  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      this.listeners.clear();

    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean}
   */
  getConnectionStatus() {
    return this.isConnected && this.socket !== null;
  }

  // ==================== CHAT METHODS ====================

  /**
   * Join a chat room (booking-specific)
   * @param {string} bookingId - Booking ID
   */
  joinChatRoom(bookingId) {
    if (!this.socket) {

      return;
    }

    this.socket.emit('join_chat', { bookingId });

  }

  /**
   * Leave a chat room
   * @param {string} bookingId - Booking ID
   */
  leaveChatRoom(bookingId) {
    if (!this.socket) return;

    this.socket.emit('leave_chat', { bookingId });

  }

  /**
   * Send a chat message
   * @param {Object} messageData - Message data
   * @param {string} messageData.bookingId - Booking ID
   * @param {string} messageData.senderId - Sender user ID
   * @param {string} messageData.receiverId - Receiver user ID
   * @param {string} messageData.message - Message text
   * @param {Array} messageData.files - Optional file attachments
   */
  sendMessage(messageData) {
    if (!this.socket) {

      return;
    }



    // Try both event names (backend might use either)
    this.socket.emit('send_message', messageData);

    // Also emit 'sendMessage' in case backend uses camelCase
    this.socket.emit('sendMessage', messageData);


  }

  /**
   * Listen for incoming messages
   * @param {Function} callback - Callback function to handle incoming messages
   */
  onMessageReceived(callback) {
    if (!this.socket) return;


    // Listen for 'new_message' (snake_case)
    this.socket.on('new_message', (message) => {

      callback(message);
    });

    // Also listen for 'newMessage' (camelCase) in case backend uses that
    this.socket.on('newMessage', (message) => {

      callback(message);
    });

    // Also listen for 'message' (simple)
    this.socket.on('message', (message) => {

      callback(message);
    });

    // Store listener for cleanup
    this.listeners.set('new_message', callback);
  }

  /**
   * Listen for typing indicator
   * @param {Function} callback - Callback function
   */
  onUserTyping(callback) {
    if (!this.socket) return;

    this.socket.on('user_typing', (data) => {

      callback(data);
    });

    this.listeners.set('user_typing', callback);
  }

  /**
   * Emit typing indicator
   * @param {string} bookingId - Booking ID
   * @param {boolean} isTyping - Whether user is typing
   */
  emitTyping(bookingId, isTyping) {
    if (!this.socket) return;

    this.socket.emit('typing', { bookingId, isTyping, userId: this.userId });
  }

  // ==================== CALLING METHODS ====================

  /**
   * Initiate a call (audio only)
   * @param {Object} callData - Call data
   * @param {string} callData.callId - Call ID (from the REST /start call)
   * @param {string} callData.receiverId - Receiver user ID
   * @param {string} [callData.callerName]
   * @param {string} [callData.callerAvatar]
   */
  initiateCall(callData) {
    if (!this.socket) {

      return;
    }

    const data = {
      callerId: this.userId,
      callType: 'audio',
      ...callData,
      timestamp: Date.now(),
    };


    this.socket.emit('initiateCall', data);


  }

  /**
   * Listen for incoming calls
   * @param {Function} callback - Callback function
   */
  onIncomingCall(callback) {
    if (!this.socket) {

      return;
    }


    this.socket.on('incomingCall', (callData) => {

      callback(callData);


    });

    this.listeners.set('incomingCall', callback);
  }

  /**
   * Send a WebRTC SDP offer to the receiver
   * @param {Object} data
   * @param {string} data.callId
   * @param {string} data.receiverId
   * @param {Object} data.offer
   */
  sendCallOffer(data) {
    if (!this.socket) return;

    this.socket.emit('callOffer', { from: this.userId, ...data });
  }

  /**
   * Listen for an incoming WebRTC SDP offer
   * @param {Function} callback - Callback function
   */
  onCallOffer(callback) {
    if (!this.socket) return;

    this.socket.on('callOffer', (data) => {
      callback(data);
    });

    this.listeners.set('callOffer', callback);
  }

  /**
   * Answer a call with a WebRTC SDP answer
   * @param {Object} answerData - Answer data
   * @param {string} answerData.callId - Call ID
   * @param {string} answerData.callerId - The original caller's user ID (who this routes to)
   * @param {Object} answerData.answer - WebRTC answer object
   */
  answerCall(answerData) {
    if (!this.socket) return;

    this.socket.emit('callAnswer', { from: this.userId, ...answerData });

  }

  /**
   * Reject a call
   * @param {string} callId - Call ID
   */
  rejectCall(callId) {
    if (!this.socket) return;

    this.socket.emit('rejectCall', { callId });

  }

  /**
   * End a call
   * @param {string} callId - Call ID
   */
  endCall(callId) {
    if (!this.socket) return;

    this.socket.emit('endCall', { callId, userId: this.userId });

  }

  /**
   * Listen for call answer
   * @param {Function} callback - Callback function
   */
  onCallAnswered(callback) {
    if (!this.socket) return;

    this.socket.on('callAnswer', (data) => {

      callback(data);
    });

    this.listeners.set('callAnswer', callback);
  }

  /**
   * Listen for call rejection
   * @param {Function} callback - Callback function
   */
  onCallRejected(callback) {
    if (!this.socket) return;

    this.socket.on('callRejected', (data) => {

      callback(data);
    });

    this.listeners.set('callRejected', callback);
  }

  /**
   * Listen for call end
   * @param {Function} callback - Callback function
   */
  onCallEnded(callback) {
    if (!this.socket) return;

    this.socket.on('callEnded', (data) => {

      callback(data);
    });

    this.listeners.set('callEnded', callback);
  }

  /**
   * Send WebRTC ICE candidate
   * @param {Object} candidateData - ICE candidate data
   * @param {string} candidateData.callId
   * @param {string} candidateData.targetUserId - The other party's user ID
   * @param {Object} candidateData.candidate
   */
  sendIceCandidate(candidateData) {
    if (!this.socket) return;

    this.socket.emit('iceCandidate', { from: this.userId, ...candidateData });
  }

  /**
   * Listen for ICE candidates
   * @param {Function} callback - Callback function
   */
  onIceCandidate(callback) {
    if (!this.socket) return;

    this.socket.on('iceCandidate', (data) => {
      callback(data);
    });

    this.listeners.set('iceCandidate', callback);
  }

  // ==================== BOOKING/ORDER METHODS ====================

  /**
   * Listen for new booking requests
   * @param {Function} callback - Callback function
   */
  onNewBooking(callback) {
    if (!this.socket) return;

    this.socket.on('new_booking', (bookingData) => {

      callback(bookingData);
    });

    this.listeners.set('new_booking', callback);
  }

  /**
   * Listen for booking confirmations
   * @param {Function} callback - Callback function
   */
  onBookingConfirmed(callback) {
    if (!this.socket) return;

    this.socket.on('booking_confirmed', (bookingData) => {

      callback(bookingData);
    });

    this.listeners.set('booking_confirmed', callback);
  }

  /**
   * Listen for booking cancellations
   * @param {Function} callback - Callback function
   */
  onBookingCancelled(callback) {
    if (!this.socket) return;

    this.socket.on('booking_cancelled', (bookingData) => {
      callback(bookingData);
    });

    this.listeners.set('booking_cancelled', callback);
  }

  /**
   * Listen for booking rejections (owner rejects customer's booking)
   * @param {Function} callback - Callback function
   */
  onBookingRejected(callback) {
    if (!this.socket) return;

    this.socket.on('booking_rejected', (bookingData) => {
      callback(bookingData);
    });

    // Also listen for alternative event names backend might use
    this.socket.on('bookingRejected', (bookingData) => {
      callback(bookingData);
    });

    this.listeners.set('booking_rejected', callback);
  }

  /**
   * Listen for booking updates
   * @param {Function} callback - Callback function
   */
  onBookingUpdated(callback) {
    if (!this.socket) return;

    this.socket.on('booking_updated', (bookingData) => {

      callback(bookingData);
    });

    this.listeners.set('booking_updated', callback);
  }

  // ==================== LIVE LOCATION TRACKING METHODS ====================

  /**
   * Join a booking's live-tracking room (customer + owner both call this)
   * @param {string} bookingId - Booking ID
   */
  joinBookingTracking(bookingId) {
    if (!this.socket) return;
    this.socket.emit('joinBooking', bookingId);
  }

  /**
   * Push a live GPS point for a booking (owner/driver side)
   * @param {Object} data
   * @param {string} data.bookingId
   * @param {string} data.userId
   * @param {'renterApp'|'driverApp'|'device'} data.source
   * @param {number} data.latitude
   * @param {number} data.longitude
   */
  emitLocationUpdate(data) {
    if (!this.socket) return;
    this.socket.emit('updateLocation', data);
  }

  /**
   * Listen for live location updates broadcast to a joined booking room
   * @param {Function} callback - Callback function
   */
  onLocationUpdate(callback) {
    if (!this.socket) return;

    this.socket.on('locationUpdate', (point) => {
      callback(point);
    });

    this.listeners.set('locationUpdate', callback);
  }

  /**
   * Listen for location-sharing errors (e.g. booking not found)
   * @param {Function} callback - Callback function
   */
  onLocationError(callback) {
    if (!this.socket) return;

    this.socket.on('locationError', (error) => {
      callback(error);
    });

    this.listeners.set('locationError', callback);
  }

  // ==================== USER STATUS METHODS ====================

  /**
   * Listen for user online status
   * @param {Function} callback - Callback function
   */
  onUserOnline(callback) {
    if (!this.socket) return;

    this.socket.on('user_online', (userData) => {

      callback(userData);
    });

    this.listeners.set('user_online', callback);
  }

  /**
   * Listen for user offline status
   * @param {Function} callback - Callback function
   */
  onUserOffline(callback) {
    if (!this.socket) return;

    this.socket.on('user_offline', (userData) => {

      callback(userData);
    });

    this.listeners.set('user_offline', callback);
  }

  // ==================== CLEANUP METHODS ====================

  /**
   * Remove a specific event listener
   * @param {string} eventName - Event name
   */
  removeListener(eventName) {
    if (!this.socket) return;

    this.socket.off(eventName);
    this.listeners.delete(eventName);

  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    if (!this.socket) return;

    this.listeners.forEach((callback, eventName) => {
      this.socket.off(eventName);
    });

    this.listeners.clear();

  }
}

// Export singleton instance
export default new SocketService();
