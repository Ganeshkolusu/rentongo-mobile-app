import { API_ENDPOINTS, fetchData, fetchFormData, HTTP_METHODS } from '../config/apiConfig';

/**
 * Chat API
 * Handles all chat-related operations
 */

/**
 * Send a message in a booking chat
 * @param {Object} messageData - Message data
 * @param {string} messageData.bookingId - Booking ID
 * @param {string} messageData.senderId - Sender user ID
 * @param {string} messageData.receiverId - Receiver user ID
 * @param {string} messageData.message - Message text
 * @param {Array} messageData.files - Optional file attachments
 * @returns {Promise} Response from API
 */
export const sendMessage = async (messageData) => {
  try {
    if (messageData.files && messageData.files.length > 0) {
      // Try FormData upload first
      try {
        const formData = new FormData();
        formData.append('bookingId', messageData.bookingId);
        formData.append('senderId', messageData.senderId);
        formData.append('receiverId', messageData.receiverId);
        formData.append('message', messageData.message || '');

        for (let index = 0; index < messageData.files.length; index++) {
          const file = messageData.files[index];
          // Get proper file URI - handle both Android and iOS
          let fileUri = file.uri;

          // Ensure proper URI format
          if (fileUri && !fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('http')) {
            fileUri = 'file://' + fileUri;
          }

          // Determine file name and type
          const fileName = file.name || `file_${Date.now()}_${index}.jpg`;
          const fileType = file.type || file.mimeType || 'image/jpeg';

          // React Native FormData file object format
          formData.append('files', {
            uri: fileUri,
            type: fileType,
            name: fileName,
          });
        }
        const response = await fetchFormData(API_ENDPOINTS.SEND_MESSAGE, formData);
        return response;
      } catch (formDataError) {
        // Fallback: Send file info as JSON (without actual file data)
        // This at least records the message with filename
        const response = await fetchData(
          API_ENDPOINTS.SEND_MESSAGE,
          {},
          {
            method: HTTP_METHODS.POST,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              bookingId: messageData.bookingId,
              senderId: messageData.senderId,
              receiverId: messageData.receiverId,
              message: messageData.files[0]?.name || 'File attachment',
              files: messageData.files.map(f => ({
                name: f.name,
                type: f.type || f.mimeType,
                size: f.size,
              })),
            }),
          }
        );
        return response;
      }
    }

    // For text-only messages, use JSON format (React Native FormData has issues)

    const startTime = Date.now();

    const response = await fetchData(
      API_ENDPOINTS.SEND_MESSAGE,
      {},
      {
        method: HTTP_METHODS.POST,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: messageData.bookingId,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          message: messageData.message,
          files: [],
        }),
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;



    // Verify the response indicates success
    if (!response || !response.success) {

    }

    return response;
  } catch (error) {

    throw error;
  }
};

/**
 * Get all messages for a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Array of messages
 */
export const getMessages = async (bookingId) => {
  try {

    if (!bookingId) {

      return { success: true, data: [], message: 'No bookingId provided' };
    }

    // Always fetch by bookingId - this is the chat identifier
    const endpoint = API_ENDPOINTS.GET_MESSAGES(bookingId);

    const response = await fetchData(
      endpoint,
      {},
      { method: HTTP_METHODS.GET }
    );


    return response;
  } catch (error) {
    // Handle 404 "Chat not found" gracefully - this means no messages yet
    const errorMessage = error?.message || '';
    if (errorMessage.includes('404') || errorMessage.includes('Chat not found') || errorMessage.includes('not found')) {

      return {
        success: true,
        data: [],
        message: 'No messages yet'
      };
    }

    throw error;
  }
};

/**
 * Get all chat conversations for a user by fetching their bookings
 * Since backend doesn't have a dedicated chat list endpoint, we use bookings
 * @param {string} userId - User ID
 * @returns {Promise} Array of chat conversations
 */
// Helper function to fetch user details by ID
const fetchUserDetails = async (userId) => {
  try {
    if (!userId) return null;
    const endpoint = API_ENDPOINTS.GET_USER_BY_ID(userId);
    const response = await fetchData(endpoint, {}, { method: HTTP_METHODS.GET });
    const userData = response?.data || response?.user || response;
    return userData;
  } catch (error) {
    return null;
  }
};

// Helper function to fetch multiple users in parallel
const fetchMultipleUsers = async (userIds) => {
  try {
    const uniqueIds = [...new Set(userIds.filter(id => id))]; // Remove duplicates and nulls
    const userPromises = uniqueIds.map(userId => fetchUserDetails(userId));
    const users = await Promise.all(userPromises);

    // Create a map of userId -> user data
    const userMap = {};
    uniqueIds.forEach((userId, index) => {
      if (users[index]) {
        userMap[userId] = users[index];
      }
    });

    return userMap;
  } catch (error) {
    return {};
  }
};

