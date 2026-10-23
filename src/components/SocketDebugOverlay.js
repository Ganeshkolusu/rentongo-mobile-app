import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSocket } from '../context/SocketContext';
import SocketService from '../services/SocketService';

/**
 * Debug overlay to show Socket.io connection status
 * Shows in corner of screen - tap to expand/collapse
 */
const SocketDebugOverlay = () => {
  const { isConnected } = useSocket();
  const [expanded, setExpanded] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [listenerSetup, setListenerSetup] = useState(false);

  useEffect(() => {

    // Listen for any incoming events
    if (SocketService.socket) {
      const onAnyEvent = (eventName, data) => {

        setLastEvent({ name: eventName, time: new Date().toLocaleTimeString() });
        setEventCount(prev => {
          const newCount = prev + 1;

          return newCount;
        });
      };

      // Use onAny to catch ALL events
      if (SocketService.socket.onAny) {
        SocketService.socket.onAny((eventName, ...args) => {
          onAnyEvent(eventName, args[0]);
        });
        setListenerSetup(true);
      } else {
        setListenerSetup(false);
      }

      return () => {

        if (SocketService.socket && SocketService.socket.offAny) {
          SocketService.socket.offAny();
        }
      };
    } else {

    }
  }, [isConnected]);

  const socketId = SocketService.socket?.id || 'Not connected';
  const userId = SocketService.userId || 'No user';

  if (!expanded) {
    return (
      <TouchableOpacity
        style={[styles.collapsedContainer, { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }]}
        onPress={() => setExpanded(true)}
      >
        <Text style={styles.collapsedText}>
          {isConnected ? '✅' : '❌'} {eventCount}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.expandedContainer}
      onPress={() => setExpanded(false)}
    >
      <Text style={styles.title}>🔌 Socket Debug</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: isConnected ? '#4CAF50' : '#F44336' }]}>
          {isConnected ? '✅ Connected' : '❌ Disconnected'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Socket ID:</Text>
        <Text style={styles.valueSmall} numberOfLines={1}>
          {socketId}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>User ID:</Text>
        <Text style={styles.valueSmall} numberOfLines={1}>
          {userId}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Listener:</Text>
        <Text style={[styles.value, { color: listenerSetup ? '#4CAF50' : '#F44336' }]}>
          {listenerSetup ? '✅ Active' : '❌ Inactive'}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Events:</Text>
        <Text style={[styles.value, { color: eventCount > 0 ? '#4CAF50' : '#999' }]}>
          {eventCount}
        </Text>
      </View>

      {lastEvent ? (
        <View style={styles.eventBox}>
          <Text style={styles.eventLabel}>Last Event:</Text>
          <Text style={styles.eventName}>{lastEvent.name}</Text>
          <Text style={styles.eventTime}>{lastEvent.time}</Text>
        </View>
      ) : (
        <View style={[styles.eventBox, { backgroundColor: '#FFF3E0', borderLeftColor: '#FF9800' }]}>
          <Text style={[styles.eventLabel, { color: '#F57C00' }]}>⚠️ No Events Received</Text>
          <Text style={[styles.eventTime, { color: '#666' }]}>
            {isConnected ? 'Waiting for Socket.io events...' : 'Socket not connected'}
          </Text>
        </View>
      )}

      <Text style={styles.tapHint}>Tap to collapse</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  collapsedContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 9999,
  },
  collapsedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expandedContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    minWidth: 280,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 9999,
    borderWidth: 2,
    borderColor: '#667EEA',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    width: 80,
  },
  value: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  valueSmall: {
    fontSize: 10,
    color: '#333',
    flex: 1,
  },
  eventBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#667EEA',
  },
  eventLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  eventName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#667EEA',
    marginBottom: 2,
  },
  eventTime: {
    fontSize: 10,
    color: '#999',
  },
  tapHint: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default SocketDebugOverlay;
