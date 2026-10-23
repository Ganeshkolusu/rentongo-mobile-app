import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View
} from 'react-native';
import { createBooking } from '../api/bookingApi';
import { createNotAvailability } from '../api/services/availabilityService';
import Button from '../components/Button/Button';
import DateSelectionSection from '../components/DateTime/DateSelectionSection';
import TimeSelectionSection from '../components/DateTime/TimeSelectionSection';
import Header from '../components/Header/Header';
import { Colors } from '../constants/Colors';
import { normalize } from '../constants/Dimensions';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const DateTimeSelectionScreen = ({ navigation, route }) => {
  const { user, userId } = useAuth();
  const { socket: socketService } = useSocket();

  const fromScreen = route?.params?.fromScreen;
  const currentAvailability = route?.params?.currentAvailability;
  const vehicleId = route?.params?.vehicleId;
  const vehicleType = route?.params?.vehicleType;
  const isModal = route?.params?.isModal || false;

  const [selectedData, setSelectedData] = useState({
    fromDate: null,
    toDate: null,
    times: { startTime: '06 PM', endTime: '08 PM' }
  });
  const [availability, setAvailability] = useState(currentAvailability ? 'available' : 'notAvailable');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [withDriver, setWithDriver] = useState(false);

  const isCar = (vehicleType || route?.params?.vehicleType || '').toLowerCase() === 'car';
  const driverAvailable = !!route?.params?.driverAvailable;
  const driverFee = Number(route?.params?.driverFee) || 0;

  useEffect(() => {
    if (route?.params?.refreshCalendar) {
      setRefreshKey(prev => prev + 1);
    }
  }, [route?.params?.refreshCalendar]);

  const handleBackPress = () => navigation.goBack();

  const handleDateChange = (dates) => setSelectedData(prev => ({ ...prev, ...dates }));
  const handleTimeChange = (times) => setSelectedData(prev => ({ ...prev, times }));

  const handleAvailabilitySelect = (value) => { 
    setAvailability(value); 
    setShowDropdown(false); 
  };

  const getHeaderTitle = () => {
    if (isModal) return 'Confirm Date & Time of your booking';
    if (fromScreen === 'availability') return 'Not Availability Date & Time';
    return 'Select Date & Time';
  };

  const handleAvailabilityCreated = () => setRefreshKey(prev => prev + 1);
  const handleAvailabilityUpdated = () => setRefreshKey(prev => prev + 1);
  const handleAvailabilityDeleted = () => setRefreshKey(prev => prev + 1);

  const handleConfirm = async () => {
    if (!selectedData.fromDate || !selectedData.toDate) {
      Alert.alert('⚠️ Missing Dates', 'Please select both From and To dates.');
      return;
    }

    setLoading(true);

    try {
      if (fromScreen === 'availability') {
        if (!vehicleId || !vehicleType) {
          Alert.alert('❌ Error', 'Vehicle information is missing');
          setLoading(false);
          return;
        }

        const fromDate = new Date(selectedData.fromDate).toISOString().split('T')[0];
        const toDate = new Date(selectedData.toDate).toISOString().split('T')[0];
        const fromTime = selectedData.times.startTime;
        const toTime = selectedData.times.endTime;

        const payload = {
          userId: userId,
          VechileId: vehicleId,
          vechileType: vehicleType,
          fromDate: fromDate,
          toDate: toDate,
          fromTime: fromTime,
          toTime: toTime,
          isNotAvailable: true,
          reason: 'Owner unavailable',
        };

        const result = await createNotAvailability(payload);

        if (result && (result.success || result.data)) {
          setRefreshKey(prev => prev + 1);
          Alert.alert(
            '✅ Success',
            'Your vehicle has been marked as not available.',
            [
              {
                text: 'OK',
                onPress: () => {
                  navigation.navigate({
                    name: route.params?.returnScreen || 'ListScreen',
                    params: { 
                      availabilityUpdated: true,
                      refreshCalendar: true,
                      vehicleId: vehicleId,
                    },
                    merge: true,
                  });
                }
              }
            ]
          );
        } else {
          Alert.alert('❌ Error', result?.message || 'Failed to update availability');
        }

        setLoading(false);
        return;
      }

      // ---------------------------------------------------
      // 🚨 CONTACT NUMBER VALIDATION (NEW)
      // ---------------------------------------------------
      const userContactNumber = user?.mobilenumber || route?.params?.contactNumber;

      if (!userContactNumber) {
        Alert.alert(
          'Contact Number Required',
          'Please update your contact number before booking.',
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('MyProfileScreen', {
                  requireContactUpdate: true,
                });
              }
            }
          ]
        );
        setLoading(false);
        return; // STOP booking flow
      }
      // ---------------------------------------------------

      // Booking flow
      const fromDate = new Date(selectedData.fromDate);
      const toDate = new Date(selectedData.toDate);
      const totalHours = Math.max(1, Math.floor((toDate - fromDate) / (1000 * 60 * 60)) || 1);
      const pricePerKm = route?.params?.pricePerKm || 40;
      const appliedDriverFee = isCar && withDriver && driverAvailable ? driverFee : 0;
      const totalPrice = totalHours * pricePerKm + appliedDriverFee;

      const ownerId = route?.params?.ownerId;

      // IMPORTANT: Verify ownerId is being passed
      if (!ownerId) {

      } else {

      }

      const bookingData = {
        userId: userId || user?._id,
        ownerId: ownerId, // ✅ CRITICAL: Vehicle owner's ID for sending notifications
        vechileType: vehicleType || route?.params?.vehicleType || 'Bike',
        VechileId: vehicleId || route?.params?.vehicleId,
        pricePerKm: pricePerKm,
        pricePerHour: route?.params?.pricePerHour,
        pricePerDay: route?.params?.pricePerDay,
        contactNumber: userContactNumber,  // FIXED ✔
        contactName: user?.name || route?.params?.contactName,
        latitude: route?.params?.latitude || 17.438095,
        longitude: route?.params?.longitude || 78.4485,
        FromDate: fromDate.toISOString().split('T')[0],
        ToDate: toDate.toISOString().split('T')[0],
        FromTime: selectedData.times.startTime,
        ToTime: selectedData.times.endTime,
        totalHours,
        totalPrice,
        withDriver: isCar && withDriver && driverAvailable,
      };


      const result = await createBooking(bookingData);

      if (result.success) {

        // Extract booking data - API returns { success, data: { message, booking } }
        const bookingResponseData = result.data?.booking || result.booking || result.data;

        // Verify ownerId is in the response
        const savedOwnerId = bookingResponseData?.ownerId || bookingResponseData?.OwnerId;
        if (savedOwnerId) {

        } else {

        }

        const targetScreen =
          (vehicleType?.toLowerCase?.() === 'bike' ||
           route?.params?.vehicleType?.toLowerCase?.() === 'bike')
            ? 'BikeDetailsScreen'
            : 'CarDetailsScreen';

        const bookingId = bookingResponseData?._id;

        if (!bookingId) {

        }

        // ✅ CRITICAL: Emit socket event to notify owner with bookingId
        // This is a frontend-only solution since backend doesn't include bookingId in push notification
        if (socketService?.socket && socketService.socket.connected && ownerId && bookingId) {

          socketService.socket.emit('new-booking-request', {
            bookingId: bookingId,
            ownerId: ownerId,
            customerId: userId || user?._id,
            vehicleType: vehicleType || route?.params?.vehicleType,
            vehicleId: vehicleId || route?.params?.vehicleId,
            customerName: user?.name || 'Customer',
          });

        } else {

        }

        // Navigate back immediately to show waiting modal
        navigation.navigate(targetScreen, {
          bookingSuccess: true,
          bookingId: bookingId, // ✅ CRITICAL: Booking ID for tracking status updates
          bookingData: bookingData,
          bikeId: vehicleId,
          carId: vehicleId,
          refreshCalendar: true,
        });
      } else {

        Alert.alert(
          '⚠️ Vehicle Unavailable',
          result.message || 'This vehicle is already booked for the selected time period.'
        );
      }

    } catch (error) {
      Alert.alert('❌ Error', error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => (
    <>
      {!isModal ? (
        <Header onBackPress={handleBackPress} title={getHeaderTitle()} gradientColors={['#63C8FF', '#141248']} />
      ) : (
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>{getHeaderTitle()}</Text>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <DateSelectionSection 
          key={refreshKey}
          onDateChange={handleDateChange} 
          fromScreen={fromScreen} 
          isModal={isModal}
          vehicleId={vehicleId}
          vehicleType={vehicleType}
          userId={userId}
          userRole={fromScreen === 'availability' ? 'owner' : 'customer'}
          onAvailabilityCreated={handleAvailabilityCreated}
          onAvailabilityUpdated={handleAvailabilityUpdated}
          onAvailabilityDeleted={handleAvailabilityDeleted}
          navigation={navigation}
        />

        <TimeSelectionSection onTimeChange={handleTimeChange} isModal={isModal} />

        {isCar && driverAvailable && (
          <View style={styles.driverOptionRow}>
            <Text style={styles.driverOptionText}>Book with driver (+₹{driverFee})</Text>
            <Switch value={withDriver} onValueChange={setWithDriver} />
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button 
            title={loading ? 'Processing...' : 'Continue'} 
            onPress={handleConfirm}
            disabled={loading}
          />
          {loading && <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />}
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
  driverOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: normalize(20),
    marginTop: normalize(16),
  },
  driverOptionText: { fontSize: normalize(14), color: Colors.text.primary, fontWeight: '600', flex: 1, marginRight: normalize(10) },
});

export default DateTimeSelectionScreen;
