import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getUserChats } from '../api/chatApi';
import { Colors } from '../constants/Colors';
import { BorderRadius, hp, normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';
import { useAuth } from '../context/AuthContext';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const MyChatsScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const currentUserId = user?.userId || user?._id || user?.id;

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const fetchChats = useCallback(async () => {
        try {

            if (!currentUserId) {
                setChats([]);
                setLoading(false);
                return;
            }

            const response = await getUserChats(currentUserId);
            const chatsArray = response?.data || response?.chats || [];


            const formattedChats = chatsArray.map((chat, index) => {
                const isOwner = chat.ownerId === currentUserId || chat.ownerId?._id === currentUserId;

                // Get the other user's name based on whether current user is owner or customer
                let otherUserName = 'User';
                if (isOwner) {
                    // Current user is owner, show customer name
                    otherUserName = chat.customerName ||
                        chat.customer?.name ||
                        chat.customer?.firstName ||
                        (chat.customer?.firstName && chat.customer?.lastName ? `${chat.customer.firstName} ${chat.customer.lastName}`.trim() : null) ||
                        chat.customerId?.name ||
                        chat.customerId?.firstName ||
                        'Customer';
                } else {
                    // Current user is customer, show owner name
                    otherUserName = chat.ownerName ||
                        chat.owner?.name ||
                        chat.owner?.firstName ||
                        (chat.owner?.firstName && chat.owner?.lastName ? `${chat.owner.firstName} ${chat.owner.lastName}`.trim() : null) ||
                        chat.ownerId?.name ||
                        chat.ownerId?.firstName ||
                        'Vehicle Owner';
                }


                return {
                    id: chat._id || chat.bookingId || `chat_${index}`,
                    bookingId: chat.bookingId || chat._id,
                    name: otherUserName,
                    message: chat.lastMessage?.message || chat.lastMessage || 'Start a conversation',
                    time: formatTime(chat.lastMessageTime || chat.updatedAt || chat.createdAt),
                    unreadCount: chat.unreadCount || 0,
                    avatar: require('../assets/Icons/user-avatar.png'),
                    isOnline: false,
                    ownerId: typeof chat.ownerId === 'object' ? chat.ownerId?._id : chat.ownerId,
                    customerId: typeof chat.customerId === 'object' ? chat.customerId?._id : chat.customerId,
                    ownerName: chat.ownerName || chat.ownerId?.name,
                    customerName: chat.customerName || chat.customerId?.name,
                    vehicleId: chat.vehicleId,
                    vehicleInfo: chat.vehicleInfo || chat.vehicle,
                };
            });

            setChats(formattedChats);
        } catch (error) {

            setChats([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useFocusEffect(
        useCallback(() => {
            if (!loading) fetchChats();
        }, [fetchChats, loading])
    );

    const handleBackPress = () => {
        navigation.goBack();
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchChats();
    };

    const handleChatPress = (chat) => {

        navigation.navigate('ChatScreen', {
            bookingId: chat.bookingId,
            ownerName: chat.ownerName || chat.name,
            customerName: chat.customerName || chat.name,
            ownerId: chat.ownerId,
            customerId: chat.customerId,
            vehicleId: chat.vehicleId,
            vehicleInfo: chat.vehicleInfo,
        });
    };

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleChatPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <Image source={item.avatar} style={styles.avatar} />
                {item.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.chatContent}>
                <View style={styles.chatHeader}>
                    <Text style={styles.chatName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text style={styles.chatTime}>{item.time}</Text>
                </View>
                <View style={styles.chatFooter}>
                    <Text style={styles.chatMessage} numberOfLines={1}>
                        {item.message}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} animated={true} />
            
            {/* Header with Gradient */}
            <LinearGradient
                colors={Colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1}}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={handleBackPress}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={28} color={Colors.white} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>My Chats</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            {/* Chat List */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading chats...</Text>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    renderItem={renderChatItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={[
                        styles.listContainer,
                        chats.length === 0 && styles.emptyListContainer
                    ]}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={80} color={Colors.text.secondary} />
                            <Text style={styles.emptyTitle}>No Chats Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Your chat conversations will appear here when you start messaging.
                            </Text>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[Colors.primary]}
                            tintColor={Colors.primary}
                        />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : STATUSBAR_HEIGHT + Spacing.md,
        paddingBottom: Spacing.lg,
        paddingHorizontal: Spacing.lg,
        borderBottomLeftRadius: BorderRadius.xl,
        borderBottomRightRadius: BorderRadius.xl,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: normalize(22),
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.white,
        flex: 1,
        textAlign: 'left',
    },
    placeholder: {
        width: 40,
    },
    listContainer: {
        paddingTop: Spacing.md,
        paddingBottom: Platform.OS === 'ios' ? hp(10) : hp(12),
    },
    chatItem: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: Colors.white,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: Spacing.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00D47E',
        borderWidth: 2,
        borderColor: Colors.white,
    },
    chatContent: {
        flex: 1,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    chatName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        flex: 1,
        marginRight: Spacing.sm,
    },
    chatTime: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
    chatFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatMessage: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        flex: 1,
        marginRight: Spacing.sm,
    },
    unreadBadge: {
        backgroundColor: Colors.linkBlue,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xs,
    },
    unreadText: {
        fontSize: Typography.fontSize.sm,
        color: Colors.white,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
    },
    separator: {
        height: 1,
        backgroundColor: Colors.border,
        marginLeft: Spacing.lg + 60 + Spacing.md,
        marginRight: Spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
    },
    emptyListContainer: {
        flex: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.text.primary,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
        textAlign: 'center',
        lineHeight: 22,
    },
});

export default MyChatsScreen;