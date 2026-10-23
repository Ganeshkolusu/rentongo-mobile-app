import {
  API_ENDPOINTS,
  fetchData,
  HTTP_METHODS
} from '../config/apiConfig';

/** Utility – clean data for URLSearchParams */
const encodeFormData = (data = {}) => {
  const filtered = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) filtered[key] = value;
  });
  return new URLSearchParams(filtered).toString();
};

/** Standard API response */
const apiSuccess = (message, data = {}) => ({ success: true, message, data });
const apiError = (error, fallback) => ({
  success: false,
  message: error?.message || fallback
});

/**
 * Create Not Availability Slot
 */
export const createNotAvailability = async (data) => {
  try {
    if (!data.fromDate || !data.toDate) {
      throw new Error('fromDate and toDate are required');
    }

    const response = await fetchData(
      API_ENDPOINTS.CREATE_NOT_AVAILABILITY,
      {},
      {
        method: HTTP_METHODS.POST,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData(data)
      }
    );

    return apiSuccess('Not availability slot created successfully', response);

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to create not availability slot');
  }
};

/**
 * Update Not Availability Slot
 */
export const updateNotAvailability = async (id, data) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.UPDATE_NOT_AVAILABILITY(id),
      {},
      {
        method: HTTP_METHODS.PUT,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeFormData(data)
      }
    );

    return apiSuccess('Not availability slot updated successfully', response);

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to update not availability slot');
  }
};

/**
 * Delete Not Availability Slot
 */
export const deleteNotAvailability = async (id) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.DELETE_NOT_AVAILABILITY(id),
      {},
      { method: HTTP_METHODS.DELETE }
    );

    return apiSuccess('Not availability slot deleted successfully', response);

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to delete not availability slot');
  }
};

/**
 * Get Not Availability By ID
 */
export const getNotAvailabilityById = async (id) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.GET_NOT_AVAILABILITY_BY_ID(id),
      {},
      { method: HTTP_METHODS.GET }
    );

    return { success: true, data: response };

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to get not availability slot');
  }
};

/**
 * Get All Not Availability Slots for a Vehicle
 */
export const getAllNotAvailabilityByVehicle = async (vehicleId, vehicleType) => {
  try {
    const params = {
      VechileId: vehicleId,
      vechileType: vehicleType
    };

    const response = await fetchData(
      API_ENDPOINTS.GET_ALL_NOT_AVAILABILITY,
      params,
      { method: HTTP_METHODS.GET }
    );

    return {
      success: true,
      data: response,
      slots: response?.notAvailableSlots || []
    };

  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to get not availability slots',
      slots: []
    };
  }
};

/**
 * Get All Bookings for a Vehicle
 */
export const getAllBookingsByVehicle = async (vehicleId, vehicleType) => {
  try {
    const params = {
      VechileId: vehicleId,
      vechileType: vehicleType
    };

    const response = await fetchData(
      API_ENDPOINTS.GET_VEHICLE_BOOKINGS || '/api/bookings/vehicle',
      params,
      { method: HTTP_METHODS.GET }
    );

    return {
      success: true,
      bookings: response?.bookings || []
    };

  } catch (error) {
    // Silent catch
    return {
      success: false,
      message: error.message || 'Failed to get vehicle bookings',
      bookings: []
    };
  }
};

/**
 * Combined Unavailable Dates (Not Availability + Bookings)
 */
