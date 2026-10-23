import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';
import CarFeatures from '../components/Car/CarFeatures';
import BikeFeatures from '../components/Bike/BikeFeatures';
import Button from '../components/Button/Button';
import BookingConfirmationPopup from '../components/BookingConfirmationPopup';
import BookingSuccessPopup from '../components/BookingSuccessPopup';
import FeedbackPopUp from '../components/FeedbackPopUp';
import { createBooking } from '../api/bookingApi';
import { BOOKING_STATUS, VEHICLE_TYPES } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const BookNowScreen = ({ navigation, route }) => {
  const { user, userId } = useAuth();
  const insets = useSafeAreaInsets();

  // Calculate bottom padding for Android navigation bar
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 60) : insets.bottom;

  const { car, bike } = route.params || {};
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showBookingPopup, setShowBookingPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);

  const isBike = bike !== undefined;
  const vehicle = isBike ? bike : car;

  const ownerName = 'Manoj Kumar';
  const ownerAvatar = require('../assets/Icons/user-avatar.png');

  const vehicleImages = isBike
    ? [
        vehicle?.image || require('../assets/Images/bike.png'),
        require('../assets/Images/bike.png'),
        require('../assets/Images/bike.png'),
        require('../assets/Images/bike.png'),
      ]
    : [
        vehicle?.image || require('../assets/Images/car.png'),
        require('../assets/Images/car.png'),
        require('../assets/Images/car.png'),
        require('../assets/Images/car.png'),
      ];

  // --- Handlers ---
  const handleBackPress = () => navigation.goBack();

  const handleImageScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const imageIndex = Math.round(scrollPosition / width);
    setCurrentImageIndex(imageIndex);
  };

  const handleCallPress = () => {
    const phoneNumber = '+919876543210';
    const phoneUrl = `tel:${phoneNumber}`;
    Linking.openURL(phoneUrl).catch(() => Alert.alert('Error', 'Something went wrong'));
  };

  const handleChatPress = () => {
    navigation.navigate('ChatScreen', {
      ownerName,
      ownerAvatar,
      vehicleInfo: {
        name: isBike ? vehicle?.title || 'Bike' : vehicle?.name || 'Car',
        price: vehicle?.price || (isBike ? '50' : '500'),
        type: isBike ? 'bike' : 'car',
      },
    });
  };

  const handlePopupConfirm = async (dateTimeData) => {
    try {
      // Get ownerId from route params or vehicle data
      const ownerId = route.params.ownerId || vehicle?.userId || vehicle?.ownerId;


      if (!ownerId) {

      }

      const bookingData = {
        userId: userId || user?._id || user?.id,
        ownerId: ownerId, // ✅ CRITICAL: Vehicle owner's ID for sending notifications
        vehicleType: route.params.vehicleType || (isBike ? VEHICLE_TYPES.BIKE : VEHICLE_TYPES.CAR),
        vehicleId: route.params.vehicleId || vehicle?._id,
        pricePerKm: route.params.pricePerKm || vehicle?.pricePerKm || 0,
        pricePerHour: route.params.pricePerHour || vehicle?.pricePerHour || 0,
        pricePerDay: route.params.pricePerDay || vehicle?.pricePerDay || 0,
        contactNumber: route.params.contactNumber?.trim() || user?.contactNumber || '0000000000',
        contactName: route.params.contactName?.trim() || user?.name || 'Unknown',
        latitude: route.params.latitude || '17.438095',
        longitude: route.params.longitude || '78.4485',
        FromDate: route.params.fromDate,
        ToDate: route.params.toDate,
        FromTime: route.params.fromTime,
        ToTime: route.params.toTime,
        totalHours: route.params.totalHours,
        totalPrice: route.params.totalPrice,
        status: BOOKING_STATUS.PENDING,
      };


      const result = await createBooking(bookingData);

      if (result.success) {
        Alert.alert('Success', result.message);
        setShowSuccessPopup(true);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {

      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handlePopupCancel = () => setShowBookingPopup(false);
  const handlePopupClose = () => setShowBookingPopup(false);
  const handleSuccessPopupClose = () => {
    setShowSuccessPopup(false);
    navigation.navigate('DashBoard');
  };
  const handleRatingSubmit = () => setShowFeedbackPopup(false);
  const handleRatingClose = () => setShowFeedbackPopup(false);

  // --- JSX ---
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />

      {/* Images */}
      <View style={styles.imageSection}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleImageScroll}
          scrollEventThrottle={16}
        >
          {vehicleImages.map((image, index) => (
            <Image key={index} source={image} style={styles.vehicleImage} />
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="chevron-back" size={24} color={Colors.black} />
        </TouchableOpacity>
        <View style={styles.indicatorContainer}>
          {vehicleImages.map((_, index) => (
            <View
              key={index}
              style={[styles.indicator, index === currentImageIndex ? styles.activeIndicator : styles.inactiveIndicator]}
            />
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.vehicleInfoSection}>
          <View style={styles.vehicleHeaderRow}>
            <Text style={styles.vehicleName}>
              {isBike ? vehicle?.title || 'Bike' : vehicle?.name || 'Hyundai Verna'}
            </Text>
            <View style={styles.ratingContainer}>
              <Image source={require('../assets/Icons/star.png')} style={styles.starIcon} />
              <Text style={styles.rating}>{vehicle?.rating || '4.2'}</Text>
            </View>
          </View>
          <Text style={styles.vehiclePrice}>
            ₹{vehicle?.price || (isBike ? '50' : '500')}
            <Text style={styles.priceUnit}>{isBike ? '/km' : '/hr'}</Text>
          </Text>
          {isBike && (
            <View style={styles.membersContainer}>
              <Image source={require('../assets/Icons/seat.png')} style={styles.seatIcon} />
              <Text style={styles.membersText}>{vehicle?.seats || '3'} {'Seats'}</Text>
            </View>
          )}
        </View>

        {/* Features */}
        {isBike ? <BikeFeatures /> : <CarFeatures />}

        {/* Owner */}
        <View style={styles.ownerSection}>
          <View style={styles.ownerInfo}>
            <Image source={ownerAvatar} style={styles.ownerAvatar} />
            <View style={styles.ownerDetails}>
              <Text style={styles.ownerName}>{ownerName}</Text>
              <Text style={styles.ownerLabel}>{'Owner'}</Text>
            </View>
          </View>
          <View style={styles.ownerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleChatPress}>
              <Image source={require('../assets/Icons/message.png')} style={styles.actionIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={handleCallPress}>
              <Image source={require('../assets/Icons/phone.png')} style={styles.actionIcon} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionTitle}>{'Description'}</Text>
          <Text style={styles.descriptionText}>
            {isBike
              ? 'This bike is in excellent condition with all features working perfectly.'
              : 'This car is well-maintained and perfect for your journey.'}
          </Text>
        </View>

        {/* Booking Note */}
        <View style={styles.bookingNote}>
          <Icon name="information-circle-outline" size={20} color="#FFA500" />
          <Text style={styles.noteText}>
            {isBike ? 'Please note: You will meet the bike owner at the pickup location.' : 'Please note: You will meet the car owner at the pickup location.'}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomActions, { paddingBottom: bottomPadding }]}>
        <Button
          title={'Chat'}
          onPress={handleChatPress}
          variant="outline"
          style={styles.flexButton}
          icon={<Image source={require('../assets/Icons/message1.png')} style={styles.buttonIcon} />}
        />
        <Button
          title={'Call'}
          onPress={handleCallPress}
          variant="filled"
          style={styles.flexButton}
          icon={<Image source={require('../assets/Icons/phone1.png')} style={styles.buttonIcon} />}
        />
      </View>

      {/* Popups */}
      <BookingConfirmationPopup
        visible={showBookingPopup}
        onClose={handlePopupClose}
        onConfirm={handlePopupConfirm}
        onCancel={handlePopupCancel}
        navigation={navigation}
      />
      <BookingSuccessPopup
        visible={showSuccessPopup}
        onClose={handleSuccessPopupClose}
        showDocuments={!isBike}
        title={isBike ? 'Your Bike booking is confirmed with the driver' : 'Your booking is confirmed with the owner'}
        message="Please meet at the pickup point and complete the process offline."
      />
      <FeedbackPopUp visible={showFeedbackPopup} onClose={handleRatingClose} onSubmit={handleRatingSubmit} driverName="Alex Johnson" />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    imageSection: {
        height: 280,
        position: 'relative',
    },
    vehicleImage: {
        width: width,
        height: 280,
        resizeMode: 'cover',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    indicatorContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        flexDirection: 'row',
    },
    indicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3,
    },
    activeIndicator: {
        backgroundColor: '#4A90E2',
    },
    inactiveIndicator: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    vehicleInfoSection: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    vehicleHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    vehicleName: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        flex: 1,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        backgroundColor: Colors.white,
    },
    starIcon: {
        width: 14,
        height: 14,
        marginRight: 4,
        tintColor: '#FFD700',
    },
    rating: {
        fontSize: 10,
        fontWeight: Typography.fontWeight.medium,
        color: '#FFD700',
    },
    vehiclePrice: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
    },
    priceUnit: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontWeight: Typography.fontWeight.regular,
    },
    membersContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        alignSelf: 'flex-start',
        marginTop: Spacing.sm,
    },
    seatIcon: {
        width: 20,
        height: 20,
        marginRight: Spacing.xs,
        tintColor: Colors.text.secondary,
    },
    membersText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontWeight: Typography.fontWeight.medium,
    },
    ownerSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        marginTop: Spacing.sm,
    },
    ownerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    ownerAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: Spacing.md,
    },
    ownerDetails: {
        flex: 1,
    },
    ownerName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    ownerLabel: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
    },
    ownerActions: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
    callButton: {
    },
    actionIcon: {
        width: 44,
        height: 44,
        resizeMode: 'contain',
    },
    descriptionSection: {
        paddingHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.md,
    },
    descriptionText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        lineHeight: 22,
    },
    bookingNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3CD',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFE69C',
        marginBottom: Spacing.xl,
    },
    noteIcon: {
        width: 20,
        height: 20,
        marginRight: Spacing.sm,
        tintColor: '#856404',
    },
    noteText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
        color: '#FFA500',
    },
    bottomSpacer: {
        height: 80,
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        gap: Spacing.sm,
    },
    buttonIcon: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
    flexButton: {
        flex: 1,
        marginBottom: 10
    },
});

export default BookNowScreen;