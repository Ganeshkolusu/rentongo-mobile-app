// ============================================================
// BACKEND CODE FOR FCM CALL NOTIFICATIONS
// Copy this code to your backend
// ============================================================

// ==================== STEP 1: Install Dependencies ====================
/*
Run these commands in your backend folder:

npm install firebase-admin

Then download your Firebase service account key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Save as "serviceAccountKey.json" in backend root folder
*/

// ==================== STEP 2: Initialize Firebase Admin ====================
// Create file: backend/firebase.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  // console.log('✅ Firebase Admin SDK initialized');
}

module.exports = admin;

// ==================== STEP 3: Create FCM Notification Service ====================
// Create file: backend/services/callNotificationService.js

const admin = require('../firebase');

/**
 * Send incoming call notification via FCM
 * @param {string} receiverFcmToken - Receiver's FCM device token
 * @param {Object} callData - Call information
 * @returns {Promise<Object>} Result of notification send
 */
async function sendCallNotification(receiverFcmToken, callData) {
  try {
    // Validate FCM token
    if (!receiverFcmToken) {
      console.error('❌ [FCM] No FCM token provided');
      return { success: false, error: 'No FCM token' };
    }

    // Prepare FCM notification message
    const message = {
      token: receiverFcmToken,

      // Data payload - received even when app is closed
      data: {
        type: 'incoming_call',
        callId: String(callData.callId || ''),
        callerId: String(callData.callerId || ''),
        callerName: String(callData.callerName || 'Unknown'),
        callerSocketId: String(callData.callerSocketId || ''),
        callType: String(callData.callType || 'audio'),
      },

      // Visual notification
      notification: {
        title: `${callData.callerName || 'Someone'} is calling`,
        body: `${callData.callType === 'video' ? 'Video' : 'Audio'} call`,
      },

      // Android-specific options
      android: {
        priority: 'high',
        notification: {
          channelId: 'calls',
          sound: 'ringtone',
          priority: 'max',
          visibility: 'public',
          defaultVibrateTimings: true,
          tag: 'incoming_call',
          sticky: false,
        },
      },

      // iOS-specific options
      apns: {
        headers: {
          'apns-priority': '10',
        },
        payload: {
          aps: {
            sound: 'ringtone.mp3',
            category: 'call',
            'interruption-level': 'critical',
            'content-available': 1,
          },
        },
      },
    };
    // Send notification using Firebase Admin SDK
    const response = await admin.messaging().send(message);
    return {
      success: true,
      messageId: response
    };

  } catch (error) {
    console.error('❌ [FCM] Error message:', error.message);
    console.error('❌ [FCM] Error code:', error.code);

    // Handle specific FCM errors
    if (error.code === 'messaging/invalid-registration-token') {
      console.error('❌ [FCM] Invalid or expired FCM token');
    } else if (error.code === 'messaging/registration-token-not-registered') {
      console.error('❌ [FCM] FCM token is no longer registered');
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}

module.exports = { sendCallNotification };

// ==================== STEP 4: Update Your Call Start Endpoint ====================
// In your routes file (e.g., backend/routes/callRoutes.js or similar)

const express = require('express');
const router = express.Router();
const { sendCallNotification } = require('../services/callNotificationService');
const Call = require('../models/Call'); // Your Call model
const User = require('../models/User'); // Your User model

/**
 * POST /start - Initiate a new call
 * Body: { callerId, receiverId, callType, callerSocketId }
 */
router.post('/start', async (req, res) => {
  try {
    const { callerId, receiverId, callType, callerSocketId } = req.body;
    // ========== 1. VALIDATE REQUEST ==========
    if (!callerId || !receiverId || !callType) {
      console.error('❌ [BACKEND] Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: callerId, receiverId, callType',
      });
    }

    // ========== 2. CREATE CALL RECORD ==========
    const call = new Call({
      callerId: callerId,
      receiverId: receiverId,
      callType: callType,
      callerSocketId: callerSocketId,
      status: 'ringing',
      startedAt: new Date(),
      duration: 0,
      offer: null,
      answer: null,
      iceCandidates: [],
    });

    await call.save();
    // ========== 3. GET CALLER AND RECEIVER INFO ==========

    const [caller, receiver] = await Promise.all([
      User.findById(callerId),
      User.findById(receiverId)
    ]);

    if (!receiver) {
      console.error('❌ [BACKEND] Receiver not found in database');
      return res.status(404).json({
        success: false,
        error: 'Receiver not found',
      });
    }

    const callerName = caller
      ? (caller.name || caller.contactName || caller.username || 'Unknown')
      : 'Unknown';
    // ========== 4. SEND FCM NOTIFICATION ==========
    let notificationSent = false;

    if (receiver.fcmToken) {

      const notificationResult = await sendCallNotification(receiver.fcmToken, {
        callId: call._id.toString(),
        callerId: callerId,
        callerName: callerName,
        callerSocketId: callerSocketId,
        callType: callType,
      });

      if (notificationResult.success) {
        notificationSent = true;
      } else {
        console.warn('⚠️ [BACKEND] FCM notification failed:', notificationResult.error);

        // If token is invalid, remove it from database
        if (notificationResult.errorCode === 'messaging/invalid-registration-token' ||
            notificationResult.errorCode === 'messaging/registration-token-not-registered') {
          receiver.fcmToken = null;
          await receiver.save();
        }
      }
    } else {
      console.warn('⚠️ [BACKEND] Receiver has no FCM token');
      console.warn('⚠️ [BACKEND] Cannot send push notification');
    }

    // ========== 5. RETURN SUCCESS RESPONSE ==========
    res.json({
      success: true,
      call: {
        _id: call._id,
        callerId: call.callerId,
        receiverId: call.receiverId,
        callType: call.callType,
        callerSocketId: call.callerSocketId,
        status: call.status,
        startedAt: call.startedAt,
        duration: call.duration,
        createdAt: call.createdAt,
        updatedAt: call.updatedAt,
      },
      notificationSent: notificationSent,
    });

  } catch (error) {
    console.error('❌❌❌ [BACKEND] ========================================');
    console.error('❌❌❌ [BACKEND] ERROR STARTING CALL');
    console.error('❌❌❌ [BACKEND] ========================================');
    console.error('❌ [BACKEND] Error:', error.message);
    console.error('❌ [BACKEND] Stack:', error.stack);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

// ==================== STEP 5: Make Sure User Model Has FCM Token Field ====================
// In your User model (backend/models/User.js)

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  contactName: String,
  username: String,
  email: String,
  phone: String,
  password: String,

  // FCM Token field - REQUIRED for push notifications
  fcmToken: {
    type: String,
    default: null,
  },
  fcmTokenUpdatedAt: {
    type: Date,
    default: null,
  },

  // ... other fields
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

// ==================== TESTING ====================
/*
After implementing the code above:

1. Restart your backend server

2. Check if receiver has FCM token:
   - Query your database: db.users.findOne({ _id: "69156ee006702f6b9f795c12" })
   - Should see: { fcmToken: "eXGk5j7hRk..." }

3. Make a call from customer app

4. Backend logs should show:
   ✅ [BACKEND] Call record created successfully
   ✅ [BACKEND] FCM notification sent successfully!

5. Owner's phone should:
   - Show notification immediately
   - Play ringtone
   - Navigate to IncomingCallScreen (if app is open)
   - Show full-screen notification (if app is closed)

6. Owner's app logs should show:
   📞 [CALL NOTIFICATION] FOREGROUND NOTIFICATION RECEIVED
   ✅ [CALL NOTIFICATION] This is an incoming call notification!
   🚀 [CALL NOTIFICATION] Navigating to IncomingCallScreen...
   🔔 [IncomingCallScreen] SCREEN OPENED!
*/

// ==================== FILE STRUCTURE ====================
/*
backend/
├── firebase.js (NEW)
├── serviceAccountKey.json (DOWNLOAD from Firebase Console)
├── services/
│   └── callNotificationService.js (NEW)
├── routes/
│   └── callRoutes.js (UPDATE with /start endpoint code above)
└── models/
    └── User.js (CHECK - make sure fcmToken field exists)
*/

// ==================== QUICK START CHECKLIST ====================
/*
□ Install firebase-admin: npm install firebase-admin
□ Download serviceAccountKey.json from Firebase Console
□ Create backend/firebase.js
□ Create backend/services/callNotificationService.js
□ Update /start endpoint in your routes
□ Check User model has fcmToken field
□ Restart backend server
□ Test call from customer to owner
*/
