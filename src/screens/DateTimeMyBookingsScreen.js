// DateTimeMyBookingsScreen.js
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Button from '../components/Button/Button';
import DateSelectionMyBookings from '../components/DateTime/DateSelectionMyBookings';
import TimeSelectionMyBookings from '../components/DateTime/TimeSelectionMyBookings';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { normalize } from '../constants/Dimensions';
import { useAuth } from '../context/AuthContext';

const DateTimeMyBookingsScreen = ({ navigation, route }) => {
  const { user, userId } = useAuth();

  const isModal = route?.params?.isModal || false;

  // selectedData: fromDate/toDate are Date objects (from your DateSelection component)
  // times are strings in "06:00 AM" format from your TimeSelection component
  const [selectedData, setSelectedData] = useState({
    fromDate: null,
    toDate: null,
    times: { startTime: '06:00 AM', endTime: '08:00 AM' }
  });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (route?.params?.refreshCalendar) {
      setRefreshKey(prev => prev + 1);
    }
  }, [route?.params?.refreshCalendar]);

  // ----------------- Helpers -----------------
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert "06:00 AM" -> "06:00", "07:30 PM" -> "19:30"
  const convertTo24H = (time12h) => {
    if (!time12h) return '';
    // if already "HH:MM" (24h), return as-is
    if (/^\d{2}:\d{2}$/.test(time12h)) return time12h;

    const parts = time12h.trim().split(' ');
    if (parts.length === 2) {
      const [time, modifier] = parts;
      const [hhStr, mm] = time.split(':');
      let hh = parseInt(hhStr, 10);
      if (modifier.toUpperCase() === 'PM' && hh !== 12) hh += 12;
      if (modifier.toUpperCase() === 'AM' && hh === 12) hh = 0;
      const hhPad = String(hh).padStart(2, '0');
      return `${hhPad}:${mm}`;
    }
    // fallback: try parse
    return time12h;
  };

  // Don't fetch availability here - let Dashboard handle it

  // ----------------- Handlers -----------------
  const handleBackPress = () => navigation.goBack();

  const handleDateChange = (dates) => {
    // dates: { fromDate, toDate }
    setSelectedData(prev => ({ ...prev, ...dates }));
  };

  const handleTimeChange = (times) => {
    // times: { startTime, endTime } where values are like "06:00 AM"
    setSelectedData(prev => ({ ...prev, times }));
  };

  const handleConfirm = () => {
    // Validate dates and times
    if (!selectedData.fromDate || !selectedData.toDate) {
      Alert.alert('⚠️ Missing Dates', 'Please select both From and To dates.');
      return;
    }
    if (!selectedData.times?.startTime || !selectedData.times?.endTime) {
      Alert.alert('⚠️ Missing Times', 'Please select both Start and End times.');
      return;
    }

    // Navigate to Dashboard with availability filters
    const parentNav = navigation.getParent() || navigation;
    parentNav.navigate('DashBoard', {
      activeTab: 'Rental',
      filterByAvailability: true,
      fromDate: formatDateForAPI(selectedData.fromDate),
      toDate: formatDateForAPI(selectedData.toDate),
      fromTime: convertTo24H(selectedData.times.startTime),
      toTime: convertTo24H(selectedData.times.endTime)
    });
  };

  // ----------------- Render -----------------
  const renderContent = () => (
    <>
      {!isModal ? (
        <Header onBackPress={handleBackPress} title={'Select Date & Time'} gradientColors={['#63C8FF', '#141248']} />
      ) : (
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Select Date & Time</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <DateSelectionMyBookings 
          key={refreshKey}
          onDateChange={handleDateChange} 
          fromScreen={null}
          isModal={isModal}
          userRole={'customer'}
          navigation={navigation}
        />

        <TimeSelectionMyBookings 
          onTimeChange={handleTimeChange} 
          isModal={isModal}
          initialStartTime={selectedData.times.startTime}
          initialEndTime={selectedData.times.endTime}
        />

        <View style={styles.buttonContainer}>
          <Button
            title="Search Available Vehicles"
            onPress={handleConfirm}
          />
        </View>
      </ScrollView>
    </>
  );

  if (isModal) {
    return (
      <Modal animationType="slide" transparent visible onRequestClose={handleBackPress}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>{renderContent()}</View>
        </View>
      </Modal>
    );
  }

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '90%', maxHeight: '85%', backgroundColor: Colors.white, borderRadius: normalize(20), overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: normalize(20), backgroundColor: Colors.white },
  modalHeaderTitle: { fontSize: normalize(16), fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
  content: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingTop: normalize(10), paddingBottom: normalize(30) },
  buttonContainer: { paddingHorizontal: normalize(20), marginTop: normalize(20), marginBottom: normalize(10) },
  loader: { marginTop: normalize(10) },
});

export default DateTimeMyBookingsScreen;
