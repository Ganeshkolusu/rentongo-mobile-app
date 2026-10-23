import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LocationTrackingService from '../services/LocationTrackingService';
import { Colors } from '../constants/Colors';

/**
 * Lets the vehicle owner start/stop broadcasting their live GPS position
 * for a confirmed booking, so the customer can watch them approach.
 */
const ShareLocationButton = ({ bookingId, ownerId }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      if (isSharing) {
        await LocationTrackingService.stopSharing();
        setIsSharing(false);
      } else {
        const result = await LocationTrackingService.startSharing(bookingId, ownerId, 'renterApp');
        if (result.success) {
          setIsSharing(true);
        } else {
          Alert.alert('Location sharing', result.error || 'Could not start sharing location');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, isSharing && styles.buttonActive]}
      onPress={handlePress}
      disabled={loading}
    >
      <Icon
        name={isSharing ? 'close-circle-outline' : 'navigate-outline'}
        size={18}
        color={isSharing ? Colors.error || '#E53935' : Colors.white}
      />
      <Text style={[styles.text, isSharing && styles.textActive]}>
        {isSharing ? 'Stop Sharing Location' : 'Share My Location'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: Colors.primary,
  },
  buttonActive: {
    backgroundColor: '#FDECEA',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  text: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  textActive: {
    color: Colors.error || '#E53935',
  },
});

export default ShareLocationButton;
