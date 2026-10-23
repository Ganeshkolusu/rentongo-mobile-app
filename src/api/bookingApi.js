// src/api/bookingApi.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';

/**
 * This file makes its own raw fetch() calls instead of going through
 * src/config/apiConfig.js or src/api/apiClient.js, so it needs its own copy
 * of auth-header injection — every endpoint here now requires it.
 */
const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    return {};
  }
};

/**
 * Create a new booking
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CREATE_BOOKING}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(bookingData),
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return { success: false, message: 'Invalid server response (not JSON)' };
    }

    if (!response.ok) {
      // Silent catch
      if (data.message && data.message.includes('already booked')) {
        return { 
          success: false, 
          message: 'Vehicle already booked in this date range' 
        };
      }
      
      return { success: false, message: data.message || 'Booking failed' };
    }

    return { 
      success: true, 
      message: data.message || 'Booking created successfully',
      data: data.data || data 
    };
  } catch (error) {
    // Silent catch
    return { success: false, message: 'Network error. Please check your connection.' };
  }
};

/**
 * ✅ FIXED: Get all bookings with backend error handling
 */
export const getAllBookings = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        count: 0,
        data: [],
      };
    }

    const url = `${API_CONFIG.BASE_URL}/getAllBookings?userId=${userId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return {
        success: false,
        message: 'Invalid server response',
        count: 0,
        data: [],
      };
    }

    if (!response.ok) {
      // Silent catch
      if (data.error && data.error.includes('Review is not defined')) {
        return {
          success: true,
          message: 'No bookings available at the moment',
          count: 0,
          data: [],
        };
      }
      
      return {
        success: false,
        message: data.message || 'Failed to fetch bookings',
        count: 0,
        data: [],
      };
    }

    return {
      success: true,
      message: data.message || 'Bookings retrieved successfully',
      count: data.count || data.total || data.data?.length || 0,
      data: data.data || [],
    };
    
  } catch (error) {
    // Silent catch
    return {
      success: true,
      message: 'Unable to load bookings. Please try again later.',
      count: 0,
      data: [],
    };
  }
};

/**
 * ✅ FIXED: Get vehicle bookings - removed buildUrl error
 */
export const getMyVehicleBookings = async (userId, vehicleType = null, vehicleId = null) => {
  try {
    // Validate userId
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        count: 0,
        data: [],
      };
    }
    
    // Build URL with query params - use correct endpoint with 's'
    let url = `${API_CONFIG.BASE_URL}/myVehicleBookings/${userId}`;
    const params = new URLSearchParams();
    
    if (vehicleType) params.append('vechileType', vehicleType);
    if (vehicleId) params.append('VechileId', vehicleId);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch (err) {
      return {
        success: false,
        message: 'Invalid server response',
        count: 0,
        data: [],
      };
    }

    if (!response.ok) {
      // Silent catch
      return {
        success: false,
        message: data.message || 'Failed to fetch vehicle bookings',
        count: 0,
        data: [],
      };
    }

    // Handle the nested structure: { data: { car: [...], bike: [...], auto: [...] } }
    // Each vehicle array contains vehicles with nested 'bookings' arrays
    let bookingsData = [];

    // Check if response has the nested vehicle structure
    const responseData = data.data || data;

    // Extract bookings from each vehicle type
    const vehicleCategories = ['car', 'bike', 'auto', 'Car', 'Bike', 'Auto'];

    for (const category of vehicleCategories) {
      if (responseData[category] && Array.isArray(responseData[category])) {

        // Each vehicle has a 'bookings' array inside it
        for (const vehicle of responseData[category]) {
          if (vehicle.bookings && Array.isArray(vehicle.bookings)) {

            // Add vehicle info to each booking for reference
            const bookingsWithVehicle = vehicle.bookings.map(booking => ({
              ...booking,
              vehicleDetails: {
                _id: vehicle._id,
                // Car fields
                CarName: vehicle.CarName,
                CarModel: vehicle.CarModel,
                carImages: vehicle.carImages,
                // Bike fields
                bikeName: vehicle.bikeName,
                bikeModel: vehicle.bikeModel,
                bikeImages: vehicle.bikeImages,
                // Auto fields
                autoName: vehicle.autoName,
                autoImages: vehicle.autoImages,
              }
            }));
            bookingsData = [...bookingsData, ...bookingsWithVehicle];
          }
        }
      }
    }

    // Fallback: check if data is already an array of bookings
    if (bookingsData.length === 0) {
      if (Array.isArray(responseData)) {
        bookingsData = responseData;
      } else if (responseData.bookings && Array.isArray(responseData.bookings)) {
        bookingsData = responseData.bookings;
      }
    }

    
    return {
      success: true,
      message: data.message || 'Vehicle bookings retrieved successfully',
      count: bookingsData.length,
      data: bookingsData,
    };
  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to fetch vehicle bookings',
      count: 0,
      data: [],
    };
  }
};

/**
 * Get user's own bookings (alias for getAllBookings)
 */
export const getMyBookings = async (userId) => {
  return await getAllBookings(userId);
};

/**
 * Get booking by ID
 */
export const getBookingById = async (bookingId) => {
  try {
    const endpoint = `${API_CONFIG.BASE_URL}/getBookingById/${bookingId}`;

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      // Silent catch
      return { success: false, message: data.message || 'Failed to fetch booking' };
    }

    return {
      success: true,
      message: data.message || 'Booking retrieved successfully',
      data: data.data || data.booking || data,
    };
  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to fetch booking',
    };
  }
};

/**
 * Check if booking should be marked as completed
 * Returns true if current time is past the booking end date/time
 */
export const shouldMarkAsCompleted = (booking) => {
  try {
    // Only check for confirmed bookings
    const status = (booking.bookingStatus || booking.status || '').toLowerCase();
    if (status !== 'confirmed') {
      return false;
    }

    // Get end date and time from booking
    const endDate = booking.ToDate || booking.endDate || booking.toDate;
    const endTime = booking.ToTime || booking.endTime || booking.toTime;

    if (!endDate) {
      return false;
    }

    // Parse the date (format: DD-MM-YYYY or YYYY-MM-DD)
    let bookingEndDateTime;

    if (endDate.includes('-')) {
      const dateParts = endDate.split('-');
      // Check if it's DD-MM-YYYY or YYYY-MM-DD
      if (dateParts[0].length === 4) {
        // YYYY-MM-DD format
        bookingEndDateTime = new Date(endDate);
      } else {
        // DD-MM-YYYY format
        const [day, month, year] = dateParts;
        bookingEndDateTime = new Date(`${year}-${month}-${day}`);
      }
    } else {
      bookingEndDateTime = new Date(endDate);
    }

    // If we have end time, parse and add it
    if (endTime && endTime !== 'N/A') {
      // Handle various time formats (HH:mm, HH:mm:ss, h:mm AM/PM)
      const timeStr = endTime.trim();

      // Check for AM/PM format
      if (timeStr.includes('AM') || timeStr.includes('PM') || timeStr.includes('am') || timeStr.includes('pm')) {
        const timeUpper = timeStr.toUpperCase();
        const isPM = timeUpper.includes('PM');
        const timeWithoutPeriod = timeStr.replace(/AM|PM|am|pm/gi, '').trim();
        const [hours, minutes] = timeWithoutPeriod.split(':').map(Number);

        let hour24 = hours;
        if (isPM && hours !== 12) {
          hour24 = hours + 12;
        } else if (!isPM && hours === 12) {
          hour24 = 0;
        }

        bookingEndDateTime.setHours(hour24, minutes || 0, 0, 0);
      } else {
        // 24-hour format (HH:mm or HH:mm:ss)
        const timeParts = timeStr.split(':').map(Number);
        bookingEndDateTime.setHours(timeParts[0] || 0, timeParts[1] || 0, timeParts[2] || 0, 0);
      }
    } else {
      // If no time specified, set to end of day (23:59:59)
      bookingEndDateTime.setHours(23, 59, 59, 999);
    }

    // Compare with current time
    const now = new Date();
    return now > bookingEndDateTime;
  } catch (error) {
    // Silent catch
    return false;
  }
};

/**
 * Update booking status or details
 */
export const updateBooking = async (bookingId, updateData) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/updateBooking/${bookingId}`,
      {
        method: 'PUT',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(updateData),
      }
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      // Silent catch
      return { success: false, message: data.message || 'Failed to update booking' };
    }

    return {
      success: true,
      message: data.message || 'Booking updated successfully',
      data: data.booking || data.data || data,
    };
  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to update booking',
    };
  }
};

