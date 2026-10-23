import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing, normalize, responsiveValue, wp } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const ProfileHeader = ({ userAvatar, userName, onImagePress, showProfile = true, showEditBadge = true }) => {
    if (!showProfile) return null;

    return (
        <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={showEditBadge ? onImagePress : null} activeOpacity={0.8} disabled={!showEditBadge}>
                    <View style={styles.avatarWrapper}>
                        <Image
                            source={userAvatar ? { uri: userAvatar } : require('../../assets/Icons/user-avatar.png')}
                            style={styles.avatar}
                            resizeMode={userAvatar ? "cover" : "contain"}
                        />
                    </View>
                </TouchableOpacity>
                {showEditBadge && (
                    <TouchableOpacity style={styles.editBadge} onPress={onImagePress}>
                        <Image
                            source={require('../../assets/Icons/edit1.png')}
                            style={styles.editIcon}
                        />
                    </TouchableOpacity>
                )}
            </View>
            <Text style={styles.userName}>{userName || 'User'}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    profileContainer: {
        alignItems: 'center',
        paddingVertical: responsiveValue(Spacing.sm, Spacing.mg, Spacing.lg),
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.sm,
    },
    avatarWrapper: {
        width: responsiveValue(wp(22), wp(22), wp(24)),
        height: responsiveValue(wp(22), wp(22), wp(24)),
        borderRadius: normalize(8),
        borderWidth: normalize(3),
        borderColor: Colors.white,
        overflow: 'hidden',
        backgroundColor: '#E8EAF0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    editBadge: {
        position: 'absolute',
        right: normalize(-15),
        bottom: normalize(-8),
        backgroundColor: Colors.white,
        borderRadius: normalize(15),
        width: normalize(32),
        height: normalize(32),
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    editIcon: {
        width: normalize(16),
        height: normalize(16),
        tintColor: Colors.dotActive,
        resizeMode: 'contain',
    },
    userName: {
        fontSize: responsiveValue(normalize(20), normalize(22), normalize(24)),
        fontWeight: '600',
        color: Colors.white,
        fontFamily: Typography.fontFamily.bold,
        marginTop: Spacing.xs,
    },
});

export default ProfileHeader;