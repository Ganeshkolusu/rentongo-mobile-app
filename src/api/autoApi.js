import { API_ENDPOINTS, HTTP_METHODS, fetchFormData, fetchData } from '../config/apiConfig';

/**
 * Auto API
 * Handles all auto vehicle operations
 */

/**
 * Create a new auto listing
 * @param {Object} autoData - Auto data including images
 * @param {string} autoData.userId - Owner user ID
 * @param {string} autoData.AutoNumber - Auto registration number
 * @param {string} autoData.description - Auto description
 * @param {number} autoData.pricePerKm - Price per kilometer
 * @param {string} autoData.contactNumber - Contact number
 * @param {string} autoData.contactName - Contact name
 * @param {number} autoData.latitude - Location latitude
 * @param {number} autoData.longitude - Location longitude
 * @param {Array} autoData.autoImages - Array of auto images
 * @returns {Promise} Response from API
 */
export const createAuto = async (autoData) => {
  try {
    const formData = new FormData();

    // Add text fields
    formData.append('userId', autoData.userId);
    formData.append('AutoNumber', autoData.AutoNumber);
    formData.append('description', autoData.description);
    formData.append('pricePerKm', autoData.pricePerKm.toString());
    formData.append('contactNumber', autoData.contactNumber);
    formData.append('contactName', autoData.contactName);
    formData.append('latitude', autoData.latitude.toString());
    formData.append('longitude', autoData.longitude.toString());

    // Add images if provided
    if (autoData.autoImages && autoData.autoImages.length > 0) {
      autoData.autoImages.forEach((image, index) => {
        formData.append('autoImages', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `auto_${index}.jpg`,
        });
      });
    }

    const response = await fetchFormData(API_ENDPOINTS.CREATE_AUTO, formData);
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Update an auto listing
 * @param {string} autoId - Auto ID
 * @param {Object} updateData - Data to update
 * @returns {Promise} Response from API
 */
export const updateAuto = async (autoId, updateData) => {
  try {
    const formData = new FormData();

    // Add fields to update
    Object.keys(updateData).forEach(key => {
      if (key === 'autoImages' && Array.isArray(updateData[key])) {
        updateData[key].forEach((image, index) => {
          formData.append('autoImages', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || `auto_${index}.jpg`,
          });
        });
      } else if (updateData[key] !== null && updateData[key] !== undefined) {
        formData.append(key, updateData[key].toString());
      }
    });

    const response = await fetchFormData(
      API_ENDPOINTS.UPDATE_AUTO(autoId),
      formData,
      { method: HTTP_METHODS.PUT }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Delete an auto listing
 * @param {string} autoId - Auto ID
 * @returns {Promise} Response from API
 */
export const deleteAuto = async (autoId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.DELETE_AUTO(autoId),
      {},
      { method: HTTP_METHODS.DELETE }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get nearby autos
 * @param {Object} params - Query parameters
 * @param {number} params.latitude - User latitude
 * @param {number} params.longitude - User longitude
 * @param {number} params.range - Search range in kilometers
 * @returns {Promise} Array of nearby autos
 */
export const getNearbyAutos = async (params) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.GET_NEARBY_AUTOS,
      params,
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};

/**
 * Get auto by ID
 * @param {string} autoId - Auto ID
 * @returns {Promise} Auto details
 */
export const getAutoById = async (autoId) => {
  try {
    const response = await fetchData(
      API_ENDPOINTS.GET_AUTO_BY_ID(autoId),
      {},
      { method: HTTP_METHODS.GET }
    );
    return response;
  } catch (error) {
    // Silent catch
    throw error;
  }
};
