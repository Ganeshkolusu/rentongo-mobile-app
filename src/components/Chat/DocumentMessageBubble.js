/**
 * DocumentMessageBubble Component
 * Renders document/file attachments in chat messages
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { BorderRadius, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';
import { formatFileSize, getFileTypeInfo, openFile } from '../../utils/fileUtils';

const DocumentMessageBubble = ({
  file,
  isUserMessage = false,
  onPress,
  showPreview = true,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Get file type info
  const fileInfo = getFileTypeInfo(file.mimeType || file.type, file.name || file.fileName);
  const fileUrl = file.url || file.uri;
  const fileName = file.name || file.fileName || 'Unknown file';
  const fileSize = file.size ? formatFileSize(file.size) : '';

  // Check if file is an image - check multiple ways
  const mimeType = (file.mimeType || file.type || '').toLowerCase();
  const extension = fileName.toLowerCase().split('.').pop();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif'];
  const isImage = fileInfo.type === 'IMAGE' ||
    mimeType.startsWith('image/') ||
    imageExtensions.includes(extension);

  // Check if we have a valid URL to display
  // Valid URLs are http/https URLs or local file:// URIs
  const hasValidUrl = fileUrl &&
    fileUrl.length > 0 &&
    fileUrl !== 'null' &&
    fileUrl !== 'undefined' &&
    (fileUrl.startsWith('http://') ||
      fileUrl.startsWith('https://') ||
      fileUrl.startsWith('file://') ||
      fileUrl.startsWith('content://'));

  // Handle file press
  const handlePress = async () => {
    if (onPress) {
      onPress(file);
      return;
    }

    if (fileUrl) {
      setDownloading(true);
      await openFile(fileUrl, fileName);
      setDownloading(false);
    }
  };

  // Render image preview
  const renderImagePreview = () => {
    if (!isImage || !showPreview || imageError) {
      return null;
    }

    // If no valid URL, show placeholder with image icon
    if (!hasValidUrl) {
      return (
        <View style={[
          styles.imageContainer,
          styles.imagePlaceholder,
          isUserMessage ? styles.imageContainerUser : styles.imageContainerOwner
        ]}>
          <Ionicons name="image-outline" size={48} color={Colors.text.secondary} />
          <Text style={styles.placeholderText}>{fileName}</Text>
          <Text style={styles.placeholderSubtext}>Image not available</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <View style={[
          styles.imageContainer,
          isUserMessage ? styles.imageContainerUser : styles.imageContainerOwner
        ]}>
          {imageLoading && (
            <View style={styles.imageLoader}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
          <Image
            source={{ uri: fileUrl }}
            style={[styles.imagePreview, imageLoading && styles.imageHidden]}
            resizeMode="cover"
            onLoad={() => {
              setImageLoading(false);
            }}
            onError={(e) => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          {/* Expand overlay */}
          {!imageLoading && (
            <View style={styles.imageOverlay}>
              <Ionicons name="expand-outline" size={18} color={Colors.white} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render document file (non-image)
  const renderDocumentFile = () => {
    if (isImage && showPreview && !imageError) {
      return null;
    }

    const BubbleWrapper = isUserMessage ? LinearGradient : View;
    const bubbleProps = isUserMessage
      ? {
        colors: ['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.2)'],
        start: { x: 0, y: 0 },
        end: { x: 1, y: 1 },
        style: styles.documentBubbleUser,
      }
      : {
        style: styles.documentBubbleOwner,
      };

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <BubbleWrapper {...bubbleProps}>
          <View style={styles.documentContent}>
            {/* File icon */}
            <View style={[styles.iconContainer, { backgroundColor: fileInfo.color + '20' }]}>
              <Ionicons name={fileInfo.icon} size={24} color={fileInfo.color} />
            </View>

            {/* File info */}
            <View style={styles.fileInfoContainer}>
              <Text
                style={[
                  styles.fileName,
                  isUserMessage ? styles.fileNameUser : styles.fileNameOwner,
                ]}
                numberOfLines={2}
                ellipsizeMode="middle"
              >
                {fileName}
              </Text>
              <View style={styles.fileMetaRow}>
                <Text
                  style={[
                    styles.fileType,
                    isUserMessage ? styles.fileTypeUser : styles.fileTypeOwner,
                  ]}
                >
                  {fileInfo.label}
                </Text>
                {fileSize ? (
                  <>
                    <Text style={styles.fileMeta}> • </Text>
                    <Text
                      style={[
                        styles.fileSize,
                        isUserMessage ? styles.fileSizeUser : styles.fileSizeOwner,
                      ]}
                    >
                      {fileSize}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>

            {/* Download/open indicator */}
            <View style={styles.actionIcon}>
              {downloading ? (
                <ActivityIndicator size="small" color={isUserMessage ? Colors.white : Colors.primary} />
              ) : (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={isUserMessage ? 'rgba(255,255,255,0.8)' : Colors.primary}
                />
              )}
            </View>
          </View>
        </BubbleWrapper>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderImagePreview()}
      {renderDocumentFile()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.xs,
  },

  // Image styles
  imageContainer: {
    position: 'relative',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    maxWidth: 220,
    maxHeight: 220,
  },
  imageContainerUser: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  imageContainerOwner: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imagePlaceholder: {
    width: 200,
    height: 150,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  placeholderText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    maxWidth: 180,
  },
  placeholderSubtext: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.lg - 2,
  },
  imageHidden: {
    opacity: 0,
  },
  imageLoader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    width: 200,
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
  },

  // Document styles
  documentBubbleUser: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    minWidth: 200,
    maxWidth: 260,
  },
  documentBubbleOwner: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    minWidth: 200,
    maxWidth: 260,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  documentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  fileInfoContainer: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  fileName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 2,
  },
  fileNameUser: {
    color: Colors.white,
  },
  fileNameOwner: {
    color: Colors.text.primary,
  },
  fileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileType: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  fileTypeUser: {
    color: 'rgba(255,255,255,0.8)',
  },
  fileTypeOwner: {
    color: Colors.text.secondary,
  },
  fileMeta: {
    color: Colors.text.secondary,
  },
  fileSize: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  fileSizeUser: {
    color: 'rgba(255,255,255,0.7)',
  },
  fileSizeOwner: {
    color: Colors.text.secondary,
  },
  actionIcon: {
    padding: Spacing.xs,
  },
});

export default DocumentMessageBubble;
