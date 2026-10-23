# FCM Notification Payload Guide
## Custom Sound Configuration for Android & iOS

---

## Overview

This document describes the required FCM payload structure to play custom notification sounds in **foreground**, **background**, and **killed/terminated** app states on both Android and iOS.

---

## Sound Files Required

| Sound File | Used For | Android Location | iOS Location |
|------------|----------|------------------|--------------|
| `booking_notification.mp3` | New booking request (Owner) | `android/app/src/main/res/raw/` | Add to Xcode bundle |
| `reject_notification.mp3` | Booking rejected (Customer) | `android/app/src/main/res/raw/` | Add to Xcode bundle |
| `autocancel_notification.mp3` | Booking auto-cancelled (Customer) | `android/app/src/main/res/raw/` | Add to Xcode bundle |

---

## Android Notification Channels

| Channel ID | Channel Name | Sound |
|------------|--------------|-------|
| `bookings` | Booking Requests | `booking_notification` |
| `reject` | Rejection Notifications | `reject_notification` |
| `autocancel` | Auto Cancel Notifications | `autocancel_notification` |
| `default` | Default Notifications | `default` |

---

## Key Differences: Android vs iOS

| Field | Android | iOS |
|-------|---------|-----|
| Sound file name | `booking_notification` (NO extension) | `booking_notification.mp3` (WITH extension) |
| Channel | `channelId` required | Not needed |
| Priority field | `android.priority: "high"` | `apns-priority: "10"` |
| Sound path | `android.notification.sound` | `apns.payload.aps.sound` |

---

# API Endpoints & Payload Structure

---

## 1. POST `/createBooking`

**Description:** Customer creates a new booking request
**Send FCM to:** Vehicle Owner
**Sound:** `booking_notification`

### OLD Payload (Wrong):
```json
{
  "to": "<owner_fcm_token>",
  "notification": {
    "title": "New Booking Request",
    "body": "John wants to book your Honda City"
  },
  "data": {
    "bookingId": "abc123"
  }
}
```

### NEW Payload (Correct - Android + iOS):
```json
{
  "to": "<owner_fcm_token>",
  "priority": "high",
  "notification": {
    "title": "New Booking Request",
    "body": "John wants to book your Honda City"
  },
  "data": {
    "type": "booking",
    "bookingId": "abc123",
    "customerId": "cust456",
    "ownerId": "owner789",
    "customerName": "John",
    "vehicleName": "Honda City"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "bookings",
      "sound": "booking_notification"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "booking_notification.mp3",
        "content-available": 1
      }
    }
  }
}
```

---

## 2. POST `/confirmBooking/:bookingId/accept`

**Description:** Owner accepts a booking request
**Send FCM to:** Customer
**Sound:** `default`

### OLD Payload (Wrong):
```json
{
  "to": "<customer_fcm_token>",
  "notification": {
    "title": "Booking Confirmed",
    "body": "Your booking has been accepted"
  },
  "data": {
    "bookingId": "abc123"
  }
}
```

### NEW Payload (Correct - Android + iOS):
```json
{
  "to": "<customer_fcm_token>",
  "priority": "high",
  "notification": {
    "title": "Booking Confirmed!",
    "body": "Your booking for Honda City has been accepted"
  },
  "data": {
    "type": "accept",
    "bookingId": "abc123",
    "customerId": "cust456",
    "ownerId": "owner789",
    "status": "accepted"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "default",
      "sound": "default"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "default",
        "content-available": 1
      }
    }
  }
}
```

---

## 3. POST `/confirmBooking/:bookingId/reject`

**Description:** Owner rejects a booking request
**Send FCM to:** Customer
**Sound:** `reject_notification`

### OLD Payload (Wrong):
```json
{
  "to": "<customer_fcm_token>",
  "notification": {
    "title": "Booking Declined",
    "body": "Your booking request was declined"
  },
  "data": {
    "bookingId": "abc123"
  }
}
```

### NEW Payload (Correct - Android + iOS):
```json
{
  "to": "<customer_fcm_token>",
  "priority": "high",
  "notification": {
    "title": "Booking Declined",
    "body": "Your booking request was declined by the owner"
  },
  "data": {
    "type": "reject",
    "bookingId": "abc123",
    "customerId": "cust456",
    "ownerId": "owner789",
    "status": "rejected"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "reject",
      "sound": "reject_notification"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "reject_notification.mp3",
        "content-available": 1
      }
    }
  }
}
```

---

## 4. DELETE `/deleteBooking/:bookingId`

**Description:** Booking is cancelled
**Send FCM to:** Customer
**Sound:** `autocancel_notification`