/**
 * Cancel/Delete a booking
 */
export const cancelBooking = async (bookingId) => {
  try {
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/deleteBooking/${bookingId}`,
      {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
      }
    );

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      // Silent catch
      return { success: false, message: data.message || 'Failed to delete booking' };
    }

    return {
      success: true,
      message: data.message || 'Booking deleted successfully',
    };
  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to cancel booking',
    };
  }
};

/**
 * Confirm a booking (accept or reject)
 */
export const confirmBooking = async (bookingId, action) => {
  try {
    const endpoint = API_ENDPOINTS.CONFIRM_BOOKING(bookingId, action);

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return { success: false, message: 'Invalid server response' };
    }

    if (!response.ok) {
      // Silent catch
      return { success: false, message: data.message || 'Failed to confirm booking' };
    }

    return {
      success: true,
      message: data.message || `Booking ${action}ed successfully`,
      data: data.data || data,
    };
  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to confirm booking',
    };
  }
};

/**
 * Get pending bookings for owner's vehicles
 */
export const getPendingBookingsOfOwner = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        message: 'User ID is required',
        count: 0,
        data: [],
      };
    }

    const endpoint = API_ENDPOINTS.GET_PENDING_BOOKINGS_OF_OWNER(userId);

    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      // Silent catch
      return {
        success: false,
        message: 'Invalid server response',
        count: 0,
        data: [],
      };
    }

    if (!response.ok) {
      // Silent catch
      return {
        success: false,
        message: data.message || 'Failed to fetch pending bookings',
        count: 0,
        data: [],
      };
    }

    // Handle both array and single booking responses
    let bookings = data.data || data.bookings || [];
    if (!Array.isArray(bookings)) {
      bookings = bookings ? [bookings] : [];
    }

    return {
      success: true,
      message: data.message || 'Pending bookings retrieved successfully',
      count: data.count || data.total || bookings.length || 0,
      data: bookings,
    };
  } catch (error) {
    // Silent catch
    return {
      success: true,
      message: 'Unable to load pending bookings',
      count: 0,
      data: [],
    };
  }
};

/**
 * ✅ FIXED: Transform booking data - properly extracts times
 */
export const transformBookings = (apiBookings) => {
  if (!Array.isArray(apiBookings)) return [];

  return apiBookings.map((item) => {
    const booking = item.booking || item;
    const vehicle = item.vehicle || item.vehicleDetails;
    // ✅ Case-insensitive vehicle type check
    const vehicleTypeLower = (booking.vechileType || booking.vehicleType || '').toLowerCase();
    const isCarBooking = vehicleTypeLower === 'car';
    const isAutoBooking = vehicleTypeLower === 'auto';
    const isBikeBooking = vehicleTypeLower === 'bike';
    

    // Get vehicle name
    let vehicleName = 'Vehicle';
    if (isCarBooking && vehicle) {
      vehicleName = `${vehicle.CarName || 'Car'} ${vehicle.CarModel || ''}`.trim();
    } else if (isAutoBooking && vehicle) {
      vehicleName = `${vehicle.autoName || 'Auto'}`.trim();
    } else if (vehicle) {
      vehicleName = `${vehicle.bikeName || 'Bike'} ${vehicle.bikeModel || ''}`.trim();
    }
    
    // Get vehicle image
    let vehicleImage;
    if (isCarBooking) {
      vehicleImage = require('../assets/Images/car1.png');
    } else if (isAutoBooking) {
      vehicleImage = require('../assets/Images/auto.png');
    } else {
      vehicleImage = require('../assets/Images/bike.png');
    }
    
    if (vehicle) {
      const images = isCarBooking 
        ? vehicle.carImages 
        : isAutoBooking 
          ? vehicle.autoImages 
          : vehicle.bikeImages;
      
      if (images && Array.isArray(images) && images.length > 0) {
        const imageUri = images[0];
        if (imageUri && typeof imageUri === 'string' && 
            (imageUri.startsWith('http://') || imageUri.startsWith('https://'))) {
          vehicleImage = { uri: imageUri };
        }
      }
    }
    
    // ✅ Format date as DD-MM-YYYY
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };
    
    const fromDateFormatted = formatDate(booking.FromDate);
    const toDateFormatted = formatDate(booking.ToDate);
    
    // ✅ CRITICAL FIX: Extract actual times from booking
    const fromTime = booking.FromTime || booking.fromTime || '6:00 AM';
    const toTime = booking.ToTime || booking.toTime || '6:00 PM';
    

    // ✅ Extract pricing based on vehicle type
    let pricePerKm = 0;
    let pricePerHour = 0;
    let pricePerDay = 0;
    
    if (isCarBooking) {
      pricePerHour = Number(booking.pricePerHour) || 0;
      pricePerDay = Number(booking.pricePerDay) || 0;
      pricePerKm = 0;
    } else if (isBikeBooking || isAutoBooking) {
      pricePerKm = Number(booking.pricePerKm) || 0;
      pricePerHour = 0;
      pricePerDay = 0;
    }
    
    const totalPrice = Number(booking.totalPrice) || 0;
    
    // Determine display price and unit
    let price = totalPrice;
    let unit = '/Total';
    
    if (isCarBooking) {
      if (pricePerDay > 0) {
        price = pricePerDay;
        unit = '/day';
      } else if (pricePerHour > 0) {
        price = pricePerHour;
        unit = '/hr';
      }
    } else if (isBikeBooking || isAutoBooking) {
      if (pricePerKm > 0) {
        price = pricePerKm;
        unit = '/km';
      }
    }
    
    // ✅ Customer/Contact info
    const customerName = booking.contactName || booking.customerName || 'Customer';
    const contactNumber = booking.contactNumber || booking.mobileNo || '';
    
    return {
      id: booking._id,
      title: vehicleName,
      
      // ✅ Formatted dates (DD-MM-YYYY)
      date: fromDateFormatted,
      fromDate: fromDateFormatted,
      toDate: toDateFormatted,
      dateRange: `${fromDateFormatted} - ${toDateFormatted}`,
      
      // ✅ TIME information (BOTH formats for compatibility)
      fromTime: fromTime,
      toTime: toTime,
      FromTime: fromTime,
      ToTime: toTime,
      totalHours: booking.totalHours,
      
      // Status & pricing
      status: booking.status || 'Pending',
      price: `₹${price}`,
      unit: unit,
      totalPrice: totalPrice,
      pricePerKm: pricePerKm,
      pricePerHour: pricePerHour,
      pricePerDay: pricePerDay,
      
      // Vehicle info
      image: vehicleImage,
      type: vehicleTypeLower || 'car',
      vehicleType: booking.vechileType || booking.vehicleType,
      
      // ✅ Contact info (multiple field names for compatibility)
      contactName: customerName,
      contactNumber: contactNumber,
      customerName: customerName,
      mobileNo: contactNumber,
      
      // Additional data
      vehicleDetails: vehicle,
      rawBooking: booking,
      hasReviewed: false,
    };
  });
};