export const getCombinedUnavailableDates = async (vehicleId, vehicleType) => {
  try {
    const [naRes, bookingRes] = await Promise.all([
      getAllNotAvailabilityByVehicle(vehicleId, vehicleType),
      getAllBookingsByVehicle(vehicleId, vehicleType)
    ]);

    const unavailableDates = [];

    // Not Availability Slots
    naRes.slots?.forEach(slot => {
      unavailableDates.push({
        id: slot._id,
        fromDate: slot.fromDate,
        toDate: slot.toDate,
        fromTime: slot.fromTime,
        toTime: slot.toTime,
        type: 'not_available',
        reason: slot.reason || 'Owner marked unavailable',
        canDelete: true
      });
    });

    // Bookings
    bookingRes.bookings?.forEach(booking => {
      unavailableDates.push({
        id: booking._id,
        fromDate: booking.FromDate,
        toDate: booking.ToDate,
        fromTime: booking.FromTime,
        toTime: booking.ToTime,
        type: 'booked',
        reason: 'Booked by customer',
        customerName: booking.contactName,
        canDelete: false
      });
    });

    return {
      success: true,
      unavailableDates,
      notAvailableCount: naRes.slots.length || 0,
      bookedCount: bookingRes.bookings.length || 0
    };

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to get unavailable dates');
  }
};

/**
 * Check Vehicle Availability
 */
export const checkVehicleAvailability = async (vehicleId, vehicleType, startDate, endDate, userId) => {
  try {
    const params = {
      VechileId: vehicleId,
      vechileType: vehicleType,
      startDate,
      endDate,
      ...(userId && { userId })
    };

    const response = await fetchData(
      API_ENDPOINTS.GET_VEHICLE_AVAILABILITY,
      params,
      { method: HTTP_METHODS.GET }
    );

    return {
      success: true,
      isAvailable: response?.isAvailable !== false,
      blockedSlots: response?.blockedSlots || [],
      data: response
    };

  } catch (error) {
    // Silent catch
    return {
      success: false,
      isAvailable: true,
      blockedSlots: [],
      message: error.message || 'Failed to check availability'
    };
  }
};

/**
 * Mark Vehicle Not Available
 */
export const markVehicleNotAvailable = async (
  vehicleId,
  vehicleType,
  fromDate,
  toDate,
  fromTime = '12:00 AM',
  toTime = '11:59 PM',
  reason = ''
) => {
  try {
    const data = {
      VechileId: vehicleId,
      vechileType: vehicleType,
      fromDate,
      toDate,
      fromTime,
      toTime,
      isNotAvailable: true,
      ...(reason ? { reason } : {})
    };

    return await createNotAvailability(data);

  } catch (error) {
    // Silent catch
    return apiError(error, 'Failed to mark vehicle not available');
  }
};

/**
 * Remove Not Availability (Mark Available)
 */
export const markVehicleAvailable = async (id) => {
  try {
    return await deleteNotAvailability(id);
  } catch (error) {
    return apiError(error, 'Failed to mark vehicle as available');
  }
};

/**
 * Update Only Time
 */
export const updateNotAvailabilityTime = async (id, fromTime, toTime) => {
  try {
    return await updateNotAvailability(id, { fromTime, toTime });
  } catch (error) {
    return apiError(error, 'Failed to update not availability time');
  }
};

/**
 * Update Only Date Range
 */
export const updateNotAvailabilityDate = async (id, fromDate, toDate) => {
  try {
    return await updateNotAvailability(id, { fromDate, toDate });
  } catch (error) {
    return apiError(error, 'Failed to update not availability date');
  }
};

/**
 * Get Upcoming Unavailability (Next 3 Months)
 */
export const getUpcomingNotAvailability = async (vehicleId, vehicleType) => {
  try {
    const today = new Date();
    const threeMonths = new Date();
    threeMonths.setMonth(today.getMonth() + 3);

    const toStr = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const res = await checkVehicleAvailability(
      vehicleId,
      vehicleType,
      toStr(today),
      toStr(threeMonths)
    );

    if (!res.success) return res;

    const upcoming = res.blockedSlots.filter(
      slot => new Date(slot.fromDate) >= today && !slot.isBooked
    );

    return {
      success: true,
      data: upcoming,
      count: upcoming.length
    };

  } catch (error) {
    return apiError(error, 'Failed to get upcoming not availability');
  }
};