### OLD Payload (Wrong):
```json
{
  "to": "<customer_fcm_token>",
  "notification": {
    "title": "Booking Cancelled",
    "body": "Your booking has been cancelled"
  },
  "data": {
    "bookingId": "abc123"
  }
}
```

### NEW Payload (Correct - Android + iOS):
```json
{
  "to": "<customer_fcm_token>",
  "priority": "high",
  "notification": {
    "title": "Booking Cancelled",
    "body": "Your booking has been cancelled"
  },
  "data": {
    "type": "autocancel",
    "bookingId": "abc123",
    "customerId": "cust456"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "autocancel",
      "sound": "autocancel_notification"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "autocancel_notification.mp3",
        "content-available": 1
      }
    }
  }
}
```

---

## 5. Auto-Cancel Cron Job (Expired Bookings)

**Description:** Booking auto-expires after timeout (e.g., 24 hours)
**Send FCM to:** Customer
**Sound:** `autocancel_notification`

### OLD Payload (Wrong):
```json
{
  "to": "<customer_fcm_token>",
  "notification": {
    "title": "Booking Expired",
    "body": "Your booking request expired"
  },
  "data": {
    "bookingId": "abc123"
  }
}
```

### NEW Payload (Correct - Android + iOS):
```json
{
  "to": "<customer_fcm_token>",
  "priority": "high",
  "notification": {
    "title": "Booking Auto-Cancelled",
    "body": "Your booking request expired as owner did not respond"
  },
  "data": {
    "type": "autocancel",
    "bookingId": "abc123",
    "customerId": "cust456"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channelId": "autocancel",
      "sound": "autocancel_notification"
    }
  },
  "apns": {
    "headers": {
      "apns-priority": "10"
    },
    "payload": {
      "aps": {
        "sound": "autocancel_notification.mp3",
        "content-available": 1
      }
    }
  }
}
```

---

# Quick Reference Table

| API Endpoint | Method | Send To | `type` | Android `channelId` | Android `sound` | iOS `aps.sound` |
|--------------|--------|---------|--------|---------------------|-----------------|-----------------|
| `/createBooking` | POST | Owner | `booking` | `bookings` | `booking_notification` | `booking_notification.mp3` |
| `/confirmBooking/:id/accept` | POST | Customer | `accept` | `default` | `default` | `default` |
| `/confirmBooking/:id/reject` | POST | Customer | `reject` | `reject` | `reject_notification` | `reject_notification.mp3` |
| `/deleteBooking/:id` | DELETE | Customer | `autocancel` | `autocancel` | `autocancel_notification` | `autocancel_notification.mp3` |
| Auto-cancel cron | - | Customer | `autocancel` | `autocancel` | `autocancel_notification` | `autocancel_notification.mp3` |

---

# Backend Implementation Example (Node.js)

## Firebase Admin Setup

```javascript
// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
```

## Send Notification Function

```javascript
// services/notificationService.js
const admin = require('../firebase');

/**
 * Send FCM notification with custom sound
 * @param {string} fcmToken - Recipient's FCM token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Data payload
 * @param {string} androidChannelId - Android channel ID
 * @param {string} androidSound - Android sound file name (without extension)
 * @param {string} iosSound - iOS sound file name (with extension)
 */
async function sendNotification(fcmToken, title, body, data, androidChannelId, androidSound, iosSound) {
  try {
    if (!fcmToken) {
      console.error('No FCM token provided');
      return { success: false, error: 'No FCM token' };
    }

    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: data,
      android: {
        priority: 'high',
        notification: {
          channelId: androidChannelId,
          sound: androidSound
        }
      },
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            sound: iosSound,
            'content-available': 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('FCM Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Specific notification functions
async function sendBookingNotification(ownerFcmToken, bookingData) {
  return sendNotification(
    ownerFcmToken,
    'New Booking Request',
    `${bookingData.customerName} wants to book your ${bookingData.vehicleName}`,
    {
      type: 'booking',
      bookingId: String(bookingData.bookingId),
      customerId: String(bookingData.customerId),
      ownerId: String(bookingData.ownerId)
    },
    'bookings',
    'booking_notification',
    'booking_notification.mp3'
  );
}

async function sendAcceptNotification(customerFcmToken, bookingData) {
  return sendNotification(
    customerFcmToken,
    'Booking Confirmed!',
    `Your booking for ${bookingData.vehicleName} has been accepted`,
    {
      type: 'accept',
      bookingId: String(bookingData.bookingId),
      status: 'accepted'
    },
    'default',
    'default',
    'default'
  );
}

async function sendRejectNotification(customerFcmToken, bookingData) {
  return sendNotification(
    customerFcmToken,
    'Booking Declined',
    'Your booking request was declined by the owner',
    {
      type: 'reject',
      bookingId: String(bookingData.bookingId),
      status: 'rejected'
    },
    'reject',
    'reject_notification',
    'reject_notification.mp3'
  );
}

async function sendAutoCancelNotification(customerFcmToken, bookingData) {
  return sendNotification(
    customerFcmToken,
    'Booking Auto-Cancelled',
    'Your booking request expired as owner did not respond',
    {
      type: 'autocancel',
      bookingId: String(bookingData.bookingId)
    },
    'autocancel',
    'autocancel_notification',
    'autocancel_notification.mp3'
  );
}

module.exports = {
  sendNotification,
  sendBookingNotification,
  sendAcceptNotification,
  sendRejectNotification,
  sendAutoCancelNotification
};
```

