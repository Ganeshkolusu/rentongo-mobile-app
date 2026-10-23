// DateSelectionSection.jsx - FIXED VERSION
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  createNotAvailability,
  deleteNotAvailability,
  getVehicleAvailability
} from '../../api/services/availabilityService';
import { handleOwnerCancelBooking, CANCEL_REASON } from '../../utils/bookingFlowHelper';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

/**
 * DateSelectionSection - FIXED
 * Key fixes:
 * 1. Customer bookings ALWAYS show BLUE (#2196F3) - highest priority
 * 2. Owner unavailability shows RED (#F44336) - only when NOT booked
 * 3. Strike lines only on RED (owner unavailable), never on BLUE (booked)
 * 4. Delete mode only allows clicking RED dates, BLUE dates are non-interactive
 */
const DateSelectionSection = ({
  onDateChange,
  fromScreen,
  isModal,
  userRole = 'customer',
  vehicleId,
  vehicleType = 'Car',
  userId,
  editSlotId = null,
  onAvailabilityCreated,
  onAvailabilityUpdated,
  onAvailabilityDeleted,
  navigation,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Availability state
  const [unavailableDates, setUnavailableDates] = useState([]); // Owner marked unavailable
  const [bookedDates, setBookedDates] = useState([]); // Customer bookings
  const [isLoading, setIsLoading] = useState(false);

  // Only delete mode for owner
  const [deleteMode, setDeleteMode] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const years = Array.from({length: 15}, (_, i) => new Date().getFullYear() - 5 + i);

  // ---------- Resilient API wrappers ----------
  const safeDeleteNotAvailability = async (id) => {
    try {
      if (!id) {
        return { success: false, message: 'No slot ID provided' };
      }

      const res = await deleteNotAvailability(id);

      if (res && res.success === true) {
        return { success: true };
      }

      if (res && res.message && res.message.toLowerCase().includes('success')) {
        return { success: true };
      }

      if (res && !res.error && res.success !== false) {
        return { success: true };
      }

      return { success: false, message: res?.message || 'Delete failed' };
    } catch (err) {
      return { success: false, message: err?.message || 'Delete failed' };
    }
  };

  // ------------------------------------------

  useEffect(() => {
    if (vehicleId) {
      fetchAvailabilityData();
    }
  }, [vehicleId, userRole, currentMonth]);

  useEffect(() => {
    if (vehicleId && navigation) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchAvailabilityData();
      });
      return unsubscribe;
    }
  }, [vehicleId, navigation]);

  const fetchAvailabilityData = async () => {
    if (!vehicleId) return;
    setIsLoading(true);

    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const startDate = formatDateForAPI(startOfMonth);
      const endDate = formatDateForAPI(endOfMonth);

      const response = await getVehicleAvailability({
        VechileId: vehicleId,
        vechileType: vehicleType,
        startDate: startDate,
        endDate: endDate,
      });

      const naSlotMap = new Map();
      let allSlots = [];
      
      if (response?.availability && Array.isArray(response.availability)) {
        for (const dateEntry of response.availability) {
          if (dateEntry.slots && Array.isArray(dateEntry.slots)) {
            const slotsWithDate = dateEntry.slots.map(slot => ({
              ...slot,
              date: dateEntry.date,
              dateStatus: dateEntry.status,
            }));
            allSlots.push(...slotsWithDate);
          }
        }
      } else if (response?.data?.availability && Array.isArray(response.data.availability)) {
        for (const dateEntry of response.data.availability) {
          if (dateEntry.slots && Array.isArray(dateEntry.slots)) {
            const slotsWithDate = dateEntry.slots.map(slot => ({
              ...slot,
              date: dateEntry.date,
              dateStatus: dateEntry.status,
            }));
            allSlots.push(...slotsWithDate);
          }
        }
      } else if (response?.blockedSlots) {
        allSlots = response.blockedSlots;
      } else if (response?.data && Array.isArray(response.data)) {
        allSlots = response.data;
      } else if (Array.isArray(response)) {
        allSlots = response;
      }

      const booked = [];
      // Use a Map to group unavailable slots by their ID to reconstruct actual ranges
      const unavailableByIdMap = new Map();

      for (const slot of allSlots) {
        const slotVehicleId = slot.VechileId || slot.vehicleId || slot.vechileId || slot.VehicleId;
        if (slotVehicleId && String(slotVehicleId) !== String(vehicleId)) {
          continue;
        }

        const bookingStatus = slot.bookingStatus || slot.status || '';
        const statusLower = String(bookingStatus).toLowerCase();
        // Exclude completed, cancelled, and autocancelled bookings - these should show as available
        const isFinishedBooking = statusLower === 'cancelled' || statusLower === 'autocancelled' || statusLower === 'completed';

        // CRITICAL FIX: Properly identify booked vs unavailable slots
        // First check type field (most reliable)
        const slotType = slot.type ? String(slot.type).toLowerCase() : '';
        const isBookedSlot = !isFinishedBooking && (
          slotType === 'booking' ||  // API returns "Booking"
          slotType === 'booked' ||
          slot.isBooked === true ||
          slot.isBooked === 'true' ||
          !!slot.bookingId ||
          !!slot.booking_id ||
          (slot.status && String(slot.status).toLowerCase() === 'booked') ||
          (slot.status && String(slot.status).toLowerCase() === 'booking') ||
          (slot.slotStatus && String(slot.slotStatus).toLowerCase() === 'booked') ||
          (slot.dateStatus && String(slot.dateStatus).toLowerCase() === 'booked') ||
          (slot.status && String(slot.status).toLowerCase() === 'confirmed') ||
          (slot.status && String(slot.status).toLowerCase() === 'pending')
        );

        const isUnavailableSlot = !isBookedSlot && (
          slotType === 'notavailable' ||  // API returns "NotAvailable"
          slotType === 'not_available' ||
          slot.isNotAvailable === true ||
          slot.isNotAvailable === 'true' ||
          (slot.status && String(slot.status).toLowerCase() === 'notavailable') ||
          (slot.slotStatus && String(slot.slotStatus).toLowerCase() === 'notavailable') ||
          (slot.dateStatus && String(slot.dateStatus).toLowerCase() === 'unavailable') ||
          (slot.reason && String(slot.reason).toLowerCase().includes('not available'))
        );

        let dates = [];
        try {
          const from = slot.fromDate || slot.date;
          const to = slot.toDate || slot.date;
          if (!from) continue;
          dates = getDateRangeArray(from, to || from);
        } catch (err) {
          continue;
        }

        if (isBookedSlot) {
          const slotFromDate = slot.fromDate || slot.date;
          const slotToDate = slot.toDate || slot.date;
          booked.push({
            dates,
            fromDate: slotFromDate,
            toDate: slotToDate,
            customerName: slot.userName || slot.customerName || slot.user?.name || 'Customer',
            bookingId: slot.bookingId || slot.booking_id || slot.id || slot._id,
            status: slot.status || slot.bookingStatus || slot.type || 'Booked'
          });

        } else if (isUnavailableSlot) {
          // Try multiple ID field names - API might use different naming conventions
          let slotId = slot._id || slot.id || slot.slotId || slot.notAvailabilityId || slot.availabilityId || slot.notAvailableId;
          const slotFromDate = slot.fromDate || slot.date;
          const slotToDate = slot.toDate || slot.date;

          if (!slotId && naSlotMap.has(slotFromDate)) {
            const matchingSlots = naSlotMap.get(slotFromDate);
            const matchedSlot = matchingSlots.find(ns =>
              ns.fromDate === slotFromDate && ns.toDate === slotToDate
            ) || matchingSlots[0];

            if (matchedSlot) {
              slotId = matchedSlot.id || matchedSlot._id;
            }
          }

          // Group by slot ID to reconstruct actual ranges
          // API returns per-day data, so we need to find min/max dates for each ID
          if (slotId) {
            if (unavailableByIdMap.has(slotId)) {
              const existing = unavailableByIdMap.get(slotId);
              // Extend the range by tracking min fromDate and max toDate
              if (slotFromDate < existing.rangeFromDate) {
                existing.rangeFromDate = slotFromDate;
              }
              if (slotToDate > existing.rangeToDate) {
                existing.rangeToDate = slotToDate;
              }
              // Add dates to the combined dates array
              existing.dates.push(...dates);
            } else {
              unavailableByIdMap.set(slotId, {
                id: slotId,
                _id: slot._id || slotId,
                slotId: slot.slotId || slotId,
                notAvailabilityId: slot.notAvailabilityId || slotId,
                availabilityId: slot.availabilityId || slotId,
                dates: [...dates],
                fromDate: slotFromDate, // Individual slot date
                toDate: slotToDate,     // Individual slot date
                rangeFromDate: slotFromDate, // Actual range start (will be updated)
                rangeToDate: slotToDate,     // Actual range end (will be updated)
                reason: slot.reason || 'Owner unavailable',
                fromTime: slot.fromTime,
                toTime: slot.toTime
              });
            }
          } else {
            // No ID, treat as standalone
            unavailableByIdMap.set(`temp_${slotFromDate}_${Math.random()}`, {
              id: slotId,
              _id: slot._id || slotId,
              slotId: slot.slotId,
              notAvailabilityId: slot.notAvailabilityId,
              availabilityId: slot.availabilityId,
              dates,
              fromDate: slotFromDate,
              toDate: slotToDate,
              rangeFromDate: slotFromDate,
              rangeToDate: slotToDate,
              reason: slot.reason || 'Owner unavailable',
              fromTime: slot.fromTime,
              toTime: slot.toTime
            });
          }
        }
      }

      // Convert Map to array with reconstructed ranges
      const unavailable = Array.from(unavailableByIdMap.values()).map(slot => ({
        id: slot.id,
        _id: slot._id,
        slotId: slot.slotId,
        notAvailabilityId: slot.notAvailabilityId,
        availabilityId: slot.availabilityId,
        dates: slot.dates,
        fromDate: slot.rangeFromDate, // Use the actual range start
        toDate: slot.rangeToDate,     // Use the actual range end
        reason: slot.reason,
        fromTime: slot.fromTime,
        toTime: slot.toTime
      }));

      setUnavailableDates(prev => {
        const existingWithIds = new Map();
        prev.forEach(slot => {
          const key = `${slot.fromDate}-${slot.toDate}`;
          existingWithIds.set(key, {
            id: slot.id,
            _id: slot._id,
            slotId: slot.slotId,
            notAvailabilityId: slot.notAvailabilityId,
            availabilityId: slot.availabilityId,
            dates: slot.dates,
            fromDate: slot.fromDate,
            toDate: slot.toDate,
            reason: slot.reason,
            fromTime: slot.fromTime,
            toTime: slot.toTime
          });
        });

        const merged = unavailable.map(slot => {
          const key = `${slot.fromDate}-${slot.toDate}`;
          const existing = existingWithIds.get(key);

          if (!slot.id && !slot._id && existing && (existing.id || existing._id)) {
            return {
              ...slot,
              id: existing.id || slot.id,
              _id: existing._id || slot._id,
            };
          }
          return slot;
        });

        existingWithIds.forEach((existingSlot, key) => {
          const inMerged = merged.some(m => `${m.fromDate}-${m.toDate}` === key);
          if (!inMerged && (existingSlot.id || existingSlot._id)) {
            merged.push(existingSlot);
          }
        });

        return merged;
      });
      setBookedDates(booked);
    } catch (error) {
      setUnavailableDates([]);
      setBookedDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRangeArray = (startDateStr, endDateStr) => {
    const dates = [];
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);

    const start = new Date(startYear, startMonth - 1, startDay, 12, 0, 0);
    const end = new Date(endYear, endMonth - 1, endDay, 12, 0, 0);
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  };

  const isDateUnavailable = (date) => {
    const dateStr = formatDateForAPI(date);

    const booked = bookedDates.some(bookingSlot =>
      dateStr >= bookingSlot.fromDate && dateStr <= bookingSlot.toDate
    );
    if (booked) return true;

    return unavailableDates.some(slot => {
      return dateStr >= slot.fromDate && dateStr <= slot.toDate;
    });
  };

  // FIXED: Check if date is booked by customer - HIGHEST PRIORITY
  const isDateBooked = (date) => {
    const dateStr = formatDateForAPI(date);
    return bookedDates.some(bookingSlot => {
      return dateStr >= bookingSlot.fromDate && dateStr <= bookingSlot.toDate;
    });
  };

  // FIXED: Check if date is marked unavailable by owner - ONLY if NOT booked
  const isDateOwnerUnavailable = (date) => {
    const dateStr = formatDateForAPI(date);
    
    // First check if it's booked - if yes, it's NOT owner unavailable
    const isBooked = bookedDates.some(bookingSlot => {
      return dateStr >= bookingSlot.fromDate && dateStr <= bookingSlot.toDate;
    });
    
    if (isBooked) return false; // Booked takes priority
    
    // Only then check unavailable
    return unavailableDates.some(slot => {
      return dateStr >= slot.fromDate && dateStr <= slot.toDate;
    });
  };

  const getBookingSlotForDate = (date) => {
    const dateStr = formatDateForAPI(date);
    return bookedDates.find(bookingSlot =>
      dateStr >= bookingSlot.fromDate && dateStr <= bookingSlot.toDate
    );
  };

  const getUnavailableSlotForDate = (date) => {
    const dateStr = formatDateForAPI(date);
    
    // Don't return unavailable slot if date is booked
    const isBooked = bookedDates.some(bookingSlot =>
      dateStr >= bookingSlot.fromDate && dateStr <= bookingSlot.toDate
    );
    
    if (isBooked) return null;
    
    return unavailableDates.find(slot => {
      return dateStr >= slot.fromDate && dateStr <= slot.toDate;
    });
  };

  const checkRangeHasUnavailableDates = (startDate, endDate) => {
    const dates = getDateRangeArray(formatDateForAPI(startDate), formatDateForAPI(endDate));
    return dates.some(date => isDateUnavailable(date));
  };

  const handleDeleteIconPress = () => {
    if (deleteMode) {
      setDeleteMode(false);
    } else {
      setDeleteMode(true);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
    }
  };

  /**
   * Handle canceling a customer booking (owner action)
   *
   * FLOW:
   * 1. Owner taps on GREEN (booked) date in delete mode
   * 2. Confirmation dialog shows customer name and booking dates
   * 3. Owner selects cancellation reason
   * 4. API call cancels the booking
   * 5. Calendar refreshes → GREEN dates become AVAILABLE (color removed)
   * 6. Push notification sent to customer: "Your booking has been cancelled..."
   *
   * @param {Object} bookingSlot - The booking slot data containing customer info and dates
   */
  const handleCancelBooking = async (bookingSlot) => {
    if (!bookingSlot) {
      Alert.alert('Error', 'No booking found for this date');
      return;
    }

    const bookingId = bookingSlot.bookingId || bookingSlot.booking_id || bookingSlot.id || bookingSlot._id;
    const customerName = bookingSlot.customerName || 'Customer';
    const fromDate = bookingSlot.fromDate || 'selected date';
    const toDate = bookingSlot.toDate || fromDate;

    Alert.alert(
      'Cancel Customer Booking',
      `This date is booked by ${customerName}.\n\nFrom: ${fromDate}\nTo: ${toDate}\n\nDo you want to cancel this booking? The customer will be notified.`,
      [
        { text: 'No, Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel Booking',
          style: 'destructive',
          onPress: () => showCancelReasonDialog(bookingSlot, bookingId)
        }
      ]
    );
  };

  /**
   * Show reason selection dialog for booking cancellation
   * Reasons determine the notification message sent to customer:
   * - "I am unavailable" → "The owner is no longer available for the selected dates."
   * - "Vehicle issue" → "The vehicle has encountered an issue and is unavailable."
   * - "Other reason" → "The owner has cancelled the booking."
   */
  const showCancelReasonDialog = (bookingSlot, bookingId) => {
    Alert.alert(
      'Select Reason',
      'Why are you cancelling this booking?',
      [
        {
          text: 'I am unavailable',
          onPress: () => processCancelBooking(bookingSlot, bookingId, CANCEL_REASON.OWNER_UNAVAILABLE)
        },
        {
          text: 'Vehicle issue',
          onPress: () => processCancelBooking(bookingSlot, bookingId, CANCEL_REASON.VEHICLE_ISSUE)
        },
        {
          text: 'Other reason',
          onPress: () => processCancelBooking(bookingSlot, bookingId, CANCEL_REASON.OWNER_REQUEST)
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  /**
   * Process the booking cancellation - Main action handler
   *
   * WHAT HAPPENS:
   * 1. Calls handleOwnerCancelBooking() from bookingFlowHelper.js
   *    - Updates booking status to 'Cancelled' in database
   *    - Deletes the availability block (frees up the dates)
   *    - Sends push notification to customer with cancellation reason
   *
   * 2. On success:
   *    - Refreshes calendar data via fetchAvailabilityData()
   *    - GREEN (booked) dates → Become AVAILABLE (no color/white)
   *    - Customer receives notification: "Booking Cancelled ❌"
   *
   * @param {Object} bookingSlot - Booking data with customer ID and dates
   * @param {string} bookingId - The booking ID to cancel
   * @param {string} reason - Cancellation reason (owner_unavailable/vehicle_issue/owner_request)
   */
  const processCancelBooking = async (bookingSlot, bookingId, reason) => {
    Animated.timing(fadeAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }).start();
    setIsLoading(true);

    try {
      const result = await handleOwnerCancelBooking({
        bookingId: bookingId,
        vehicleId: vehicleId,
        customerId: bookingSlot.customerId || bookingSlot.userId || bookingSlot.user_id,
        availabilityId: bookingSlot.availabilityId,
        reason: reason,
        fromDate: bookingSlot.fromDate
      });

      if (result.success) {
        /**
         * SUCCESS - What happens now:
         * 1. fetchAvailabilityData() reloads calendar slots from API
         * 2. The cancelled booking no longer returns as type:"Booking"
         * 3. Calendar re-renders → GREEN dates become WHITE (available)
         * 4. Customer already received push notification via handleOwnerCancelBooking()
         *    Title: "Booking Cancelled ❌"
         *    Body: "The owner is no longer available..." (based on reason)
         */
        await fetchAvailabilityData();
        setDeleteMode(false);
        Alert.alert(
          'Booking Cancelled',
          'The booking has been cancelled and the customer has been notified. The dates are now available.'
        );
      } else {
        Alert.alert('Error', result.message || 'Failed to cancel booking');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  /**
   * Handle deleting unavailable slot - supports PARTIAL deletion
   *
   * SCENARIO: Owner marked Dec 5-9 as unavailable (5 days)
   * Owner wants to delete only Dec 6 and Dec 8 (make them available again)
   *
   * OPTIONS shown to owner:
   * 1. "Delete only [clicked date]" - Splits the range, keeps other dates unavailable
   * 2. "Delete entire range" - Removes all dates in the range
   *
   * HOW PARTIAL DELETE WORKS:
   * - Original range: Dec 5-9
   * - Owner clicks Dec 6 and selects "Delete only this date"
   * - System: Deletes Dec 5-9, Creates Dec 5-5, Creates Dec 7-9
   * - Result: Dec 6 becomes available, Dec 5,7,8,9 remain unavailable
   */
  const handleDeleteSlot = async (slot, clickedDate = null) => {
    if (!slot) {
      Alert.alert('Error', 'No slot found to delete for this date');
      return;
    }

    // Try multiple ID fields - API might use different field names
    let slotId = slot.id || slot._id || slot.slotId || slot.notAvailabilityId || slot.availabilityId;

    if (!slotId) {
      Alert.alert(
        'Cannot Delete',
        `Unable to find the slot ID for dates ${slot.fromDate} to ${slot.toDate}.\n\nThis could be because:\n1. The slot was created in this session and needs a refresh\n2. The backend API doesn't return slot IDs\n\nTry refreshing the calendar or contact support.`
      );
      return;
    }

    const fromDate = slot.fromDate;
    const toDate = slot.toDate || slot.fromDate;
    const isMultiDayRange = fromDate !== toDate;
    const clickedDateStr = clickedDate ? formatDateForAPI(clickedDate) : null;

    // If it's a multi-day range and user clicked a specific date, show options
    if (isMultiDayRange && clickedDateStr) {
      Alert.alert(
        'Delete Options',
        `This date is part of unavailable range:\n${fromDate} to ${toDate}\n\nWhat would you like to do?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: `Delete only ${clickedDateStr}`,
            onPress: () => processPartialDelete(slot, slotId, clickedDateStr, fromDate, toDate)
          },
          {
            text: 'Delete entire range',
            style: 'destructive',
            onPress: () => processFullDelete(slotId)
          }
        ]
      );
    } else {
      // Single day or full range delete
      Alert.alert(
        'Confirm Delete',
        `Delete not-available period${isMultiDayRange ? ` from ${fromDate} to ${toDate}` : ` for ${fromDate}`}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => processFullDelete(slotId)
          }
        ]
      );
    }
  };

  /**
   * Process full deletion of an unavailable slot
   */
  const processFullDelete = async (slotId) => {
    Animated.timing(fadeAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }).start();
    setIsLoading(true);

    try {
      const response = await safeDeleteNotAvailability(slotId);

      if (response && response.success) {
        await fetchAvailabilityData();
        onAvailabilityDeleted && onAvailabilityDeleted(slotId);
        setDeleteMode(false);
        Alert.alert(
          'Success',
          'Not-available period deleted successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                // Go back and refresh the calendar
                if (navigation && navigation.goBack) {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response?.message || 'Failed to delete slot');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while deleting');
    } finally {
      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  /**
   * Process partial deletion - delete one date from a range
   *
   * Example: Range Dec 5-9, delete Dec 7
   * 1. Delete original range (Dec 5-9)
   * 2. Create new range: Dec 5-6 (before deleted date)
   * 3. Create new range: Dec 8-9 (after deleted date)
   * Result: Dec 7 is now available, Dec 5,6,8,9 remain unavailable
   */
  const processPartialDelete = async (slot, slotId, deletedDate, fromDate, toDate) => {
    Animated.timing(fadeAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }).start();
    setIsLoading(true);

    try {
      // Step 1: Delete the original range
      const deleteResponse = await safeDeleteNotAvailability(slotId);

      if (!deleteResponse || !deleteResponse.success) {
        throw new Error(deleteResponse?.message || 'Failed to delete original range');
      }

      // Step 2: Calculate new ranges
      const prevDay = getPreviousDay(deletedDate);
      const nextDay = getNextDay(deletedDate);

      // Step 3: Create range BEFORE deleted date (if exists)
      if (prevDay >= fromDate) {
        await createNotAvailability({
          userId: userId,
          vechileType: vehicleType,
          VechileId: vehicleId,
          fromDate: fromDate,
          toDate: prevDay,
          fromTime: slot.fromTime || '00:00',
          toTime: slot.toTime || '23:59',
          isNotAvailable: true,
          reason: slot.reason || 'Owner unavailable'
        });
      }

      // Step 4: Create range AFTER deleted date (if exists)
      if (nextDay <= toDate) {
        await createNotAvailability({
          userId: userId,
          vechileType: vehicleType,
          VechileId: vehicleId,
          fromDate: nextDay,
          toDate: toDate,
          fromTime: slot.fromTime || '00:00',
          toTime: slot.toTime || '23:59',
          isNotAvailable: true,
          reason: slot.reason || 'Owner unavailable'
        });
      }

      // Step 5: Refresh calendar
      await fetchAvailabilityData();
      onAvailabilityDeleted && onAvailabilityDeleted(slotId);
      setDeleteMode(false);
      Alert.alert(
        'Success',
        `${deletedDate} is now available. Other dates remain unavailable.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Go back and refresh the calendar
              if (navigation && navigation.goBack) {
                navigation.goBack();
              }
            }
          }
        ]
      );

    } catch (err) {
      Alert.alert('Error', err.message || 'An unexpected error occurred');
      // Refresh to show current state
      await fetchAvailabilityData();
    } finally {
      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  };

  /**
   * Helper: Get previous day in YYYY-MM-DD format
   */
  const getPreviousDay = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    return formatDateForAPI(date);
  };

  /**
   * Helper: Get next day in YYYY-MM-DD format
   */
  const getNextDay = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + 1);
    return formatDateForAPI(date);
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const adjustment = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - adjustment);

    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return days;
  };

  const navigateMonth = (direction) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
  };

  const isDateSelected = (date) => {
    if (!selectedStartDate) return false;
    return formatDateForAPI(date) === formatDateForAPI(selectedStartDate);
  };

  const isDateInRange = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const dateStr = formatDateForAPI(date);
    const startStr = formatDateForAPI(selectedStartDate);
    const endStr = formatDateForAPI(selectedEndDate);
    return dateStr > startStr && dateStr < endStr;
  };

  const isDateStartOrEnd = (date) => {
    if (!selectedStartDate && !selectedEndDate) return false;
    const dateStr = formatDateForAPI(date);
    const isStart = selectedStartDate && dateStr === formatDateForAPI(selectedStartDate);
    const isEnd = selectedEndDate && dateStr === formatDateForAPI(selectedEndDate);
    return isStart || isEnd;
  };

  const handleMonthYearSelect = (monthIndex, year) => {
    setCurrentMonth(new Date(year, monthIndex, 1));
    setShowMonthYearPicker(false);
  };

  const calendarDays = generateCalendarDays();

  const handleDateSelect = (date) => {
    if (isProcessing) return;
    if (date.getMonth() !== currentMonth.getMonth()) return;

    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
    const isPastDate = normalizedDate < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 12, 0, 0);

    if (isPastDate) return;

    // FIXED: Check booked status first (highest priority)
    const isBooked = isDateBooked(normalizedDate);
    const isOwnerUnavail = isDateOwnerUnavailable(normalizedDate);

    if (userRole === 'customer' && (isBooked || isOwnerUnavail)) {
      const slot = isBooked ? getBookingSlotForDate(normalizedDate) : getUnavailableSlotForDate(normalizedDate);
      const reason = slot ? (slot.reason || 'Booked by customer') : 'Not available';
      Alert.alert('Date Unavailable', `This date is not available for booking.\n\nReason: ${reason}`);
      return;
    }

    /**
     * OWNER DELETE MODE - Handle clicking on dates
     *
     * GREEN (Booked) dates:
     * - Owner can CANCEL the booking
     * - Shows confirmation → reason selection → cancels booking
     * - Result: GREEN → WHITE (available), customer notified
     *
     * RED (Unavailable) dates:
     * - Owner can DELETE the unavailable period
     * - Shows confirmation → deletes slot
     * - Result: RED → WHITE (available)
     */
    if (userRole === 'owner' && deleteMode) {
      // GREEN dates - Owner can cancel customer booking
      // This will: change color GREEN→WHITE, notify customer
      if (isBooked) {
        const bookingSlot = getBookingSlotForDate(normalizedDate);
        if (bookingSlot) {
          handleCancelBooking(bookingSlot);
        } else {
          Alert.alert('Error', 'Could not find booking details for this date.');
        }
        return;
      }

      // RED dates - Owner can delete their own unavailable period
      // Pass normalizedDate to support partial deletion from a range
      const slot = getUnavailableSlotForDate(normalizedDate);
      if (slot) {
        handleDeleteSlot(slot, normalizedDate);
      } else {
        Alert.alert('No Slot', 'No owner-marked unavailable slot found for this date.');
      }
      return;
    }

    // Normal selection mode
    setIsProcessing(true);
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(normalizedDate);
      setSelectedEndDate(null);
      onDateChange && onDateChange({ fromDate: normalizedDate, toDate: null });
    } else {
      let from = selectedStartDate;
      let to = normalizedDate;
      
      if (normalizedDate < selectedStartDate) {
        from = normalizedDate;
        to = selectedStartDate;
      }
      
      if (userRole === 'customer') {
        const hasUnavailable = checkRangeHasUnavailableDates(from, to);
        if (hasUnavailable) {
          Alert.alert('Invalid Range', 'The selected range contains unavailable dates. Please select another range.');
          setSelectedStartDate(null);
          setSelectedEndDate(null);
          setTimeout(() => setIsProcessing(false), 120);
          return;
        }
      }
      
      setSelectedStartDate(from);
      setSelectedEndDate(to);
      onDateChange && onDateChange({ fromDate: from, toDate: to });
    }
    
    setTimeout(() => setIsProcessing(false), 120);
  };

  // ---------- Render ----------
  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.gradient?.primary?.[0] || Colors.text.primary} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      )}

      {!isModal && (
        <View style={styles.headerRow}>
          <Text style={styles.sectionTitle}>
            {fromScreen === 'availability' ? 'Select Not Availability Date' : 'Select Date'}
          </Text>
        </View>
      )}

      <View style={[styles.dateButtonsRow, isModal && styles.modalDateButtonsRow]}>
        <View style={[styles.dateButton, isModal && styles.modalDateButton]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="calendar-outline" size={18} color={Colors.text.secondary} style={styles.calendarIcon}/>
            <Text style={[styles.dateLabel, isModal && styles.modalDateLabel]}>From Date</Text>
          </View>
          <Text style={[styles.dateValue, isModal && styles.modalDateValue]}>
            {selectedStartDate
              ? `${selectedStartDate.getDate()} ${monthNames[selectedStartDate.getMonth()]} ${selectedStartDate.getFullYear()}`
              : 'Select Date'}
          </Text>
        </View>

        <View style={[styles.dateButton, isModal && styles.modalDateButton]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="calendar-outline" size={18} color={Colors.text.secondary} style={styles.calendarIcon}/>
            <Text style={[styles.dateLabel, isModal && styles.modalDateLabel]}>To Date</Text>
          </View>
          <Text style={[styles.dateValue, isModal && styles.modalDateValue]}>
            {selectedEndDate
              ? `${selectedEndDate.getDate()} ${monthNames[selectedEndDate.getMonth()]} ${selectedEndDate.getFullYear()}`
              : 'Select Date'}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.calendarContainer, isModal && styles.modalCalendarContainer, { opacity: fadeAnim }]}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => navigateMonth(-1)} hitSlop={10}>
            <Icon name="chevron-back" size={20} color={Colors.text.primary}/>
          </Pressable>
          
          <View style={{ alignItems: 'center', flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={() => setShowMonthYearPicker(prev => !prev)} hitSlop={10}>
                <Text style={styles.monthText}>{monthNames[currentMonth.getMonth()]}</Text>
              </Pressable>
              <Pressable onPress={() => setShowMonthYearPicker(prev => !prev)} hitSlop={10}>
                <Text style={[styles.monthText, { marginLeft: 5 }]}>{currentMonth.getFullYear()}</Text>
              </Pressable>
              <Icon name={showMonthYearPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.text.primary}/>
            </View>
            
            {showMonthYearPicker && (
              <View style={styles.inlinePickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inlineMonthRow} nestedScrollEnabled>
                  {monthNames.map((m,i) => (
                    <Pressable 
                      key={m} 
                      style={[styles.inlineMonthItem, currentMonth.getMonth() === i && styles.activeMonthInline]} 
                      onPress={() => handleMonthYearSelect(i, currentMonth.getFullYear())}
                    >
                      <Text style={[styles.inlineMonthText, currentMonth.getMonth() === i && styles.activeMonthInlineText]}>{m}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.inlineYearRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
                    {years.map((y) => (
                      <Pressable 
                        key={y} 
                        style={[styles.inlineYearItem, currentMonth.getFullYear() === y && styles.activeYearInline]} 
                        onPress={() => handleMonthYearSelect(currentMonth.getMonth(), y)}
                      >
                        <Text style={[styles.inlineYearText, currentMonth.getFullYear() === y && styles.activeYearInlineText]}>{y}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </View>

          {userRole === 'owner' && (
            <View style={styles.inlineIconsContainer}>
              <Pressable onPress={handleDeleteIconPress} hitSlop={10} style={[styles.inlineIconButton, deleteMode && styles.activeInlineIcon]}>
                <Icon name="trash-outline" size={24} color={deleteMode ? '#F44336' : '#757575'} />
              </Pressable>
            </View>
          )}

          <Pressable onPress={() => navigateMonth(1)} hitSlop={10} style={{ marginLeft: 8 }}>
            <Icon name="chevron-forward" size={20} color={Colors.text.primary}/>
          </Pressable>
        </View>

        <View style={styles.weekDaysHeader}>
          {weekDays.map(day => <Text key={day} style={styles.weekDayText}>{day}</Text>)}
        </View>

        {/* FIXED Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isSelected = isDateSelected(date);
            const isStartOrEnd = isDateStartOrEnd(date);
            const isInRange = isDateInRange(date);
            const isPastDate = date < new Date(new Date().setHours(0,0,0,0));

            // FIXED: Priority system - Booked (BLUE) ALWAYS wins over Owner Unavailable (RED)
            const isBooked = isDateBooked(date);
            const isOwnerUnavail = isDateOwnerUnavailable(date); // This now checks booked first

            const showAsBooked = isBooked && isCurrentMonth;
            const showAsOwnerUnavailable = isOwnerUnavail && isCurrentMonth; // Will be false if booked

            // Delete target: Owner unavailable (RED) or Booked (GREEN) dates in delete mode
            const showAsDeleteTarget = deleteMode && (showAsOwnerUnavailable || showAsBooked) && !isPastDate;

            // Disable conditions - Allow owner to click both booked and unavailable dates in delete mode
            const isDisabled = isPastDate ||
                               (userRole === 'customer' && (showAsBooked || showAsOwnerUnavailable));

            return (
              <Pressable
                key={index}
                onPress={() => handleDateSelect(date)}
                style={({ pressed }) => [
                  styles.dayCell,
                  // Delete mode styling (RED only)
                  showAsDeleteTarget && styles.deleteDayCell,
                  // Normal selection (only when not booked/unavailable)
                  !showAsDeleteTarget && !showAsBooked && !showAsOwnerUnavailable && isStartOrEnd && styles.selectedDayCell,
                  !showAsDeleteTarget && !showAsBooked && !showAsOwnerUnavailable && isInRange && !isStartOrEnd && styles.rangeDayCell,
                  // BLUE for booked (HIGHEST PRIORITY)
                  showAsBooked && styles.bookedDayCell,
                  // RED for owner unavailable (LOWER PRIORITY - only when not booked)
                  showAsOwnerUnavailable && styles.unavailableDayCell,
                  isPastDate && styles.pastDayCell,
                  { position: 'relative' },
                  pressed && { opacity: 0.7 },
                ]}
                disabled={isDisabled}
                hitSlop={8}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  showAsDeleteTarget && styles.deleteDayText,
                  !showAsDeleteTarget && !showAsBooked && !showAsOwnerUnavailable && isStartOrEnd && styles.selectedDayText,
                  !showAsDeleteTarget && !showAsBooked && !showAsOwnerUnavailable && isInRange && !isStartOrEnd && styles.rangeDayText,
                  // Customer booked dates text style (BLUE) - highest priority
                  showAsBooked && styles.bookedDayText,
                  // Owner unavailable dates text style (RED) - only when not booked
                  showAsOwnerUnavailable && styles.unavailableDayText,
                  isPastDate && styles.pastDayText,
                ]}>
                  {date.getDate()}
                </Text>

                {/* Strike-line for owner unavailable dates - RED */}
                {showAsOwnerUnavailable && (
                  <View pointerEvents="none" style={[styles.strikeLine, styles.strikeLineRed]} />
                )}

                {/* Strike-line for customer booked dates - BLUE */}
                {showAsBooked && (
                  <View pointerEvents="none" style={[styles.strikeLine, styles.strikeLineBlue]} />
                )}

                {/* Delete icon for unavailable (RED) dates only */}
                {showAsDeleteTarget && showAsOwnerUnavailable && (
                  <View style={styles.deleteIndicator}>
                    <Icon name="trash" size={10} color="#F44336" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.availableBox]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          {userRole === 'owner' ? (
            <>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.bookedBox]} />
                <Text style={styles.legendText}>Booked</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, styles.unavailableBox]} />
                <Text style={styles.legendText}>Not Available</Text>
              </View>
            </>
          ) : (
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.unavailableBox]} />
              <Text style={styles.legendText}>Not Available</Text>
            </View>
          )}
          {userRole === 'customer' && (
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, styles.selectedBox]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
          )}
        </View>
      </Animated.View>

      {/* Summary */}
      {selectedStartDate && selectedEndDate && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Selected Dates</Text>
          <Text style={styles.summaryText}>From: {formatDateForAPI(selectedStartDate)}</Text>
          <Text style={styles.summaryText}>To: {formatDateForAPI(selectedEndDate)}</Text>
        </View>
      )}
    </View>
  );
};

export default DateSelectionSection;

const styles = StyleSheet.create({
  container: { 
    paddingHorizontal: Spacing.lg 
  },
  modalContainer: { 
    paddingHorizontal: Spacing.md 
  },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.md 
  },
  sectionTitle: { 
    fontSize: Typography.fontSize.lg, 
    fontFamily: Typography.fontFamily.bold, 
    color: Colors.black 
  },
  dateButtonsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md
  },
  dateButton: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 70
  },
  dateLabel: { 
    fontSize: Typography.fontSize.sm, 
    color: Colors.text.secondary, 
    fontFamily: Typography.fontFamily.regular, 
    marginLeft: Spacing.sm 
  },
  dateValue: { 
    fontSize: Typography.fontSize.md, 
    fontFamily: Typography.fontFamily.bold, 
    color: Colors.black, 
    marginTop: 4 
  },
  calendarContainer: { 
    backgroundColor: Colors.white, 
    borderRadius: BorderRadius.lg, 
    padding: 10, 
    shadowColor: Colors.black, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 3 
  },
  monthHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8 
  },
  monthText: { 
    fontSize: Typography.fontSize.lg, 
    fontFamily: Typography.fontFamily.bold, 
    color: Colors.black 
  },
  inlineIconsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    marginRight: 8 
  },
  inlineIconButton: { 
    padding: 4, 
    borderRadius: 20, 
    backgroundColor: 'transparent' 
  },
  activeInlineIcon: { 
    backgroundColor: 'rgba(244,67,54,0.08)' 
  },
  weekDaysHeader: { 
    flexDirection: 'row', 
    marginBottom: 4 
  },
  weekDayText: { 
    flex: 1, 
    textAlign: 'center', 
    fontSize: 12, 
    color: Colors.text.secondary, 
    fontFamily: Typography.fontFamily.medium 
  },
  calendarGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap' 
  },
  dayCell: { 
    width: '14.28%', 
    height: 34, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderRadius: 6, 
    marginVertical: 1 
  },
  selectedDayCell: { 
    backgroundColor: Colors.black 
  },
  rangeDayCell: { 
    backgroundColor: '#e0e0e0' 
  },
  deleteDayCell: { 
    backgroundColor: '#fff0f0', 
    borderWidth: 1, 
    borderColor: '#ffcdd2' 
  },
  // Customer booked dates - GREEN color scheme - HIGHEST PRIORITY
  bookedDayCell: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#4CAF50'
  },
  // Owner unavailable dates - RED color scheme (#F44336) - LOWER PRIORITY
  unavailableDayCell: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a'
  },
  pastDayCell: {
    opacity: 0.3
  },
  dayText: { 
    fontSize: 13, 
    color: Colors.text.primary, 
    fontFamily: Typography.fontFamily.regular 
  },
  otherMonthText: { 
    color: Colors.text.light 
  },
  selectedDayText: { 
    color: Colors.white, 
    fontWeight: '700' 
  },
  rangeDayText: {
    color: Colors.text.primary,
    fontWeight: '500'
  },
  deleteDayText: { 
    color: '#c62828', 
    fontWeight: '700' 
  },
  // Customer booked dates text - GREEN - HIGHEST PRIORITY
  bookedDayText: {
    color: '#2E7D32',
    fontWeight: '700'
  },
  // Owner unavailable dates text - RED (#F44336) - LOWER PRIORITY
  unavailableDayText: {
    color: '#c62828',
    fontWeight: '600'
  },
  pastDayText: {
    color: '#ccc'
  },
  inlinePickerContainer: { 
    marginTop: 6, 
    backgroundColor: '#f8f8f8', 
    borderRadius: 8, 
    padding: 8, 
    width: 260, 
    alignItems: 'center' 
  },
  inlineMonthRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 5 
  },
  inlineMonthItem: { 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 6, 
    marginHorizontal: 3, 
    backgroundColor: '#eee' 
  },
  inlineMonthText: { 
    fontSize: 13, 
    color: Colors.text.primary 
  },
  activeMonthInline: { 
    backgroundColor: Colors.gradient?.primary?.[0] || '#4CAF50' 
  },
  activeMonthInlineText: { 
    color: Colors.white, 
    fontWeight: '700' 
  },
  inlineYearRow: { 
    flexDirection: 'row', 
    marginTop: 6 
  },
  inlineYearItem: { 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 6, 
    marginHorizontal: 4, 
    backgroundColor: '#eee' 
  },
  inlineYearText: { 
    fontSize: 13, 
    color: Colors.text.primary 
  },
  activeYearInline: { 
    backgroundColor: Colors.gradient?.primary?.[0] || '#4CAF50' 
  },
  activeYearInlineText: { 
    color: Colors.white, 
    fontWeight: '700' 
  },
  scrollContent: { 
    flexDirection: 'row' 
  },
  loadingOverlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    backgroundColor: 'rgba(255,255,255,0.9)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 999 
  },
  loadingText: { 
    marginTop: Spacing.sm, 
    fontSize: Typography.fontSize.sm, 
    color: Colors.text.secondary, 
    fontFamily: Typography.fontFamily.medium 
  },
  legendContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border, 
    gap: 16,
    flexWrap: 'wrap'
  },
  legendItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6 
  },
  legendBox: { 
    width: 16, 
    height: 16, 
    borderRadius: 4 
  },
  availableBox: { 
    backgroundColor: Colors.white, 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  // Customer booked legend - GREEN
  bookedBox: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1.5,
    borderColor: '#4CAF50'
  },
  // Owner unavailable legend - RED (#F44336)
  unavailableBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ef9a9a'
  },
  selectedBox: {
    backgroundColor: Colors.black
  },
  legendText: { 
    fontSize: 11, 
    color: Colors.text.secondary, 
    fontFamily: Typography.fontFamily.regular 
  },
  summaryContainer: { 
    backgroundColor: '#E8F5E9', 
    padding: Spacing.md, 
    borderRadius: BorderRadius.md, 
    marginTop: Spacing.md, 
    borderLeftWidth: 3, 
    borderLeftColor: '#4CAF50' 
  },
  summaryTitle: { 
    fontSize: Typography.fontSize.md, 
    fontFamily: Typography.fontFamily.bold, 
    color: '#2E7D32', 
    marginBottom: Spacing.sm 
  },
  summaryText: { 
    fontSize: Typography.fontSize.sm, 
    color: '#388E3C', 
    fontFamily: Typography.fontFamily.regular 
  },
  modalDateButtonsRow: { 
    paddingHorizontal: Spacing.sm 
  },
  modalDateButton: { 
    minHeight: 60 
  },
  modalDateLabel: { 
    fontSize: Typography.fontSize.xs 
  },
  modalDateValue: { 
    fontSize: Typography.fontSize.sm 
  },
  modalCalendarContainer: { 
    marginHorizontal: Spacing.sm 
  },
  calendarIcon: { 
    marginRight: 2 
  },
  deleteIndicator: { 
    position: 'absolute', 
    top: 2, 
    right: 6, 
    backgroundColor: 'transparent' 
  },
  // Strike line for owner unavailable dates (not on booked dates) - RED color (#F44336)
  strikeLine: {
    position: 'absolute',
    width: '80%',
    height: Platform.OS === 'ios' ? 2 : 2.5,
    backgroundColor: '#c62828',
    top: '50%',
    left: '10%',
    transform: [{ translateY: -1 }],
    zIndex: 2,
  },
  // Strike line for booked dates - GREEN color
  strikeLineBlue: {
    backgroundColor: '#2E7D32',
  },
  // Strike line for unavailable dates - RED color (#F44336)
  strikeLineRed: {
    backgroundColor: '#c62828',
  },
});