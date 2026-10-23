/**
 * Firebase Storage Utility
 * Upload files to Firebase Storage and get download URLs
 */

import storage from '@react-native-firebase/storage';

/**
 * Upload a file to Firebase Storage
 * @param {string} uri - Local file URI
 * @param {string} fileName - Name for the file
 * @param {string} folder - Folder path in storage (e.g., 'chat-images')
 * @returns {Promise<{url: string, path: string}>} Download URL and storage path
 */
export const uploadFileToStorage = async (uri, fileName, folder = 'chat-files') => {
  try {
    // Validate URI
    if (!uri) {
      throw new Error('No file URI provided');
    }

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    // Clean filename - remove special characters
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${timestamp}_${cleanFileName}`;
    const storagePath = `${folder}/${uniqueFileName}`;

    // Ensure proper URI format for putFile
    let fileUri = uri;

    // On Android, ensure we have proper file:// prefix
    if (!fileUri.startsWith('file://') && !fileUri.startsWith('content://') && !fileUri.startsWith('http')) {
      fileUri = 'file://' + fileUri;
    }

    // Create storage reference
    const reference = storage().ref(storagePath);

    // Upload file
    const task = reference.putFile(fileUri);

    // Monitor upload progress
    task.on('state_changed', (snapshot) => {
      const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      // console.log(`[FirebaseStorage] Upload progress: ${progress}%`);
    });

    // Wait for upload to complete
    await task;

    // Get download URL
    const downloadUrl = await reference.getDownloadURL();

    return {
      url: downloadUrl,
      path: storagePath,
      fileName: uniqueFileName,
    };
  } catch (error) {
    // Provide more specific error messages
    if (error.code === 'storage/unauthorized') {
      throw new Error('Firebase Storage access denied. Please check storage rules in Firebase Console.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Upload was canceled');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Unknown error occurred. Please try again.');
    } else if (error.message?.includes('No such file')) {
      throw new Error('File not found. Please try selecting the image again.');
    }

    throw error;
  }
};

/**
 * Upload multiple files to Firebase Storage
 * @param {Array} files - Array of file objects with uri and name
 * @param {string} folder - Folder path in storage
 * @returns {Promise<Array>} Array of upload results with URLs
 */
export const uploadMultipleFiles = async (files, folder = 'chat-files') => {
  try {
    const uploadPromises = files.map(async (file) => {
      const result = await uploadFileToStorage(file.uri, file.name, folder);
      return {
        ...file,
        url: result.url,
        storagePath: result.path,
      };
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} storagePath - Path to the file in storage
 */
export const deleteFileFromStorage = async (storagePath) => {
  try {
    const reference = storage().ref(storagePath);
    await reference.delete();
  } catch (error) {
    throw error;
  }
};

/**
 * Upload chat image and return URL
 * @param {object} file - File object with uri, name, mimeType
 * @param {string} bookingId - Booking ID for folder organization
 * @returns {Promise<string>} Download URL
 */
export const uploadChatImage = async (file, bookingId) => {
  try {
    const folder = `chat-images/${bookingId}`;
    const result = await uploadFileToStorage(file.uri, file.name, folder);
    return result.url;
  } catch (error) {
    throw error;
  }
};
