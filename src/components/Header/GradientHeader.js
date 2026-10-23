import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Image,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { hp, normalize, Spacing } from '../../constants/Dimensions';
import ProfileHeader from '../ProfileHeader/ProfileHeader';
import VehicleCard from '../VehicleCard/VehicleCard';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const GradientHeader = ({
    onBackPress,
    onMorePress,
    showVehicleCard = false,
    vehicle = null,
    showProfileHeader = false,
    userAvatar = null,
    userName = 'User',
    onImagePress = null,
    showBackButton = true,
    showMoreButton = true,
    gradientColors = ['#63C8FF', '#141248'],
    compactCard = false,
    showEditBadge = true
}) => {
    const getHeaderHeight = () => {
        if (showVehicleCard && compactCard) return styles.headerWithCompactCard;
        if (showVehicleCard) return styles.headerWithCard;
        if (showProfileHeader) return styles.headerWithProfile;
        return styles.headerWithoutCard;
    };

    // Determine if the first gradient color is light or dark for proper text color
    const isLightBackground = gradientColors[0] === '#63C8FF' || gradientColors[0].toLowerCase().includes('c8ff');
    const statusBarStyle = isLightBackground ? 'dark-content' : 'light-content';

    return (
        <>
            {/* StatusBar transparent - gradient extends behind it */}
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor="transparent"
                translucent={true}
                animated={true}
            />
            
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[styles.headerGradient, getHeaderHeight()]}
            >
                {/* Header Navigation - Conditional */}
                {(showBackButton || showMoreButton) && (
                    <View style={styles.headerNav}>
                        {showBackButton && (
                            <TouchableOpacity style={styles.backButtonContainer} onPress={onBackPress}>
                                <Image
                                    source={require('../../assets/Icons/rightArrow.png')}
                                    style={styles.backIcon}
                                />
                            </TouchableOpacity>
                        )}
                        {showMoreButton && (
                            <TouchableOpacity style={styles.moreOptions} onPress={onMorePress}>
                                <Text style={styles.moreOptionsText}>⋮</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Vehicle Card - Conditional */}
                <VehicleCard vehicle={vehicle} showCard={showVehicleCard} />

                {/* Profile Header - Conditional */}
                <ProfileHeader
                    userAvatar={userAvatar}
                    userName={userName}
                    onImagePress={onImagePress}
                    showProfile={showProfileHeader}
                    showEditBadge={showEditBadge}
                />
            </LinearGradient>
        </>
    );
};

const styles = StyleSheet.create({
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? hp(6) : STATUSBAR_HEIGHT + hp(1),
        paddingBottom: hp(1),
        borderBottomLeftRadius: normalize(30),
        borderBottomRightRadius: normalize(30),
    },
    headerWithCard: {
        minHeight: hp(25),
    },
    headerWithCompactCard: {
        minHeight: hp(18),
    },
    headerWithProfile: {
        minHeight: hp(25),
    },
    headerWithoutCard: {
        minHeight: hp(12),
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.md,
    },
    backButtonContainer: {
        backgroundColor: Colors.white,
        width: normalize(45),
        height: normalize(45),
        borderRadius: normalize(22.5),
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    backIcon: {
        width: normalize(20),
        height: normalize(20),
        tintColor: Colors.black,
        transform: [{ rotate: '180deg' }],
    },
    moreOptions: {
        padding: normalize(8),
    },
    moreOptionsText: {
        fontSize: normalize(24),
        color: Colors.white,
        fontWeight: 'bold',
    },
});

export default GradientHeader;