## Usage in Routes

```javascript
// routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const {
  sendBookingNotification,
  sendAcceptNotification,
  sendRejectNotification
} = require('../services/notificationService');

// POST /createBooking
router.post('/createBooking', async (req, res) => {
  try {
    // ... save booking to database ...

    // Get owner's FCM token
    const owner = await User.findById(booking.ownerId);

    // Send FCM to owner
    if (owner && owner.fcmToken) {
      await sendBookingNotification(owner.fcmToken, {
        bookingId: booking._id,
        customerId: booking.customerId,
        ownerId: booking.ownerId,
        customerName: booking.contactName,
        vehicleName: vehicleName
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /confirmBooking/:bookingId/accept
router.post('/confirmBooking/:bookingId/accept', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Confirmed' },
      { new: true }
    );

    // Get customer's FCM token
    const customer = await User.findById(booking.customerId);

    // Send FCM to customer
    if (customer && customer.fcmToken) {
      await sendAcceptNotification(customer.fcmToken, {
        bookingId: booking._id,
        vehicleName: vehicleName
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /confirmBooking/:bookingId/reject
router.post('/confirmBooking/:bookingId/reject', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Update booking status
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      { status: 'Rejected' },
      { new: true }
    );

    // Get customer's FCM token
    const customer = await User.findById(booking.customerId);

    // Send FCM to customer
    if (customer && customer.fcmToken) {
      await sendRejectNotification(customer.fcmToken, {
        bookingId: booking._id
      });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
```

---

# Mobile App Setup Required

## Android Setup (Already Done)

Sound files location:
```
android/app/src/main/res/raw/
├── booking_notification.mp3
├── reject_notification.mp3
├── autocancel_notification.mp3
└── ringtone.mp3
```

## iOS Setup (Required)

1. Copy sound files to iOS project:
```bash
cp src/assets/sounds/booking_notification.mp3 ios/RentOnGoVehicle/
cp src/assets/sounds/reject_notification.mp3 ios/RentOnGoVehicle/
cp src/assets/sounds/autocancel_notification.mp3 ios/RentOnGoVehicle/
```

2. Add files to Xcode:
   - Open `ios/RentOnGoVehicle.xcworkspace` in Xcode
   - Right-click `RentOnGoVehicle` folder → "Add Files to RentOnGoVehicle"
   - Select the 3 `.mp3` files
   - Check "Copy items if needed" → Add

---

# Testing Checklist

- [ ] Backend sends FCM with `android.notification.channelId`
- [ ] Backend sends FCM with `android.notification.sound`
- [ ] Backend sends FCM with `apns.payload.aps.sound`
- [ ] Android sound files in `res/raw/` folder
- [ ] iOS sound files added to Xcode bundle
- [ ] App reinstalled after channel changes (Android channels are immutable)
- [ ] Test booking notification (background + killed state)
- [ ] Test reject notification (background + killed state)
- [ ] Test auto-cancel notification (background + killed state)

---

# Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Default sound plays on Android | Missing `channelId` in payload | Add `android.notification.channelId` |
| No sound on iOS background | Missing `apns.payload.aps.sound` | Add `apns` block to payload |
| Sound not found | Wrong file name | Android: no extension, iOS: with `.mp3` |
| Channel sound not updating | Channels are immutable | Uninstall and reinstall app |
| iOS sound not playing | File not in bundle | Add file via Xcode (not just file system) |

---

# Document Info

- **Created:** December 2024
- **App:** RentOnGoVehicle
- **Platform:** React Native CLI (Android + iOS)
- **FCM Library:** @react-native-firebase/messaging
- **Local Notifications:** @notifee/react-native
