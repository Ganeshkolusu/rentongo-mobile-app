import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { normalize, Spacing } from '../../constants/Dimensions';
import { Typography } from '../../constants/Typography';

// Country list with flags, dial codes, and phone number length validation
export const COUNTRIES = [
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', phoneLength: 10 },
    { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', phoneLength: 10 },
    { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', phoneLength: 10 },
    { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', phoneLength: 9 },
    { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦', phoneLength: 9 },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', phoneLength: 9 },
    { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', phoneLength: 10 },
    { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', phoneLength: 11 },
    { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', phoneLength: 9 },
    { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', phoneLength: 10 },
    { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', phoneLength: 9 },
    { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵', phoneLength: 10 },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳', phoneLength: 11 },
    { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', phoneLength: 8 },
    { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', phoneLength: 10 },
    { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭', phoneLength: 9 },
    { code: 'PH', name: 'Philippines', dialCode: '+63', flag: '🇵🇭', phoneLength: 10 },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩', phoneLength: 11 },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩', phoneLength: 10 },
    { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰', phoneLength: 10 },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰', phoneLength: 9 },
    { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵', phoneLength: 10 },
    { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', phoneLength: 9 },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬', phoneLength: 10 },
    { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪', phoneLength: 9 },
    { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬', phoneLength: 10 },
    { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷', phoneLength: 11 },
    { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽', phoneLength: 10 },
    { code: 'RU', name: 'Russia', dialCode: '+7', flag: '🇷🇺', phoneLength: 10 },
    { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷', phoneLength: 10 },
    { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', phoneLength: 9 },
    { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦', phoneLength: 8 },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼', phoneLength: 8 },
    { code: 'BH', name: 'Bahrain', dialCode: '+973', flag: '🇧🇭', phoneLength: 8 },
    { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲', phoneLength: 8 },
];

// Get default country (India)
export const getDefaultCountry = () => COUNTRIES.find(c => c.code === 'IN') || COUNTRIES[0];

// Validate phone number length based on country
export const validatePhoneNumber = (phoneNumber, country) => {
    if (!phoneNumber || !country) return false;
    const digitsOnly = phoneNumber.replace(/\D/g, '');
    return digitsOnly.length === country.phoneLength;
};

// Get validation message
export const getPhoneValidationMessage = (country) => {
    if (!country) return '';
    return `Phone number must be ${country.phoneLength} digits for ${country.name}`;
};

const CountryCodePicker = ({
    selectedCountry,
    onSelectCountry,
    style,
    disabled = false,
    compact = false
}) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectCountry = (country) => {
        onSelectCountry(country);
        setModalVisible(false);
    };

    const renderCountryItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.countryItem,
                selectedCountry?.code === item.code && styles.selectedCountryItem
            ]}
            onPress={() => handleSelectCountry(item)}
        >
            <Text style={styles.countryFlag}>{item.flag}</Text>
            <View style={styles.countryInfo}>
                <Text style={styles.countryName}>{item.name}</Text>
            </View>
            <Text style={styles.dialCode}>{item.dialCode}</Text>
        </TouchableOpacity>
    );

    return (
        <>
            <TouchableOpacity
                style={[
                    compact ? styles.pickerButtonCompact : styles.pickerButton,
                    style,
                    disabled && styles.disabledButton
                ]}
                onPress={() => !disabled && setModalVisible(true)}
                disabled={disabled}
            >
                <Text style={compact ? styles.flagTextCompact : styles.flagText}>
                    {selectedCountry?.flag || '🇮🇳'}
                </Text>
                <Text style={compact ? styles.dialCodeTextCompact : styles.dialCodeText}>
                    {selectedCountry?.dialCode || '+91'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Country</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <FlatList
                            data={COUNTRIES}
                            renderItem={renderCountryItem}
                            keyExtractor={(item) => item.code}
                            showsVerticalScrollIndicator={true}
                            ItemSeparatorComponent={() => <View style={styles.separator} />}
                            style={styles.countryList}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        paddingHorizontal: normalize(10),
        paddingVertical: normalize(12),
        borderRadius: normalize(8),
        borderWidth: 1,
        borderColor: '#E5E5E5',
        marginRight: normalize(8),
    },
    pickerButtonCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingHorizontal: normalize(4),
        paddingVertical: normalize(2),
        marginRight: normalize(6),
    },
    disabledButton: {
        opacity: 0.6,
    },
    flagText: {
        fontSize: normalize(20),
        marginRight: normalize(6),
    },
    flagTextCompact: {
        fontSize: normalize(18),
        marginRight: normalize(4),
    },
    dialCodeText: {
        fontSize: normalize(14),
        color: Colors.text?.primary || '#333',
        fontFamily: Typography.fontFamily?.medium,
        fontWeight: '500',
    },
    dialCodeTextCompact: {
        fontSize: normalize(13),
        color: Colors.text?.primary || '#333',
        fontFamily: Typography.fontFamily?.medium,
        fontWeight: '500',
    },
    dropdownArrow: {
        fontSize: normalize(8),
        color: '#888',
        marginLeft: normalize(2),
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: normalize(20),
    },
    modalContent: {
        backgroundColor: Colors.white || '#FFF',
        borderRadius: normalize(16),
        width: '100%',
        maxHeight: '70%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        backgroundColor: '#F8F8F8',
    },
    modalTitle: {
        fontSize: normalize(16),
        fontWeight: '600',
        color: Colors.text?.primary || '#333',
        fontFamily: Typography.fontFamily?.semiBold,
    },
    closeButton: {
        width: normalize(28),
        height: normalize(28),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EFEFEF',
        borderRadius: normalize(14),
    },
    countryList: {
        flexGrow: 0,
    },
    closeButtonText: {
        fontSize: normalize(16),
        color: '#666',
    },
    countryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: normalize(5),
        paddingHorizontal: Spacing.lg,
    },
    selectedCountryItem: {
        backgroundColor: '#E8F4FD',
    },
    countryFlag: {
        fontSize: normalize(28),
        marginRight: normalize(12),
    },
    countryInfo: {
        flex: 1,
    },
    countryName: {
        fontSize: normalize(15),
        color: Colors.text?.primary || '#333',
        fontWeight: '500',
        fontFamily: Typography.fontFamily?.medium,
    },
    phoneLength: {
        fontSize: normalize(12),
        color: '#888',
        marginTop: normalize(2),
    },
    dialCode: {
        fontSize: normalize(15),
        color: Colors.primary || '#4285F4',
        fontWeight: '600',
        fontFamily: Typography.fontFamily?.semiBold,
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: Spacing.lg,
    },
});

export default CountryCodePicker;
