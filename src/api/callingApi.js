import { API_ENDPOINTS, HTTP_METHODS, fetchData } from '../config/apiConfig';

/**
 * Calling API
 * Handles all calling-related operations (WebRTC signaling)
 */

/**
 * Start a call
 * @param {Object} callData - Call initiation data
 * @param {string} callData.callerId - Caller user ID
 * @param {string} callData.receiverId - Receiver user ID
 * @param {string} callData.callType - Type of call (audio/video)
 * @param {Object} callData.offer - WebRTC offer
 * @returns {Promise} Response from API
 */
export const startCall = async (callData) => {
  try {

    const params = {
      callerId: callData.callerId,
      receiverId: callData.receiverId,
      callType: callData.callType,
      callerSocketId: callData.callerSocketId,
      // bookingId: callData.bookingId,
      // offer: callData.offer || {},
    };



    const startTime = Date.now();
    // Use fetchData with JSON body (backend expects JSON, not FormData)
    // fetchData now uses XMLHttpRequest internally for better mobile timeout handling
    const response = await fetchData(
      API_ENDPOINTS.START_CALL,
      {},
      {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(params),
      }
    );
    const endTime = Date.now();
    const duration = endTime - startTime;


    if (response && response.success) {

    } else {

    }

    return response;
  } catch (error) {

    throw error;
  }
};

/**
 * Answer a call
 * @param {Object} answerData - Call answer data
 * @param {string} answerData.callId - Call ID
 * @param {Object} answerData.answer - WebRTC answer
 * @returns {Promise} Response from API
 */
export const answerCall = async (answerData) => {
  try {


    // Use fetchData with JSON body (backend expects JSON)
    const response = await fetchData(
      API_ENDPOINTS.ANSWER_CALL,
      {},
      {
        method: HTTP_METHODS.POST,
        body: JSON.stringify(answerData),
      }
    );


    return response;
  } catch (error) {

    throw error;
  }
};

/**
 * End a call
 * @param {string} callId - Call ID
 * @returns {Promise} Response from API
 */
export const endCall = async (callId) => {
  try {


    // Use fetchData with JSON body (backend expects JSON)
    const response = await fetchData(
      API_ENDPOINTS.END_CALL,
      {},
      {
        method: HTTP_METHODS.POST,
        body: JSON.stringify({ callId }),
      }
    );


    return response;
  } catch (error) {

    throw error;
  }
};

/**
 * Reject a call
 * @param {string} callId - Call ID
 * @returns {Promise} Response from API
 */
export const rejectCall = async (callId) => {
  try {


    // Use fetchData with JSON body (backend expects JSON)
    const response = await fetchData(
      API_ENDPOINTS.REJECT_CALL,
      {},
      {
        method: HTTP_METHODS.POST,
        body: JSON.stringify({ callId }),
      }
    );


    return response;
  } catch (error) {

    throw error;
  }
};

/**
 * Get call history for a user
 * @param {string} userId - User ID
 * @returns {Promise} Array of call history
 */
export const getCallHistory = async (userId) => {
  try {


    const response = await fetchData(
      API_ENDPOINTS.GET_CALL_HISTORY(userId),
      {},
      { method: HTTP_METHODS.GET }
    );


    return response;
  } catch (error) {

    throw error;
  }
};
