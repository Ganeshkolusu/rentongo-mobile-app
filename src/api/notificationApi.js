import { API_ENDPOINTS, fetchData, HTTP_METHODS } from '../config/apiConfig';

export const getNotifications = async (userId) => {
  try {
    if (!userId) {
      return { success: true, data: [], message: 'No userId provided' };
    }

    const endpoint = API_ENDPOINTS.GET_NOTIFICATIONS(userId);

    const response = await fetchData(
      endpoint,
      {},
      { method: HTTP_METHODS.GET }
    );

    // Handle both array and single notification responses
    let notifications = response?.data || response?.notifications || response || [];
    if (!Array.isArray(notifications)) {
      notifications = notifications ? [notifications] : [];
    }

    return {
      success: true,
      data: notifications,
    };
  } catch (error) {
    const errorMessage = error?.message || '';
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return { success: true, data: [], message: 'No notifications yet' };
    }
    return { success: false, data: [], message: 'Error fetching notifications' };
  }
};

export const markNotificationRead = async (id) => {
  try {
    if (!id) return { success: false };
    await fetchData(API_ENDPOINTS.MARK_NOTIFICATION_READ(id), {}, { method: HTTP_METHODS.PUT });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    if (!userId) return { success: false };
    await fetchData(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ(userId), {}, { method: HTTP_METHODS.PUT });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const deleteNotification = async (id) => {
  try {
    if (!id) return { success: false };
    await fetchData(API_ENDPOINTS.DELETE_NOTIFICATION(id), {}, { method: HTTP_METHODS.DELETE });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

export const clearAllNotifications = async (userId) => {
  try {
    if (!userId) return { success: false };
    await fetchData(API_ENDPOINTS.CLEAR_ALL_NOTIFICATIONS(userId), {}, { method: HTTP_METHODS.DELETE });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};
