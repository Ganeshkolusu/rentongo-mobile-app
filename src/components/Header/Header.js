import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../../constants/Colors';
import { BorderRadius, hp, Layout, normalize, Spacing, wp } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const Header = ({
    onBackPress,
    title = "Screen",
    location = null,
    gradientColors = ['#63C8FF', '#141248'],
    onMorePress,
    showMoreButton = false,
    useGradient = true,
    backgroundColor = Colors.white,
    titleColor,
    iconColor,
    showIconBackground = false,
    iconBackgroundColor = Colors.white,
    extraTopPadding = false, // Add this new prop
}) => {
    const finalTitleColor = titleColor || (useGradient ? Colors.white : Colors.text.primary);
    const finalIconColor = iconColor || (useGradient ? Colors.white : Colors.text.primary);

    const HeaderContainer = useGradient ? LinearGradient : View;
    const containerProps = useGradient
        ? {
            colors: gradientColors,
            start: { x: 0, y: 0 },
            end: { x: 0, y: 1 }
        }
        : {};

    // Determine if the background color is light or dark for proper text color
    const isLightBackground = useGradient
        ? (gradientColors[0] === '#63C8FF' || gradientColors[0].toLowerCase().includes('c8ff'))
        : (backgroundColor === Colors.white || backgroundColor === '#FFFFFF');
    const statusBarStyle = isLightBackground ? 'dark-content' : 'light-content';

    return (
        <View>
            <StatusBar
                barStyle={statusBarStyle}
                backgroundColor="transparent"
                translucent={true}
                animated={true}
            />

            <HeaderContainer
                {...containerProps}
                style={[
                    styles.headerContainer,
                    !useGradient && { backgroundColor },
                    !useGradient && styles.flatHeader,
                    showIconBackground && styles.compactHeader,
                    location && styles.headerContainerWithLocation
                ]}
            >
                <View style={[
                    styles.headerContent,
                    extraTopPadding && styles.headerContentExtraPadding // Conditionally apply extra padding
                ]}>
                    <TouchableOpacity
                        onPress={onBackPress}
                        style={[
                            styles.backButton,
                            showIconBackground && styles.iconBackground
                        ]}
                    >
                        <Icon name="chevron-back" size={normalize(28)} color={finalIconColor} style={showIconBackground && styles.icon} />
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: finalTitleColor }]}>{title}</Text>
                        {location && (
                            <View style={styles.locationContainer}>
                                <Icon name="location" size={normalize(14)} color="#B3E5FC" />
                                <Text style={styles.locationText} numberOfLines={1}>
                                    {location}
                                </Text>
                            </View>
                        )}
                    </View>
                    {showMoreButton && (
                        <TouchableOpacity onPress={onMorePress} style={styles.moreButton}>
                            <Image
                                source={require('../../assets/Icons/vector.png')}
                                style={styles.moreIcon}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </HeaderContainer>
        </View>
    );
};

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + normalize(10) : normalize(60),
        paddingBottom: Spacing.lg,
        borderBottomLeftRadius: BorderRadius.xxl,
        borderBottomRightRadius: BorderRadius.xxl,
        minHeight: Layout.headerHeight + hp(4) + (Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0),
        width: wp(100),
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 0
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg, // Default padding
        marginBottom: normalize(-30)
    },
    headerContentExtraPadding: {
        paddingTop: Spacing.xxl, // Extra padding for List screens
    },
    flatHeader: {
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        minHeight: Layout.headerHeight,
        paddingTop: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.white,
    },
    compactHeader: {
        minHeight: Layout.headerHeight - hp(4),
        paddingTop: normalize(-5),
        paddingBottom: Spacing.sm,
    },
    backButton: {
        marginRight: Spacing.md,
        padding: Spacing.xs,
        marginBottom: normalize(30)
    },
    headerContainerWithLocation: {
        minHeight: Layout.headerHeight + hp(6),
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        lineHeight: Typography.lineHeight.xxl,
        fontWeight: Typography.fontWeight.bold,
        fontFamily: Typography.fontFamily.bold,
        color: Colors.white,
        marginBottom: normalize(32),
        marginRight: Spacing.xl,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    locationText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.lineHeight.sm,
        color: '#B3E5FC',
        fontFamily: Typography.fontFamily.regular,
        marginLeft: Spacing.xs,
        flex: 1,
    },
    moreButton: {
        padding: Spacing.xs,
        marginLeft: Spacing.sm,
    },
    moreIcon: {
        width: normalize(24),
        height: normalize(24),
        resizeMode: 'contain',
        tintColor: Colors.white,
    },
    iconBackground: {
        backgroundColor: Colors.white,
        borderRadius: normalize(30),
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    icon: {
        padding: Spacing.xs,
    }
});

export default Header;