import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing, responsiveValue } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

const MenuItem = ({ item, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.menuItem}
            onPress={() => onPress(item)}
        >
            <View style={[styles.iconContainer, item.isLogout && styles.logoutIconContainer]}>
                <Image
                    source={item.icon}
                    style={[styles.menuIcon, item.isLogout && styles.logoutIcon]}
                />
            </View>
            <Text style={[styles.menuText, item.isLogout && styles.logoutText]}>
                {item.title}
            </Text>
            <Image
                source={require('../../assets/Icons/rightArrow.png')}
                style={styles.arrowIcon}
            />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: responsiveValue(normalize(10), normalize(12), normalize(14)),
        paddingHorizontal: responsiveValue(Spacing.sm, Spacing.md, Spacing.lg),
        minHeight: normalize(48),
    },
    iconContainer: {
        width: normalize(32),
        height: normalize(32),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveValue(normalize(10), normalize(12), normalize(14)),
    },
    logoutIconContainer: {
        // No special background for logout
    },
    menuText: {
        flex: 1,
        fontSize: responsiveValue(normalize(14), normalize(15), normalize(16)),
        fontFamily: Typography.fontFamily.regular,
        color: Colors.text.primary,
        lineHeight: normalize(20),
    },
    logoutText: {
        color: Colors.error,
    },
    menuIcon: {
        width: responsiveValue(normalize(36), normalize(38), normalize(40)),
        height: responsiveValue(normalize(36), normalize(38), normalize(40)),
        resizeMode: 'contain',
    },
    logoutIcon: {
        // No tint color - show original image
    },
    arrowIcon: {
        width: normalize(16),
        height: normalize(16),
        resizeMode: 'contain',
        marginLeft: Spacing.xs,
    },
});

export default MenuItem;