// DateSelectionSection.jsx - COMPLETE FIXED VERSION
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
  getNotAvailabilityById,
  getVehicleAvailability,
  updateNotAvailability,
} from '../../api/services/availabilityService';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

/**
 * DateSelectionSection
 * - owner/customer mode
 * - inline edit & delete not-availability slots
 * - FIXED: Complete date range inclusion (fromDate to toDate inclusive)
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
  const [unavailableDates, setUnavailableDates] = useState([]); // items: {id, fromDate, toDate, reason}
  const [bookedDates, setBookedDates] = useState([]); // Date strings in YYYY-MM-DD format
  const [isLoading, setIsLoading] = useState(false);

  // Inline editing state
  const [editMode, setEditMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedSlotForEdit, setSelectedSlotForEdit] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(1));

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const years = Array.from({length: 15}, (_, i) => new Date().getFullYear() - 5 + i);

  // ========== FIXED: Date formatting and range generation ==========

  /**
   * Format date to YYYY-MM-DD (no timezone conversion)
   */
  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  /**
   * Parse YYYY-MM-DD string to Date (no timezone issues)
   */
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  /**
   * Generate complete date range INCLUDING both start and end dates
   * Returns array of date strings in YYYY-MM-DD format
   */
  const generateDateRange = (startDateStr, endDateStr) => {
    const dates = [];
    const start = parseDate(startDateStr);
    const end = parseDate(endDateStr);

    if (!start || !end) return dates;

    const current = new Date(start);

    // CRITICAL: Include BOTH start and end dates (<=)
    while (current <= end) {
      dates.push(formatDateForAPI(current));
      current.setDate(current.getDate() + 1);
    }


    return dates;
  };

  /**
   * Check if a date string is within a range (inclusive)
   */
  const isDateInRange = (dateStr, fromDate, toDate) => {
    return dateStr >= fromDate && dateStr <= toDate;
  };

  /**
   * Check if a date is unavailable (booked or marked unavailable)
   */
  const isDateUnavailable = (date) => {
    const dateStr = formatDateForAPI(date);

    // Check booked dates
    if (bookedDates.includes(dateStr)) return true;

    // Check unavailable slots using string comparison (inclusive range)
    return unavailableDates.some(slot =>
      isDateInRange(dateStr, slot.fromDate, slot.toDate)
    );
  };

  /**
   * Get unavailable slot for a specific date
   */
  const getUnavailableSlotForDate = (date) => {
    const dateStr = formatDateForAPI(date);
    return unavailableDates.find(slot =>
      isDateInRange(dateStr, slot.fromDate, slot.toDate)
    );
  };

  /**
   * Check if a range contains any unavailable dates
   */
  const checkRangeHasUnavailableDates = (startDate, endDate) => {
    const fromStr = formatDateForAPI(startDate);
    const toStr = formatDateForAPI(endDate);
    const dateRange = generateDateRange(fromStr, toStr);

    return dateRange.some(dateStr => {
      if (bookedDates.includes(dateStr)) return true;
      return unavailableDates.some(slot =>
        isDateInRange(dateStr, slot.fromDate, slot.toDate)
      );
    });
  };

  // ========== API Wrappers ==========

  const safeCreateNotAvailability = async (payload) => {
    try {

      const res = await createNotAvailability(payload);

      if (res && (res.success || res.data)) {
        return { success: true, data: res.data || res };
      }

      return { success: false, message: res?.message || 'Create failed' };
    } catch (err) {

      return { success: false, message: err?.message || 'Create failed' };
    }
  };

  const safeUpdateNotAvailability = async (id, payload) => {
    try {

      const res = await updateNotAvailability(id, payload);

      if (res && (res.success || res.data)) {
        return { success: true, data: res.data || res };
      }

      return { success: false, message: res?.message || 'Update failed' };
    } catch (err) {

      return { success: false, message: err?.message || 'Update failed' };
    }
  };

  const safeDeleteNotAvailability = async (id) => {
    try {

      const res = await deleteNotAvailability(id);

      // Check for successful deletion - handle multiple response formats
      if (res && (res.success === true || res.message === 'Availability deleted successfully' || res.status === 200 || res.deleted === true)) {
        return { success: true };
      }

      // If no explicit failure and no error thrown, consider it successful
      if (!res || (res && res.success !== false && !res.error)) {
        return { success: true };
      }

      return { success: false, message: res?.message || res?.error || 'Delete failed' };
    } catch (err) {

      return { success: false, message: err?.message || err?.response?.data?.message || 'Delete failed' };
    }
  };

  // ========== Effects ==========

  useEffect(() => {
    if (editSlotId && userRole === 'owner') {
      loadSlotForEditing(editSlotId);
    }
  }, [editSlotId]);

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

  // ========== Load slot for editing ==========

  const loadSlotForEditing = async (slotId) => {
    if (!slotId) return;
    setIsLoading(true);
    try {
      const response = await getNotAvailabilityById(slotId);

      if (response && (response.success || response.data)) {
        const slot = response.data || response;

        const fromDate = parseDate(slot.fromDate);
        const toDate = parseDate(slot.toDate);

        setSelectedStartDate(fromDate);
        setSelectedEndDate(toDate);
        setSelectedSlotForEdit({
          id: slot._id || slot.id || slotId,
          fromDate: slot.fromDate,
          toDate: slot.toDate,
          fromTime: slot.fromTime,
          toTime: slot.toTime,
        });
        setEditMode(true);
        setCurrentMonth(fromDate);
      }
    } catch (error) {

      Alert.alert('Error', 'Failed to load slot for editing');
    } finally {
      setIsLoading(false);
    }
  };

  // ========== FIXED: Fetch availability data ==========

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


      // Process response and merge consecutive dates into ranges
      const unavailableSlots = [];
      const bookedDatesList = [];

      // Extract all slots from response
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
      }


      // Group slots by type and merge into ranges
      const slotsByType = new Map(); // Key: id or date range, Value: {fromDate, toDate, id, reason}

      for (const slot of allSlots) {
        // Check vehicle match
        const slotVehicleId = slot.VechileId || slot.vehicleId || slot.vechileId || slot.VehicleId;
        if (slotVehicleId && String(slotVehicleId) !== String(vehicleId)) {
          continue;
        }

        const isBooked =
          slot.isBooked === true ||
          slot.isBooked === 'true' ||
          !!slot.bookingId ||
          !!slot.booking_id ||
          (slot.status && String(slot.status).toLowerCase() === 'booked') ||
          (slot.slotStatus && String(slot.slotStatus).toLowerCase() === 'booked') ||
          (slot.type && String(slot.type).toLowerCase() === 'booked') ||
          (slot.dateStatus && String(slot.dateStatus).toLowerCase() === 'booked');

        const isUnavailable =
          slot.isNotAvailable === true ||
          slot.isNotAvailable === 'true' ||
          (slot.status && String(slot.status).toLowerCase() === 'notavailable') ||
          (slot.slotStatus && String(slot.slotStatus).toLowerCase() === 'notavailable') ||
          (slot.type && String(slot.type).toLowerCase() === 'notavailable') ||
          (slot.dateStatus && String(slot.dateStatus).toLowerCase() === 'unavailable') ||
          (slot.reason && String(slot.reason).toLowerCase().includes('not available'));

        const dateStr = slot.fromDate || slot.date;

        if (!dateStr) {

          continue;
        }

        if (isBooked) {
          bookedDatesList.push(dateStr);

        } else if (isUnavailable) {
          const slotId = slot._id || slot.id;
          const fromDate = slot.fromDate || slot.date;
          const toDate = slot.toDate || slot.date;

          // Store with ID or create range key
          const key = slotId || `${fromDate}_${toDate}`;

          if (!slotsByType.has(key)) {
            slotsByType.set(key, {
              id: slotId || key,
              fromDate: fromDate,
              toDate: toDate,
              reason: slot.reason || 'Owner unavailable',
            });
          } else {
            // Expand range if needed
            const existing = slotsByType.get(key);
            if (fromDate < existing.fromDate) existing.fromDate = fromDate;
            if (toDate > existing.toDate) existing.toDate = toDate;
          }


        }
      }

      // Convert map to array
      const unavailableArray = Array.from(slotsByType.values());


      setUnavailableDates(unavailableArray);
      setBookedDates(bookedDatesList);
    } catch (error) {

      setUnavailableDates([]);
      setBookedDates([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Save/Edit handlers ==========

  const handleEditIconPress = () => {
    if (editMode && selectedStartDate && selectedEndDate) {
      handleSaveEdit();
    } else {
      setEditMode(true);
      setDeleteMode(false);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedSlotForEdit(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStartDate || !selectedEndDate) {
      Alert.alert('Error', 'Please select a valid start and end date.');
      return;
    }

    Animated.timing(fadeAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }).start();
    setIsLoading(true);

    try {
      const fromDateStr = formatDateForAPI(selectedStartDate);
      const toDateStr = formatDateForAPI(selectedEndDate);

      const totalDays = Math.floor((selectedEndDate - selectedStartDate) / (1000 * 60 * 60 * 24)) + 1;



      let response;

      if (selectedSlotForEdit && selectedSlotForEdit.id) {
        // UPDATE existing slot
        response = await safeUpdateNotAvailability(selectedSlotForEdit.id, {
          userId: userId,
          VechileId: vehicleId,
          vechileType: vehicleType,
          fromDate: fromDateStr,
          toDate: toDateStr,
          fromTime: '12:00 AM',
          toTime: '11:59 PM',
          isNotAvailable: true,
        });

        if (response && response.success) {
          onAvailabilityUpdated && onAvailabilityUpdated(response.data || response);
          Alert.alert('Success', 'Not-available dates updated successfully');
        }
      } else {
        // CREATE new slot
        response = await safeCreateNotAvailability({
          userId: userId,
          VechileId: vehicleId,
          vechileType: vehicleType,
          fromDate: fromDateStr,
          toDate: toDateStr,
          fromTime: '12:00 AM',
          toTime: '11:59 PM',
          isNotAvailable: true,
          reason: 'Owner unavailable',
        });

        if (response && response.success) {
          onAvailabilityCreated && onAvailabilityCreated(response.data || response);
          Alert.alert('Success', 'Not-available dates created successfully');
        }
      }

      if (response && response.success) {

        setEditMode(false);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setSelectedSlotForEdit(null);

        await fetchAvailabilityData();

        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start();
      } else {
        Alert.alert('Error', response?.message || 'Failed to save changes');
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }
    } catch (err) {

      Alert.alert('Error', 'Failed to save changes');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } finally {
      setIsLoading(false);
    }
  };

  // ========== Delete handlers ==========

  const handleDeleteIconPress = () => {
    if (deleteMode) {
      setDeleteMode(false);
    } else {
      setDeleteMode(true);
      setEditMode(false);
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      setSelectedSlotForEdit(null);
    }
  };

  const handleDeleteSlot = async (slot) => {
    if (!slot || !slot.id) {
      Alert.alert('Error', 'No slot found to delete for this date');
      return;
    }

    const fromDateStr = slot.fromDate || 'Unknown';
    const toDateStr = slot.toDate || 'Unknown';

    Alert.alert(
      'Remove Availability',
      `These dates will be available for booking:\n\nFrom: ${fromDateStr}\nTo: ${toDateStr}\n\nDo you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Make Available',
          style: 'default',
          onPress: async () => {
            Animated.timing(fadeAnim, { toValue: 0.6, duration: 180, useNativeDriver: true }).start();
            setIsLoading(true);

            try {
              const response = await safeDeleteNotAvailability(slot.id);

              if (response && response.success) {
                await fetchAvailabilityData();
                onAvailabilityDeleted && onAvailabilityDeleted(slot.id);
                setDeleteMode(false);
                Alert.alert('Success', 'The dates are now available for booking');
              } else {
                Alert.alert('Error', response?.message || 'Failed to delete availability');
              }
            } catch (err) {

              Alert.alert('Error', 'An unexpected error occurred while deleting');
            } finally {
              setIsLoading(false);
              Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            }
          },
        },
      ]
    );
  };

  // ========== Calendar helpers ==========

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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
    return selectedStartDate &&
      date.getDate() === selectedStartDate.getDate() &&
      date.getMonth() === selectedStartDate.getMonth() &&
      date.getFullYear() === selectedStartDate.getFullYear();
  };

  const isDateInSelectionRange = (date) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    const start = new Date(selectedStartDate.setHours(0,0,0,0));
    const end = new Date(selectedEndDate.setHours(0,0,0,0));
    const d = new Date(date.setHours(0,0,0,0));
    return d > start && d < end;
  };

  const isDateStartOrEnd = (date) => {
    if (!selectedStartDate && !selectedEndDate) return false;
    const d = new Date(date.setHours(0,0,0,0));
    const isStart = selectedStartDate && d.getTime() === new Date(selectedStartDate.setHours(0,0,0,0)).getTime();
    const isEnd = selectedEndDate && d.getTime() === new Date(selectedEndDate.setHours(0,0,0,0)).getTime();
    return isStart || isEnd;
  };

  const handleMonthYearSelect = (monthIndex, year) => {
    setCurrentMonth(new Date(year, monthIndex, 1));
    setShowMonthYearPicker(false);
  };

  const calendarDays = generateCalendarDays();

  // ========== Date selection handler ==========

  const handleDateSelect = (date) => {
    if (isProcessing) return;
    if (date.getMonth() !== currentMonth.getMonth()) return;

    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isPastDate = normalizedDate < new Date(new Date().setHours(0,0,0,0));

    if (isPastDate) return;

    // Customer cannot select unavailable dates
    if (userRole === 'customer' && isDateUnavailable(normalizedDate)) {
      const slot = getUnavailableSlotForDate(normalizedDate);
      const reason = slot ? slot.reason : 'Not available';
      Alert.alert('Date Unavailable', `This date is not available for booking.\n\nReason: ${reason}`);
      return;
    }

    // Owner edit mode: select start/end dates
    if (userRole === 'owner' && editMode) {
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

        setSelectedStartDate(from);
        setSelectedEndDate(to);
        onDateChange && onDateChange({ fromDate: from, toDate: to });
      }

      setTimeout(() => setIsProcessing(false), 120);
      return;
    }

    // Owner delete mode: delete clicked slot
    if (userRole === 'owner' && deleteMode) {
      const slot = getUnavailableSlotForDate(normalizedDate);
      if (slot) {
        handleDeleteSlot(slot);
      } else {
        Alert.alert('No Slot', 'No not-available slot found for this date');
      }
      return;
    }

    // Owner normal mode: clicking unavailable date opens it for editing
    if (userRole === 'owner' && !editMode && !deleteMode) {
      const slot = getUnavailableSlotForDate(normalizedDate);
      if (slot) {
        const fromDate = parseDate(slot.fromDate);
        const toDate = parseDate(slot.toDate);
        setSelectedStartDate(fromDate);
        setSelectedEndDate(toDate);
        setSelectedSlotForEdit(slot);
        setEditMode(true);
        return;
      }
    }

    // Default selection (customer or owner normal mode)
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

      // Customer: check range for unavailable dates
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

  // ========== Render ==========
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {userRole === 'owner' && <View style={styles.roleBadge}><Text style={styles.roleBadgeText}>Owner Mode</Text></View>}
            {userRole === 'customer' && <View style={[styles.roleBadge, { backgroundColor: '#2196F3' }]}><Text style={styles.roleBadgeText}>Customer View</Text></View>}
            {editMode && <View style={[styles.roleBadge, { backgroundColor: '#FFFFFF' }]}><Text style={styles.roleBadgeText}>Editing</Text></View>}
            {deleteMode && <View style={[styles.roleBadge, { backgroundColor: '#FFFFFF' }]}><Text style={styles.roleBadgeText}>Delete Mode</Text></View>}
          </View>
        </View>
      )}

      {editMode && userRole === 'owner' && (
        <View style={styles.modeBanner}>
          <Icon name="create-outline" size={18} color="#e65100" />
          <Text style={styles.modeBannerText}>Select dates to mark as not available. Tap ✓ to save.</Text>
        </View>
      )}

      {deleteMode && userRole === 'owner' && (
        <View style={[styles.modeBanner, { backgroundColor: '#ffebee', borderLeftColor: '#F44336' }]}>
          <Icon name="trash-outline" size={18} color="#c62828" />
          <Text style={[styles.modeBannerText, { color: '#c62828' }]}>Tap any not-available date to delete it.</Text>
        </View>
      )}

      {userRole === 'customer' && (unavailableDates.length > 0 || bookedDates.length > 0) && (
        <View style={styles.infoBanner}>
          <Icon name="information-circle" size={20} color="#2196F3" />
          <Text style={styles.infoBannerText}>Red crossed dates are not available for booking</Text>
        </View>
      )}

      {/* From/To display */}
      <View style={[styles.dateButtonsRow, isModal && styles.modalDateButtonsRow]}>
        <View style={[styles.dateButton, isModal && styles.modalDateButton]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="calendar-outline" size={16} color={Colors.text.secondary} style={styles.calendarIcon}/>
            <Text style={[styles.dateLabel, isModal && styles.modalDateLabel]}>From Date</Text>
          </View>
          <Text style={[styles.dateValue, isModal && styles.modalDateValue]}>
            {selectedStartDate ? `${selectedStartDate.getDate()} ${monthNames[selectedStartDate.getMonth()]}` : 'Select'}
          </Text>
        </View>

        <View style={[styles.dateButton, isModal && styles.modalDateButton]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon name="calendar-outline" size={16} color={Colors.text.secondary} style={styles.calendarIcon}/>
            <Text style={[styles.dateLabel, isModal && styles.modalDateLabel]}>To Date</Text>
          </View>
          <Text style={[styles.dateValue, isModal && styles.modalDateValue]}>
            {selectedEndDate ? `${selectedEndDate.getDate()} ${monthNames[selectedEndDate.getMonth()]}` : 'Select'}
          </Text>
        </View>
      </View>

      <Animated.View style={[styles.calendarContainer, isModal && styles.modalCalendarContainer, { opacity: fadeAnim }]}>
        {/* Header */}
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
              <Pressable onPress={handleEditIconPress} hitSlop={10} style={[styles.inlineIconButton, editMode && styles.activeInlineIcon]}>
                <Icon name={editMode ? "checkmark-circle" : "create-outline"} size={24} color={editMode ? '#4CAF50' : '#2196F3'} />
              </Pressable>
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

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => {
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isStartOrEnd = isDateStartOrEnd(date);
            const isInRange = isDateInSelectionRange(date);
            const isUnavailable = isDateUnavailable(date);
            const isPastDate = date < new Date(new Date().setHours(0,0,0,0));

            // Show editing styles when in edit mode and date is selected
            const showAsEditing = editMode && (isStartOrEnd || isInRange);

            // Show delete target for unavailable dates in delete mode
            const showAsDeleteTarget = deleteMode && isUnavailable && !isPastDate && isCurrentMonth;

            // CRITICAL FIX: Show strike marks on ALL unavailable dates that are NOT currently being edited
            const shouldShowStrike = isUnavailable && isCurrentMonth && !showAsEditing;

            return (
              <Pressable
                key={index}
                onPress={() => handleDateSelect(date)}
                style={({ pressed }) => [
                  styles.dayCell,
                  // Editing mode: orange for start/end, light orange for middle
                  showAsEditing && isStartOrEnd && styles.editingDayCell,
                  showAsEditing && isInRange && !isStartOrEnd && styles.editingRangeDayCell,
                  // Delete mode target
                  showAsDeleteTarget && styles.deleteDayCell,
                  // Normal selection: black for start/end, light gray for middle
                  !showAsEditing && !showAsDeleteTarget && isStartOrEnd && styles.selectedDayCell,
                  !showAsEditing && !showAsDeleteTarget && isInRange && !isStartOrEnd && styles.rangeDayCell,
                  // Unavailable dates (not being edited or selected for delete)
                  !showAsEditing && !showAsDeleteTarget && isUnavailable && styles.unavailableDayCell,
                  isPastDate && styles.pastDayCell,
                  { position: 'relative' },
                  pressed && { opacity: 0.7 },
                ]}
                disabled={isPastDate || (userRole === 'customer' && isUnavailable)}
                hitSlop={8}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  showAsEditing && isStartOrEnd && styles.editingDayText,
                  showAsEditing && isInRange && !isStartOrEnd && styles.editingRangeDayText,
                  showAsDeleteTarget && styles.deleteDayText,
                  !showAsEditing && !showAsDeleteTarget && isStartOrEnd && styles.selectedDayText,
                  !showAsEditing && !showAsDeleteTarget && isInRange && !isStartOrEnd && styles.rangeDayText,
                  !showAsEditing && !showAsDeleteTarget && isUnavailable && styles.unavailableDayText,
                  isPastDate && styles.pastDayText,
                ]}>
                  {date.getDate()}
                </Text>

                {/* CRITICAL FIX: Show strike marks on ALL unavailable dates (including toDate) except when editing */}
                {shouldShowStrike && (
                  <View pointerEvents="none" style={styles.strikeLine} />
                )}

                {showAsDeleteTarget && (
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
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.unavailableBox]} />
            <Text style={styles.legendText}>{userRole === 'owner' ? 'Unavailable/Booked' : 'Not Available'}</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.selectedBox]} />
            <Text style={styles.legendText}>{editMode ? 'Editing' : 'Selected'}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Summary */}
      {selectedStartDate && selectedEndDate && (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>{editMode ? 'Editing Dates' : 'Selected Dates'}</Text>
          <Text style={styles.summaryText}>From: {formatDateForAPI(selectedStartDate)}</Text>
          <Text style={styles.summaryText}>To: {formatDateForAPI(selectedEndDate)}</Text>
          {editMode && <Text style={[styles.summaryText, { marginTop: 8, fontStyle: 'italic' }]}>Tap ✓ icon to save changes</Text>}
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
  roleBadge: {
    backgroundColor: Colors.gradient?.primary?.[0] || '#4CAF50',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm
  },
  roleBadgeText: {
    color: Colors.white,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold
  },
  modeBanner: {
    backgroundColor: '#fff3e0',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#ff9800'
  },
  modeBannerText: {
    fontSize: Typography.fontSize.sm,
    color: '#e65100',
    fontFamily: Typography.fontFamily.medium,
    flex: 1
  },
  infoBanner: {
    backgroundColor: '#E3F2FD',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#2196F3'
  },
  infoBannerText: {
    fontSize: Typography.fontSize.sm,
    color: '#1976D2',
    fontFamily: Typography.fontFamily.medium,
    flex: 1
  },
  dateButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg
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
    backgroundColor: 'rgba(76,175,80,0.08)'
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
  editingDayCell: {
    backgroundColor: '#ff9800'
  },
  editingRangeDayCell: {
    backgroundColor: '#ffe0b2'
  },
  deleteDayCell: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#ffcdd2'
  },
  unavailableDayCell: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2'
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
  editingDayText: {
    color: Colors.white,
    fontWeight: '700'
  },
  editingRangeDayText: {
    color: '#e65100',
    fontWeight: '600'
  },
  rangeDayText: {
    color: Colors.text.primary,
    fontWeight: '500'
  },
  deleteDayText: {
    color: '#c62828',
    fontWeight: '700'
  },
  unavailableDayText: {
    color: '#c62828',
    fontWeight: '500'
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
    gap: 16
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
  unavailableBox: {
    backgroundColor: '#ffebee',
    borderWidth: 1,
    borderColor: '#ffcdd2'
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
  // CRITICAL: Strike line styling for unavailable dates
  strikeLine: {
    position: 'absolute',
    width: '80%',
    height: Platform.OS === 'ios' ? 2 : 2.5,
    backgroundColor: '#b71c1c',
    top: '50%',
    left: '10%',
    transform: [{ translateY: -1 }],
    zIndex: 2,
  },
});
