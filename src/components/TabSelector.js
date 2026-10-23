import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Colors } from '../constants/Colors';
import { normalize, Spacing } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const TabSelector = ({
    tabs = [],
    activeTab = 0,
    onTabChange,
    style
}) => {
    return (
        <View style={[styles.container, style]}>
            {tabs.map((tab, index) => {
                const isImageIcon = typeof tab.icon !== 'string'; // check if icon is image
                return (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.tab,
                            activeTab === index && styles.activeTab
                        ]}
                        onPress={() => onTabChange(index)}
                        activeOpacity={0.7}
                    >
                        {activeTab === index ? (
                            <LinearGradient
                                colors={['#141248', '#63C8FF']}
                                style={styles.gradientTab}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {isImageIcon ? (
                                    <Image
                                        source={tab.icon}
                                        style={{
                                            width: tab.label.includes('Bike') ? normalize(22) : normalize(16),
                                            height: tab.label.includes('Bike') ? normalize(22) : normalize(16),
                                            marginRight: Spacing.xs,
                                            tintColor: Colors.white
                                        }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Icon
                                        name={tab.icon}
                                        size={normalize(16)}
                                        color={Colors.white}
                                        style={styles.icon}
                                    />
                                )}
                                <Text style={styles.activeTabText}>
                                    {tab.label}
                                </Text>
                            </LinearGradient>
                        ) : (
                            <>
                                {isImageIcon ? (
                                    <Image
                                        source={tab.icon}
                                        style={{
                                            width: tab.label.includes('Bike') ? normalize(22) : normalize(16),
                                            height: tab.label.includes('Bike') ? normalize(22) : normalize(16),
                                            marginRight: Spacing.xs,
                                            tintColor: '#999999'
                                        }}
                                        resizeMode="contain"
                                    />
                                ) : (
                                    <Icon
                                        name={tab.icon}
                                        size={normalize(16)}
                                        color="#999999"
                                        style={styles.icon}
                                    />
                                )}
                                <Text style={styles.tabText}>
                                    {tab.label}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        borderRadius: normalize(30),
        padding: normalize(3),
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
        borderWidth: normalize(1.5),
        borderColor: '#E5E5E5',
        height: normalize(45),
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(8),
        paddingHorizontal: Spacing.md,
        borderRadius: normalize(26),
    },
    activeTab: {
        backgroundColor: 'transparent',
    },
    gradientTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: normalize(10),
        paddingHorizontal: Spacing.md,
        borderBottomLeftRadius: normalize(12),
        borderBottomRightRadius: normalize(12),
        height: normalize(38),
        marginTop: normalize(-5)
    },
    icon: {
        marginRight: Spacing.xs,
    },
    tabText: {
        fontSize: Typography.fontSize.md,
        fontFamily: Typography.fontFamily.regular,
        color: '#999999',
    },
    activeTabText: {
        color: Colors.white,
        fontWeight: Typography.fontWeight.semiBold,
        fontFamily: Typography.fontFamily.medium,
    },
});

export default TabSelector;
