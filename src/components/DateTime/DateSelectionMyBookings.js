import { useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

/**
 * Simple Date Selection Component
 * Just select from and to dates - no availability checking, no owner/customer modes
 */
const DateSelectionMyBookings = ({
  onDateChange,
  isModal,
}) => {
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const monthNames = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const years = Array.from({length: 15}, (_, i) => new Date().getFullYear() - 5 + i);

  const formatDateForAPI = (date) => {
    if (!date) return '';
    const d = (date instanceof Date) ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calendar helpers
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

  const isDateInRange = (date) => {
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

  const handleDateSelect = (date) => {
    if (isProcessing) return;
    if (date.getMonth() !== currentMonth.getMonth()) return;
    
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const isPastDate = normalizedDate < new Date(new Date().setHours(0,0,0,0));
    
    // Prevent past date selection
    if (isPastDate) return;
    
    setIsProcessing(true);
    
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      // Select start date
      setSelectedStartDate(normalizedDate);
      setSelectedEndDate(null);
      onDateChange && onDateChange({ fromDate: normalizedDate, toDate: null });
    } else {
      // Select end date
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
  };

  return (
    <View style={[styles.container, isModal && styles.modalContainer]}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Select Date Range</Text>
      </View>

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
            const isInRange = isDateInRange(date);
            const isPastDate = date < new Date(new Date().setHours(0,0,0,0));

            return (
              <Pressable
                key={index}
                onPress={() => handleDateSelect(date)}
                style={({ pressed }) => [
                  styles.dayCell,
                  isStartOrEnd && styles.selectedDayCell,
                  isInRange && !isStartOrEnd && styles.rangeDayCell,
                  isPastDate && styles.pastDayCell,
                  { position: 'relative' },
                  pressed && { opacity: 0.7 },
                ]}
                disabled={isPastDate}
                hitSlop={8}
              >
                <Text style={[
                  styles.dayText,
                  !isCurrentMonth && styles.otherMonthText,
                  isStartOrEnd && styles.selectedDayText,
                  isInRange && !isStartOrEnd && styles.rangeDayText,
                  isPastDate && styles.pastDayText,
                ]}>
                  {date.getDate()}
                </Text>
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
            <View style={[styles.legendBox, styles.selectedBox]} />
            <Text style={styles.legendText}>Selected</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, styles.pastBox]} />
            <Text style={styles.legendText}>Past</Text>
          </View>
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

export default DateSelectionMyBookings;

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
  selectedBox: { 
    backgroundColor: Colors.black 
  },
  pastBox: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd'
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
});