import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMessages, sendMessage } from '../api/chatApi';
import { Colors } from '../constants/Colors';
import { BorderRadius, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ChatScreen = ({ navigation, route }) => {
    const {
        ownerName,
        ownerAvatar,
        vehicleInfo,
        vehicleId,
        bookingId,
        receiverId,
        customerName,
        ownerId,
        customerId,
    } = route.params || {};

    const { user } = useAuth();
    const { isConnected, socket } = useSocket();
    const insets = useSafeAreaInsets();
    
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const flatListRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const attachmentAnimValue = useRef(new Animated.Value(0)).current;

    // ✅ Calculate bottom padding for Android navigation bar
    const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 20) : insets.bottom;

    const currentUserId = user?.userId || user?._id || user?.id;

    // Determine if current user is owner (compare as strings to handle type mismatches)
    let isOwner = false;
    if (ownerId && String(currentUserId) === String(ownerId)) {
        isOwner = true;
    } else if (customerId && String(currentUserId) === String(customerId)) {
        isOwner = false;
    } else {
        if (receiverId) {
            if (String(receiverId) === String(customerId)) {
                isOwner = true;
            } else if (String(receiverId) === String(ownerId)) {
                isOwner = false;
            }
        }
    }

    // Determine chat partner name:
    // - If I am OWNER, show CUSTOMER's name
    // - If I am CUSTOMER, show OWNER's name
    const getDisplayName = () => {
        if (isOwner) {
            // I am owner, show customer name
            return customerName || 'Customer';
        } else {
            // I am customer, show owner name
            // If no owner name, try to show vehicle info as context
            if (ownerName && ownerName !== 'Owner') {
                return ownerName;
            }
            // Fallback: show vehicle info if available
            if (vehicleInfo && vehicleInfo !== 'Vehicle') {
                return `${vehicleInfo} Owner`;
            }
            return 'Vehicle Owner';
        }
    };

    // ✅ Add state for chat partner details
    const [chatPartnerDetails, setChatPartnerDetails] = useState({
        name: getDisplayName(),
        avatar: isOwner ? null : ownerAvatar
    });

    // Update chat partner details when isOwner or names change
    useEffect(() => {
        setChatPartnerDetails({
            name: getDisplayName(),
            avatar: isOwner ? null : ownerAvatar
        });
    }, [isOwner, customerName, ownerName, ownerAvatar]);

    const otherUserId = isOwner ? customerId : ownerId;
    const otherUserName = isOwner ? customerName : ownerName;

    const senderId = currentUserId;

    let actualReceiverId = receiverId;
    if (!actualReceiverId) {
        if (isOwner && customerId) {
            actualReceiverId = customerId;
        } else if (!isOwner && ownerId) {
            actualReceiverId = ownerId;
        }
    }

    if (!actualReceiverId) {
        if (customerId && ownerId) {
            actualReceiverId = (currentUserId === ownerId) ? customerId : ownerId;
        } else if (customerId) {
            actualReceiverId = customerId;
        } else if (ownerId) {
            actualReceiverId = ownerId;
        }
    }

    // Helper function to check if URL is an image
    const isImageUrl = (url) => {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        return lowerUrl.endsWith('.jpg') || 
               lowerUrl.endsWith('.jpeg') || 
               lowerUrl.endsWith('.png') || 
               lowerUrl.endsWith('.gif') || 
               lowerUrl.endsWith('.webp') ||
               lowerUrl.includes('.jpg?') ||
               lowerUrl.includes('.jpeg?') ||
               lowerUrl.includes('.png?');
    };

    const hasInitiallyLoaded = useRef(false);
    const pollingIntervalRef = useRef(null);

    useFocusEffect(
        useCallback(() => {
            if (bookingId && !hasInitiallyLoaded.current) {
                hasInitiallyLoaded.current = true;
                fetchMessages();
            }

            // Real-time delivery is handled by the socket ('receiveMessage',
            // wired up below) — this is only a safety net for a missed
            // socket event, so it runs rarely rather than driving the UI.
            pollingIntervalRef.current = setInterval(() => {
                if (bookingId) {
                    fetchMessages();
                }
            }, 30000);

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }, [bookingId])
    );

    useEffect(() => {
        if (bookingId) {
            if (isConnected && socket) {
                socket.joinChatRoom(bookingId);

                socket.onMessageReceived((newMessage) => {
                    const currentUserId = user?.userId || user?._id || user?.id;

                    let messageSenderId = null;
                    if (typeof newMessage.senderId === 'string') {
                        messageSenderId = newMessage.senderId;
                    } else if (newMessage.senderId?._id) {
                        messageSenderId = newMessage.senderId._id;
                    }

                    if (messageSenderId !== currentUserId) {
                        const fileUrl = newMessage.files?.[0]?.url || newMessage.fileUrl || null;
                        const fileName = newMessage.files?.[0]?.name || newMessage.fileName || null;
                        
                        const formattedMessage = {
                            id: newMessage._id || newMessage.id || Date.now().toString(),
                            text: newMessage.message,
                            sender: 'owner',
                            timestamp: formatTimestamp(newMessage.createdAt || newMessage.timestamp),
                            files: newMessage.files || [],
                            fileUrl: fileUrl,
                            fileName: fileName,
                        };

                        setMessages(prev => {
                            const exists = prev.some(msg =>
                                msg.id === formattedMessage.id ||
                                (msg.text === formattedMessage.text && msg.timestamp === formattedMessage.timestamp)
                            );
                            if (exists) {
                                return prev;
                            }
                            return [...prev, formattedMessage];
                        });
                    }
                });

                socket.onUserTyping((data) => {
                    const currentUserId = user?.userId || user?._id || user?.id;
                    if (data.userId !== currentUserId && data.bookingId === bookingId) {
                        setIsTyping(data.isTyping);
                    }
                });
            }
        } else {
            setMessages([
                {
                    id: '1',
                    text: 'Need Car for Rent!',
                    sender: 'user',
                    timestamp: '09:25 AM',
                },
                {
                    id: '2',
                    text: 'Yes! Rent Was 500 per Day',
                    sender: 'owner',
                    timestamp: '09:25 AM',
                },
            ]);
            setLoading(false);
        }

        return () => {
            if (bookingId && socket) {
                socket.leaveChatRoom(bookingId);

                if (socket.socket) {
                    socket.socket.off('new_message');
                    socket.socket.off('user_typing');
                }
            }
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [bookingId, socket]);

    useEffect(() => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const fetchMessages = useCallback(async () => {
        try {
            if (!bookingId) {
                setMessages([]);
                setLoading(false);
                return;
            }

            const response = await getMessages(bookingId);
            const messagesArray = response.data || response.messages || [];

            // ✅ Extract user details from messages if not in route params
            if (messagesArray.length > 0) {
                // Try to find user info from any message
                for (const msg of messagesArray) {
                    // Extract sender and receiver info
                    let senderInfo = null;
                    let receiverInfo = null;

                    if (typeof msg.senderId === 'object' && msg.senderId !== null) {
                        senderInfo = msg.senderId;
                    }

                    if (typeof msg.receiverId === 'object' && msg.receiverId !== null) {
                        receiverInfo = msg.receiverId;
                    }

                    // Find the other person's info (not current user)
                    let otherUserInfo = null;
                    if (senderInfo && String(senderInfo._id) !== String(currentUserId)) {
                        otherUserInfo = senderInfo;
                    } else if (receiverInfo && String(receiverInfo._id) !== String(currentUserId)) {
                        otherUserInfo = receiverInfo;
                    }

                    if (otherUserInfo) {
                        const extractedName = otherUserInfo.name ||
                                              otherUserInfo.username ||
                                              otherUserInfo.fullName ||
                                              otherUserInfo.contactName ||
                                              otherUserInfo.userName ||
                                              otherUserInfo.displayName;

                        if (extractedName) {
                            setChatPartnerDetails({
                                name: extractedName,
                                avatar: otherUserInfo.avatar || otherUserInfo.profilePicture || ownerAvatar
                            });
                            break; // Found name, stop searching
                        }
                    }
                }
            }

            if (response && Array.isArray(messagesArray) && messagesArray.length > 0) {
                const formattedMessages = messagesArray.map((msg) => {
                    let msgSenderId = null;
                    if (typeof msg.senderId === 'string') {
                        msgSenderId = msg.senderId;
                    } else if (msg.senderId?._id) {
                        msgSenderId = msg.senderId._id;
                    } else if (msg.senderId?.userId) {
                        msgSenderId = msg.senderId.userId;
                    }

                    if (!msgSenderId) {
                        msgSenderId = msg.userId || msg.sender || msg.from;
                    }

                    let isMyMessage = false;

                    if (msgSenderId) {
                        isMyMessage = (msgSenderId === currentUserId || msgSenderId == currentUserId);
                    } else {
                        let msgReceiverId = null;
                        if (typeof msg.receiverId === 'string') {
                            msgReceiverId = msg.receiverId;
                        } else if (msg.receiverId?._id) {
                            msgReceiverId = msg.receiverId._id;
                        } else if (msg.receiverId?.userId) {
                            msgReceiverId = msg.receiverId.userId;
                        }

                        if (!msgReceiverId) {
                            msgReceiverId = msg.to;
                        }

                        if (msgReceiverId) {
                            if (isOwner) {
                                isMyMessage = (msgReceiverId === customerId || msgReceiverId == customerId);
                            } else {
                                isMyMessage = (msgReceiverId === ownerId || msgReceiverId == ownerId);
                            }
                        } else {
                            isMyMessage = false;
                        }
                    }

                    const messageText = msg.message || '';
                    const fileUrl = msg.files?.[0]?.url || msg.fileUrl || null;
                    const fileName = msg.files?.[0]?.name || msg.fileName || null;

                    const formatted = {
                        id: msg._id || msg.id,
                        text: messageText,
                        sender: isMyMessage ? 'user' : 'owner',
                        timestamp: formatTimestamp(msg.createdAt || msg.timestamp),
                        status: 'sent',
                        files: msg.files || [],
                        fileUrl: fileUrl,
                        fileName: fileName,
                    };

                    return formatted;
                });

                setMessages(prev => {
                    const existingIds = new Set(prev.filter(m => !m.id?.startsWith('temp_')).map(m => m.id));
                    const newMsgs = formattedMessages.filter(m => !existingIds.has(m.id));
                    const optimisticMsgs = prev.filter(m => m.id?.startsWith('temp_'));
                    const serverMsgs = formattedMessages;
                    const confirmedTexts = new Set(serverMsgs.map(m => m.text));
                    const unconfirmedOptimistic = optimisticMsgs.filter(m => !confirmedTexts.has(m.text));
                    return [...serverMsgs, ...unconfirmedOptimistic];
                });
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [bookingId, isOwner, ownerId, customerId, currentUserId, ownerName, customerName]);

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });

        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        if (!bookingId) {
            const newMessage = {
                id: Date.now().toString(),
                text: message.trim(),
                sender: 'user',
                timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                }),
                status: 'sent',
            };
            setMessages([...messages, newMessage]);
            setMessage('');

            setTimeout(() => {
                const ownerResponse = {
                    id: (Date.now() + 1).toString(),
                    text: 'Sure, I\'ll check and get back to you shortly.',
                    sender: 'owner',
                    timestamp: new Date().toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                    status: 'sent',
                };
                setMessages(prev => [...prev, ownerResponse]);
            }, 2000);
            return;
        }

        if (!senderId || !actualReceiverId) {
            Alert.alert(
                'Unable to send message',
                'Missing user information. Please go back and try opening the chat again.'
            );
            return;
        }

        const optimisticId = `temp_${Date.now()}`;

        const messageData = {
            bookingId,
            senderId: senderId,
            receiverId: actualReceiverId,
            message: message.trim(),
            files: [],
        };

        const socketConnected = isConnected && socket;

        const newMessage = {
            id: optimisticId,
            text: message.trim(),
            sender: 'user',
            timestamp: formatTimestamp(new Date()),
            status: socketConnected ? 'sent' : 'sending',
        };
        setMessages(prev => [...prev, newMessage]);
        setMessage('');

        if (socketConnected) {
            socket.sendMessage(messageData);
            socket.emitTyping(bookingId, false);
        }

        try {
            const response = await sendMessage(messageData);

            if (response && response.success) {
                const realId = response?.data?._id || response?.data?.id || optimisticId;
                setMessages(prev => prev.map(msg =>
                    msg.id === optimisticId
                        ? { ...msg, id: realId, status: 'sent' }
                        : msg
                ));
            } else if (!socketConnected) {
                setMessages(prev => prev.map(msg =>
                    msg.id === optimisticId
                        ? { ...msg, status: 'failed' }
                        : msg
                ));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            if (!socketConnected) {
                setMessages(prev => prev.map(msg =>
                    msg.id === optimisticId
                        ? { ...msg, status: 'failed' }
                        : msg
                ));
            }
        }
    };

    const handleTextChange = (text) => {
        setMessage(text);

        if (isConnected && socket && bookingId) {
            socket.emitTyping(bookingId, true);

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                socket.emitTyping(bookingId, false);
            }, 2000);
        }
    };

    const renderMessage = ({ item }) => {
        const isUserMessage = item.sender === 'user';
        const isSending = item.status === 'sending';
        const isFailed = item.status === 'failed';
        const hasText = item.text && item.text.trim().length > 0;
        
        if (!hasText) return null;

        return (
            <View style={styles.messageWrapper}>
                <View style={[
                    styles.messageRow,
                    isUserMessage ? styles.userMessageRow : styles.ownerMessageRow
                ]}>
                    {isUserMessage && (
                        <>
                            <View style={styles.userMessageContainer}>
                                <LinearGradient
                                    colors={Colors.gradient.primary}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[
                                        styles.userMessageBubble,
                                        isFailed && styles.failedMessageBubble,
                                    ]}
                                >
                                    <Text style={styles.userMessageText}>{item.text}</Text>
                                </LinearGradient>
                            </View>

                            {isSending ? (
                                <View style={styles.userAvatar}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                </View>
                            ) : (
                                <Image
                                    source={require('../assets/Icons/user-avatar.png')}
                                    style={styles.userAvatar}
                                />
                            )}
                        </>
                    )}

                    {!isUserMessage && (
                        <>
                            <Image
                                source={chatPartnerDetails.avatar || require('../assets/Icons/user-avatar.png')}
                                style={styles.ownerAvatar}
                            />
                            <View style={styles.ownerMessageContainer}>
                                <View style={styles.ownerMessageBubble}>
                                    <Text style={styles.ownerMessageText}>{item.text}</Text>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                <View style={[
                    styles.timestampContainer,
                    isUserMessage ? styles.userTimestampContainer : styles.ownerTimestampContainer
                ]}>
                    <Text style={[
                        styles.timestamp,
                        isUserMessage ? styles.userTimestamp : styles.ownerTimestamp,
                        isFailed && styles.failedTimestamp
                    ]}>
                        {isFailed ? 'Failed to send' : item.timestamp}
                    </Text>
                    {isFailed && isUserMessage && (
                        <Ionicons
                            name="alert-circle"
                            size={14}
                            color="#FF3B30"
                            style={styles.failedIcon}
                        />
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} animated={true} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <Ionicons name="chevron-back" size={28} color={Colors.black} />
                </TouchableOpacity>

                <Image
                    source={chatPartnerDetails.avatar || require('../assets/Icons/user-avatar.png')}
                    style={styles.headerAvatar}
                />

                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{chatPartnerDetails.name}</Text>
                    <Text style={styles.headerStatus}>
                        {isTyping ? 'Typing...' : isConnected ? 'Online' : 'Offline'}
                    </Text>
                </View>
            </View>

            <View style={styles.headerDivider} />

            {/* Loading Indicator */}
            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading messages...</Text>
                </View>
            )}

            {/* Messages List */}
            {!loading && (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.messagesList,
                        { paddingBottom: bottomPadding + 80 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-outline" size={60} color="#CCCCCC" />
                            <Text style={styles.emptyText}>No messages yet</Text>
                            <Text style={styles.emptySubtext}>Start a conversation</Text>
                        </View>
                    )}
                />
            )}

            {/* Input Section */}
            <View style={[styles.inputContainer, { paddingBottom: bottomPadding }]}>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    placeholderTextColor={Colors.text.secondary}
                    value={message}
                    onChangeText={handleTextChange}
                    multiline
                    maxLength={500}
                    onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />

                <TouchableOpacity
                    style={styles.sendButton}
                    onPress={handleSendMessage}
                    disabled={!message.trim()}
                >
                    <LinearGradient
                        colors={message.trim() ? Colors.gradient.primary : ['#CCCCCC', '#999999']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.sendButtonGradient}
                    >
                        <Ionicons name="send" size={24} color={Colors.white} />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'ios' ? 50 : (StatusBar.currentHeight || 24) + Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    headerAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        marginRight: Spacing.md,
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginBottom: 4,
    },
    headerStatus: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    headerDivider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: Spacing.lg,
    },
    messagesList: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
        flexGrow: 1,
    },
    messageWrapper: {
        marginBottom: Spacing.lg,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    userMessageRow: {
        justifyContent: 'flex-end',
    },
    ownerMessageRow: {
        justifyContent: 'flex-start',
    },
    userMessageContainer: {
        maxWidth: '75%',
        marginRight: Spacing.sm,
    },
    ownerMessageContainer: {
        maxWidth: '75%',
    },
    userMessageBubble: {
        maxWidth: '100%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.xl,
        borderTopRightRadius: 4,
    },
    userMessageText: {
        fontSize: Typography.fontSize.lg,
        color: Colors.white,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 24,
    },
    ownerMessageBubble: {
        maxWidth: '100%',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.xl,
        borderTopLeftRadius: 4,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    ownerMessageText: {
        fontSize: Typography.fontSize.lg,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        lineHeight: 24,
    },
    userAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        marginLeft: Spacing.sm,
    },
    ownerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: Spacing.sm,
    },
    timestampContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    timestamp: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    userTimestampContainer: {
        alignSelf: 'flex-end',
        marginRight: 60,
    },
    ownerTimestampContainer: {
        alignSelf: 'flex-start',
        marginLeft: 52,
    },
    userTimestamp: {
        textAlign: 'right',
    },
    ownerTimestamp: {
        textAlign: 'left',
    },
    failedMessageBubble: {
        opacity: 0.7,
    },
    failedTimestamp: {
        color: '#FF3B30',
    },
    failedIcon: {
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.white,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    input: {
        flex: 1,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.lg,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        maxHeight: 120,
        marginRight: Spacing.sm,
        minHeight: 50,
    },
    sendButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButtonGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.xl * 2,
    },
    emptyText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.secondary,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        marginTop: Spacing.xs,
    },
});

export default ChatScreen;