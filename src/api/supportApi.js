import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from '../config/apiConfig';

// Use main API URL for ticket APIs
const TICKET_BASE_URL = API_CONFIG.BASE_URL;

// The ticket routes require the app-issued JWT saved at login.
const getAuthHeaders = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (error) {
    return {};
  }
};

/**
 * Get tickets for a specific user
 * Handles backend errors gracefully
 */
export const getTicketsByUser = async (userId) => {
  try {
    const endpoint = API_ENDPOINTS.GET_TICKETS_BY_USER(userId);
    const fullUrl = `${TICKET_BASE_URL}${endpoint}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const responseText = await response.text();

    if (!responseText || responseText.trim() === '') {
      return [];
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        throw new Error('API_ERROR: Server returned HTML instead of JSON');
      }
      throw new Error(`PARSE_ERROR: Invalid JSON response`);
    }
    
    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `HTTP ${response.status}`;
      
      if (errorMsg.includes("Schema hasn't been registered") || 
          errorMsg.includes('mongoose.model') ||
          errorMsg.includes('Vehicle')) {
        if (data.tickets && Array.isArray(data.tickets)) {
          return data.tickets;
        }
        if (data.data && Array.isArray(data.data)) {
          return data.data;
        }
        throw new Error('BACKEND_CONFIG_ERROR: Backend model configuration issue. Contact backend team.');
      }
      throw new Error(errorMsg);
    }
    
    let ticketsArray = [];
    
    if (Array.isArray(data)) {
      ticketsArray = data;
    } else if (data.tickets && Array.isArray(data.tickets)) {
      ticketsArray = data.tickets;
    } else if (data.data && Array.isArray(data.data)) {
      ticketsArray = data.data;
    } else if (data.ticket) {
      ticketsArray = [data.ticket];
    }
    
    return ticketsArray;
    
  } catch (error) {
    throw error;
  }
};

/**
 * Create a support ticket with image upload support
 * Uses JSON for regular requests, FormData only when photos are included
 */
export const createTicket = async (ticketData) => {
  try {
    const fullUrl = `${TICKET_BASE_URL}${API_ENDPOINTS.CREATE_TICKET}`;
    const hasPhotos = ticketData.photos && Array.isArray(ticketData.photos) && ticketData.photos.length > 0;

    let response;

    if (hasPhotos) {
      // Use FormData for file uploads
      const formData = new FormData();

      if (ticketData.userId) formData.append('userId', ticketData.userId);
      if (ticketData.subject) formData.append('subject', ticketData.subject);
      if (ticketData.description) formData.append('description', ticketData.description);
      if (ticketData.priority) formData.append('priority', ticketData.priority);
      if (ticketData.vehicleType) formData.append('vehicleType', ticketData.vehicleType);
      if (ticketData.vehicleId) formData.append('vehicleId', ticketData.vehicleId);
      if (ticketData.bookingId) formData.append('bookingId', ticketData.bookingId);

      for (let i = 0; i < ticketData.photos.length; i++) {
        const photo = ticketData.photos[i];
        const filename = `photo_${Date.now()}_${i}.jpg`;
        const fileType = photo.type || 'image/jpeg';

        formData.append('photos', {
          uri: photo.uri,
          type: fileType,
          name: filename,
        });
      }

      response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: formData,
      });
    } else {
      // Use JSON for regular requests without photos
      const jsonBody = {
        userId: ticketData.userId,
        subject: ticketData.subject,
        description: ticketData.description,
        priority: ticketData.priority,
        vehicleType: ticketData.vehicleType,
        vehicleId: ticketData.vehicleId,
        bookingId: ticketData.bookingId,
      };

      // Remove undefined/null values
      Object.keys(jsonBody).forEach(key => {
        if (jsonBody[key] === undefined || jsonBody[key] === null) {
          delete jsonBody[key];
        }
      });

      response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(await getAuthHeaders()),
        },
        body: JSON.stringify(jsonBody),
      });
    }

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Failed to create ticket');
    }

    return data;

  } catch (error) {
    throw error;
  }
};

/**
 * Get all support tickets
 */
export const getAllTickets = async () => {
  try {
    const fullUrl = `${TICKET_BASE_URL}${API_ENDPOINTS.GET_ALL_TICKETS}`;
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(await getAuthHeaders()),
      },
    });
    
    const responseText = await response.text();
    const data = JSON.parse(responseText);
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Failed to fetch tickets');
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a support ticket
 */
export const updateTicket = async (ticketId, updateData) => {
  try {
    const fullUrl = `${TICKET_BASE_URL}${API_ENDPOINTS.UPDATE_TICKET(ticketId)}`;

    const cleanData = {};
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined && updateData[key] !== null && updateData[key] !== '') {
        cleanData[key] = updateData[key];
      }
    });
    
    const formBody = new URLSearchParams(cleanData).toString();

    const response = await fetch(fullUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...(await getAuthHeaders()),
      },
      body: formBody,
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Failed to update ticket');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a support ticket
 */
export const deleteTicket = async (ticketId) => {
  try {
    const fullUrl = `${TICKET_BASE_URL}${API_ENDPOINTS.DELETE_TICKET(ticketId)}`;

    const response = await fetch(fullUrl, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        ...(await getAuthHeaders()),
      },
    });

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Failed to delete ticket');
    }

    return data;
  } catch (error) {
    throw error;
  }
};