export const getUserChats = async (userId) => {
  try {
    if (!userId) {
      return { success: true, data: [], message: 'No userId provided' };
    }

    // Validate userId format (should be a valid MongoDB ObjectId - 24 hex characters)
    const isValidObjectId = /^[a-f\d]{24}$/i.test(userId);
    if (!isValidObjectId) {
      return { success: false, data: [], message: 'Invalid userId format' };
    }

    // Fetch user's bookings (as customer)
    const myBookingsEndpoint = API_ENDPOINTS.MY_BOOKINGS(userId);
    const response = await fetchData(
      myBookingsEndpoint,
      {},
      { method: HTTP_METHODS.GET }
    );

    // Handle null response (API call was skipped)
    if (response === null) {
      return { success: true, data: [], message: 'API call skipped - user may not be authenticated' };
    }

    // Transform bookings into chat format
    const bookingsArray = response?.data || response?.bookings || response || [];

    // Filter only Confirmed bookings for chat
    const confirmedBookings = Array.isArray(bookingsArray)
      ? bookingsArray.filter(booking => {
        const status = booking.status?.toLowerCase();
        return status === 'confirmed' || status === 'active';
      })
      : [];

    // First, collect all unique user IDs that need to be fetched
    const userIdsToFetch = new Set();
    confirmedBookings.forEach(booking => {
      const owner = booking.owner || booking.ownerId || booking.vehicleDetails?.userId;
      const customer = booking.customer || booking.customerId || booking.userId;

      // Only fetch if they're IDs (strings), not already populated objects
      if (typeof owner === 'string') {
        userIdsToFetch.add(owner);
      }
      if (typeof customer === 'string') {
        userIdsToFetch.add(customer);
      }
    });

    // Fetch all users in parallel ONCE
    const userMap = await fetchMultipleUsers(Array.from(userIdsToFetch));

    // Process bookings and check for messages in parallel
    const chatPromises = confirmedBookings.map(async (booking) => {
      // Extract owner ID - owner is the vehicle owner (vehicleDetails.userId)
      const owner = booking.owner || booking.ownerId || booking.vehicleDetails?.userId;
      const ownerId = typeof owner === 'object' ? owner?._id : owner;

      // Extract customer ID - customer is the person who made the booking (booking.userId)
      const customer = booking.customer || booking.customerId || booking.userId;
      const customerId = typeof customer === 'object' ? customer?._id : customer;

      // Get names from either populated data OR from userMap
      let ownerName = null;
      let customerName = null;

      // Check if owner is populated object
      if (typeof owner === 'object' && owner) {
        ownerName = owner.name || owner.firstName || owner.username ||
          (owner.firstName && owner.lastName ? `${owner.firstName} ${owner.lastName}`.trim() : null);
      } else if (ownerId && userMap[ownerId]) {
        // Fetch from userMap
        const ownerData = userMap[ownerId];
        ownerName = ownerData.name || ownerData.firstName || ownerData.username ||
          (ownerData.firstName && ownerData.lastName ? `${ownerData.firstName} ${ownerData.lastName}`.trim() : null);
      }

      // Check if customer is populated object
      if (typeof customer === 'object' && customer) {
        customerName = customer.name || customer.firstName || customer.username ||
          (customer.firstName && customer.lastName ? `${customer.firstName} ${customer.lastName}`.trim() : null);
      } else if (customerId && userMap[customerId]) {
        // Fetch from userMap
        const customerData = userMap[customerId];
        customerName = customerData.name || customerData.firstName || customerData.username ||
          (customerData.firstName && customerData.lastName ? `${customerData.firstName} ${customerData.lastName}`.trim() : null);
      }

      // Extract vehicle info
      const vehicle = booking.vehicle || booking.vehicleId || booking.vehicleDetails;
      const vehicleName = typeof vehicle === 'object'
        ? (vehicle?.CarName || vehicle?.bikeName || vehicle?.name || vehicle?.model || vehicle?.brand)
        : booking.vehicleName;

      // Try to get owner name from vehicle details if user fetch failed
      if (!ownerName && typeof vehicle === 'object') {
        const vehicleOwnerName = vehicle?.ownerName || vehicle?.owner_name || vehicle?.contactName || vehicle?.userName;
        if (vehicleOwnerName) {
          ownerName = vehicleOwnerName;
        }
      }

      // Check if this chat has any messages
      try {
        const messagesResponse = await getMessages(booking._id);
        const messages = messagesResponse?.data || messagesResponse?.messages || [];

        // Only include chats that have at least one message
        if (Array.isArray(messages) && messages.length > 0) {
          // Get the last message
          const lastMsg = messages[messages.length - 1];

          return {
            _id: booking._id,
            bookingId: booking._id,
            ownerId: ownerId,
            ownerName: ownerName || 'Vehicle Owner',
            customerId: customerId,
            customerName: customerName || 'Customer',
            vehicleId: typeof vehicle === 'object' ? vehicle?._id : booking.vehicleId,
            vehicleInfo: typeof vehicle === 'object' ? vehicle : { name: vehicleName },
            vehicleName: vehicleName,
            lastMessage: lastMsg?.message || 'New message',
            lastMessageTime: lastMsg?.createdAt || lastMsg?.timestamp,
            updatedAt: booking.updatedAt || booking.createdAt,
            status: booking.status,
          };
        }
      } catch (msgError) {
        // Silently skip bookings without messages
      }

      return null; // Return null for bookings without messages
    });

    // Wait for all message checks to complete
    const allResults = await Promise.all(chatPromises);

    // Filter out null results (bookings without messages)
    const chatsWithMessages = allResults.filter(chat => chat !== null);

    return { success: true, data: chatsWithMessages };
  } catch (error) {
    const errorMessage = error?.message || '';
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return { success: true, data: [], message: 'No chats yet' };
    }

    return { success: true, data: [], message: 'Error fetching chats' };
  }
};
