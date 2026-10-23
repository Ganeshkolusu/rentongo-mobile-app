/**
 * File Utilities for Document Upload in Chat
 * Handles document picking, validation, and upload
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking, Platform } from 'react-native';

// File size limit (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  // Documents
  PDF: {
    mimeTypes: ['application/pdf'],
    extensions: ['.pdf'],
    icon: 'document-text',
    color: '#E74C3C',
    label: 'PDF',
  },
  WORD: {
    mimeTypes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    extensions: ['.doc', '.docx'],
    icon: 'document',
    color: '#2B579A',
    label: 'Word',
  },
  EXCEL: {
    mimeTypes: [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    extensions: ['.xls', '.xlsx'],
    icon: 'grid',
    color: '#217346',
    label: 'Excel',
  },
  // Images
  IMAGE: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    icon: 'image',
    color: '#9B59B6',
    label: 'Image',
  },
};

// All supported MIME types for document picker
export const ALL_SUPPORTED_MIME_TYPES = [
  ...SUPPORTED_FILE_TYPES.PDF.mimeTypes,
  ...SUPPORTED_FILE_TYPES.WORD.mimeTypes,
  ...SUPPORTED_FILE_TYPES.EXCEL.mimeTypes,
  ...SUPPORTED_FILE_TYPES.IMAGE.mimeTypes,
];

/**
 * Get file type info based on MIME type or extension
 * @param {string} mimeType - MIME type of the file
 * @param {string} fileName - File name (for extension fallback)
 * @returns {Object} File type info with icon, color, and label
 */
export const getFileTypeInfo = (mimeType, fileName = '') => {
  const extension = fileName.toLowerCase().split('.').pop();

  // Check by MIME type first
  for (const [key, typeInfo] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (typeInfo.mimeTypes.includes(mimeType)) {
      return { type: key, ...typeInfo };
    }
  }

  // Fallback to extension check
  for (const [key, typeInfo] of Object.entries(SUPPORTED_FILE_TYPES)) {
    if (typeInfo.extensions.some(ext => ext.replace('.', '') === extension)) {
      return { type: key, ...typeInfo };
    }
  }

  // Default to generic document
  return {
    type: 'UNKNOWN',
    icon: 'document-attach',
    color: '#7F8C8D',
    label: 'File',
  };
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(size < 10 ? 1 : 0)} ${units[unitIndex]}`;
};

/**
 * Validate file before upload
 * @param {Object} file - File object from document picker
 * @returns {Object} { valid: boolean, error: string | null }
 */
export const validateFile = (file) => {
  // Check if file exists
  if (!file || !file.uri) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file size
  if (file.size && file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(MAX_FILE_SIZE)} limit. Selected file is ${formatFileSize(file.size)}.`,
    };
  }

  // Check file type
  const fileTypeInfo = getFileTypeInfo(file.mimeType, file.name);
  if (fileTypeInfo.type === 'UNKNOWN') {
    return {
      valid: false,
      error: 'Unsupported file type. Please select PDF, Word, Excel, or image files.',
    };
  }

  return { valid: true, error: null };
};

/**
 * Pick a document using expo-document-picker
 * @param {string} type - 'all' | 'pdf' | 'word' | 'excel' | 'image'
 * @returns {Promise<Object|null>} Selected file info or null if cancelled
 */
