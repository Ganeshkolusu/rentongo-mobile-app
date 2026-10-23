import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/apiConfig';

const __DEV__ = process.env.NODE_ENV === 'development';

/**
 * Auth header for every request — reads the app-issued JWT saved at login.
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
 * Build full URL with query parameters
 * @param {string|function} endpoint - API endpoint path or function
 * @param {object} params - Query parameters
 * @returns {string} Full URL with query parameters
 */
export const buildUrl = (endpoint, params = {}) => {
  const resolvedEndpoint = typeof endpoint === 'function' ? endpoint() : endpoint;

  let url = `${API_CONFIG.BASE_URL}${resolvedEndpoint}`;

  const queryParams = Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  if (queryParams) {
    url += `?${queryParams}`;
  }

  return url;
};

/**
 * Base request handler with error handling and retry logic
 * @param {string} url - Full URL
 * @param {object} options - Fetch options
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise} API response data
 */
const baseRequest = async (url, options = {}, retryCount = 0) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  try {
    if (__DEV__) {
    }

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (__DEV__) {
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : null;

    if (__DEV__) {
    }

    return data;

  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection.');
    }

    // Retry logic
    if (retryCount < API_CONFIG.RETRY_ATTEMPTS - 1) {
      if (__DEV__) {
      }
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * (retryCount + 1)));
      return baseRequest(url, options, retryCount + 1);
    }

    // Silently fail - don't show error to user
    // The app will use fallback data instead

    throw error;
  }
};

/**
 * GET request
 * @param {string|function} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const get = async (endpoint, params = {}, headers = {}) => {
  const url = buildUrl(endpoint, params);

  const options = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
      ...headers,
    },
  };

  return baseRequest(url, options);
};

/**
 * POST request with JSON body
 * @param {string|function} endpoint - API endpoint
 * @param {object} data - Request body data
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const post = async (endpoint, data = {}, headers = {}) => {
  const url = buildUrl(endpoint);

  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
      ...headers,
    },
    body: JSON.stringify(data),
  };

  return baseRequest(url, options);
};

/**
 * POST request with URL-encoded body
 * @param {string|function} endpoint - API endpoint
 * @param {object} data - Request body data
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const postUrlEncoded = async (endpoint, data = {}, headers = {}) => {
  const url = buildUrl(endpoint);

  const formBody = Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');

  const options = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(await getAuthHeaders()),
      ...headers,
    },
    body: formBody,
  };

  return baseRequest(url, options);
};

/**
 * POST request with FormData (multipart/form-data)
 * Uses XMLHttpRequest for better mobile file upload handling
 * @param {string|function} endpoint - API endpoint
 * @param {FormData} formData - FormData object
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const postFormData = async (endpoint, formData, headers = {}) => {
  const url = buildUrl(endpoint);
  // Use longer timeout for file uploads (2 minutes)
  const timeout = 120000;
  const mergedHeaders = { ...(await getAuthHeaders()), ...headers };

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Set timeout for file uploads
    xhr.timeout = timeout;

    xhr.ontimeout = () => {
      reject(new Error('Upload timeout. Please check your connection and try again.'));
    };

    xhr.onerror = (e) => {
      reject(new Error('Network error. Please check your internet connection.'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          resolve(responseData);
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
      }
    };

    xhr.open('POST', url);

    // Set Accept header
    xhr.setRequestHeader('Accept', 'application/json');

    // Set any additional headers (but NOT Content-Type for FormData)
    Object.keys(mergedHeaders).forEach(key => {
      if (key.toLowerCase() !== 'content-type') {
        xhr.setRequestHeader(key, mergedHeaders[key]);
      }
    });

    // Send FormData
    xhr.send(formData);
  });
};

/**
 * PUT request with JSON body
 * @param {string|function} endpoint - API endpoint
 * @param {object} data - Request body data
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const put = async (endpoint, data = {}, headers = {}) => {
  const url = buildUrl(endpoint);

  const options = {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
      ...headers,
    },
    body: JSON.stringify(data),
  };

  return baseRequest(url, options);
};

/**
 * PUT request with URL-encoded body
 * @param {string|function} endpoint - API endpoint
 * @param {object} data - Request body data
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const putUrlEncoded = async (endpoint, data = {}, headers = {}) => {
  const url = buildUrl(endpoint);

  const formBody = Object.keys(data)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
    .join('&');

  const options = {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(await getAuthHeaders()),
      ...headers,
    },
    body: formBody,
  };

  return baseRequest(url, options);
};

/**
 * PUT request with FormData (multipart/form-data)
 * Uses XMLHttpRequest for better mobile file upload handling
 * @param {string|function} endpoint - API endpoint
 * @param {FormData} formData - FormData object
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const putFormData = async (endpoint, formData, headers = {}) => {
  const url = buildUrl(endpoint);
  // Use longer timeout for file uploads (2 minutes)
  const timeout = 120000;
  const mergedHeaders = { ...(await getAuthHeaders()), ...headers };

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Set timeout for file uploads
    xhr.timeout = timeout;

    xhr.ontimeout = () => {
      reject(new Error('Upload timeout. Please check your connection and try again.'));
    };

    xhr.onerror = () => {
      reject(new Error('Network error. Please check your internet connection.'));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = xhr.responseText ? JSON.parse(xhr.responseText) : null;
          resolve(responseData);
        } catch (parseError) {
          reject(new Error(`Failed to parse response: ${parseError.message}`));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`));
      }
    };

    xhr.open('PUT', url);

    // Set Accept header
    xhr.setRequestHeader('Accept', 'application/json');

    // Set any additional headers (but NOT Content-Type for FormData)
    Object.keys(mergedHeaders).forEach(key => {
      if (key.toLowerCase() !== 'content-type') {
        xhr.setRequestHeader(key, mergedHeaders[key]);
      }
    });

    // Send FormData
    xhr.send(formData);
  });
};

/**
 * PATCH request
 * @param {string|function} endpoint - API endpoint
 * @param {object} data - Request body data
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const patch = async (endpoint, data = {}, headers = {}) => {
  const url = buildUrl(endpoint);

  const options = {
    method: 'PATCH',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
      ...headers,
    },
    body: JSON.stringify(data),
  };

  return baseRequest(url, options);
};

/**
 * DELETE request
 * @param {string|function} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @param {object} headers - Additional headers
 * @returns {Promise} API response data
 */
export const del = async (endpoint, params = {}, headers = {}) => {
  const url = buildUrl(endpoint, params);

  const options = {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(await getAuthHeaders()),
      ...headers,
    },
  };

  return baseRequest(url, options);
};

// Export default object with all methods
export default {
  get,
  post,
  postUrlEncoded,
  postFormData,
  put,
  putUrlEncoded,
  putFormData,
  patch,
  delete: del,
  buildUrl,
};