export const pickDocument = async (type = 'all') => {
  try {
    let mimeTypes = ALL_SUPPORTED_MIME_TYPES;

    // Filter by specific type if requested
    if (type === 'pdf') {
      mimeTypes = SUPPORTED_FILE_TYPES.PDF.mimeTypes;
    } else if (type === 'word') {
      mimeTypes = SUPPORTED_FILE_TYPES.WORD.mimeTypes;
    } else if (type === 'excel') {
      mimeTypes = SUPPORTED_FILE_TYPES.EXCEL.mimeTypes;
    } else if (type === 'image') {
      mimeTypes = SUPPORTED_FILE_TYPES.IMAGE.mimeTypes;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: mimeTypes,
      copyToCacheDirectory: true,
      multiple: false,
    });

    // Handle cancellation
    if (result.canceled) {
      return null;
    }

    // Get the first asset (single file selection)
    const asset = result.assets?.[0];
    if (!asset) {
      return null;
    }

    // Build file object
    const file = {
      uri: asset.uri,
      name: asset.name,
      size: asset.size,
      mimeType: asset.mimeType,
      ...getFileTypeInfo(asset.mimeType, asset.name),
    };

    // Validate the file
    const validation = validateFile(file);
    if (!validation.valid) {
      Alert.alert('Invalid File', validation.error);
      return null;
    }

    return file;
  } catch (error) {
    Alert.alert('Error', 'Failed to pick document. Please try again.');
    return null;
  }
};

/**
 * Pick an image using expo-image-picker
 * @param {string} source - 'camera' | 'library'
 * @returns {Promise<Object|null>} Selected image info or null if cancelled
 */
export const pickImage = async (source = 'library') => {
  try {
    // Request permissions
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return null;
      }
    } else {
      // Android 13+ uses Photo Picker which doesn't require permissions
      if (Platform.OS !== 'android' || Platform.Version < 33) {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Photo library permission is required to select images.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return null;
        }
      }
    }

    // Pick or take image
    const pickerFunction = source === 'camera'
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await pickerFunction({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets?.[0];
    if (!asset) {
      return null;
    }

    // Get file info
    let fileInfo = { size: 0 };
    try {
      fileInfo = await FileSystem.getInfoAsync(asset.uri);
    } catch (e) {
      // console.log('[fileUtils] Could not get file info:', e);
    }

    // Generate file name if not available
    const fileName = asset.fileName || `image_${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    const file = {
      uri: asset.uri,
      name: fileName,
      size: fileInfo.size || asset.fileSize || 0,
      mimeType: mimeType,
      width: asset.width,
      height: asset.height,
      ...getFileTypeInfo(mimeType, fileName),
    };

    // Validate file size
    const validation = validateFile(file);
    if (!validation.valid) {
      Alert.alert('Invalid File', validation.error);
      return null;
    }

    return file;
  } catch (error) {
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

/**
 * Open a file URL (download or view)
 * @param {string} url - File URL to open
 * @param {string} fileName - File name for display
 */
export const openFile = async (url, fileName = 'file') => {
  try {
    if (!url) {
      Alert.alert('Error', 'File URL is not available');
      return;
    }

    // Check if URL can be opened
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Cannot Open File',
        'Unable to open this file. Would you like to copy the link?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Copy Link',
            onPress: () => {
              // Note: Clipboard API would need to be imported separately
              Alert.alert('Link', url);
            },
          },
        ]
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to open file');
  }
};

/**
 * Download file to device
 * @param {string} url - File URL to download
 * @param {string} fileName - File name for saving
 * @returns {Promise<string|null>} Local file path or null if failed
 */
export const downloadFile = async (url, fileName) => {
  try {
    if (!url) {
      throw new Error('No URL provided');
    }

    const downloadDir = FileSystem.documentDirectory;
    const localUri = `${downloadDir}${fileName}`;
    const downloadResult = await FileSystem.downloadAsync(url, localUri);

    if (downloadResult.status === 200) {
      return downloadResult.uri;
    } else {
      throw new Error(`Download failed with status ${downloadResult.status}`);
    }
  } catch (error) {
    Alert.alert('Download Failed', 'Unable to download file. Please try again.');
    return null;
  }
};

export default {
  MAX_FILE_SIZE,
  SUPPORTED_FILE_TYPES,
  ALL_SUPPORTED_MIME_TYPES,
  getFileTypeInfo,
  formatFileSize,
  validateFile,
  pickDocument,
  pickImage,
  openFile,
  downloadFile,
};
