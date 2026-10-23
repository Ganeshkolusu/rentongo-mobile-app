import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Image, TextInput } from 'react-native';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, BorderRadius } from '../constants/Dimensions';

const FormDropdown = ({ label, value, onSelect, options, placeholder, style, forceClose = false, required = false, error = false, errorMessage = '' }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);

    useEffect(() => {
        if (forceClose) {
            setModalVisible(false);
        }
    }, [forceClose]);

    // Filter options based on search text
    useEffect(() => {
        if (!searchText.trim()) {
            setFilteredOptions(options);
        } else {
            const filtered = options.filter(option =>
                option?.label?.toLowerCase()?.includes(searchText.toLowerCase())
            );
            setFilteredOptions(filtered);
        }
    }, [searchText, options]);

    // Reset search when modal opens/closes
    useEffect(() => {
        if (modalVisible) {
            setSearchText('');
            setFilteredOptions(options);
        }
    }, [modalVisible, options]);

    const handleSelect = (item) => {
        onSelect(item);
        setModalVisible(false);
        setSearchText('');
    };

    const renderOption = ({ item }) => (
        <TouchableOpacity
            style={styles.option}
            onPress={() => handleSelect(item)}
        >
            <Text style={styles.optionText}>{item.label}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>
                {label}
                {required && <Text style={styles.requiredAsterisk}> *</Text>}
            </Text>
            <TouchableOpacity
                style={[styles.dropdown, error && styles.dropdownError]}
                onPress={() => setModalVisible(true)}
            >
                <Text style={[styles.selectedText, !value && styles.placeholder]}>
                    {value ? value.label : placeholder}
                </Text>
                <Image
                    source={require('../assets/Icons/dropdown.png')}
                    style={styles.arrowIcon}
                />
            </TouchableOpacity>
            {error && errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{label}</Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeButtonText}>×</Text>
                            </TouchableOpacity>
                        </View>

                        {/* SearchBar inside dropdown */}
                        <View style={styles.searchContainer}>
                            <Image
                                source={require('../assets/Icons/search.png')}
                                style={styles.searchIcon}
                            />
                            <TextInput
                                style={styles.searchInput}
                                placeholder={`Search ${label?.toLowerCase() || 'options'}...`}
                                placeholderTextColor={Colors.text.light}
                                value={searchText}
                                onChangeText={setSearchText}
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                            {searchText.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => setSearchText('')}
                                    style={styles.clearButton}
                                >
                                    <Text style={styles.clearButtonText}>×</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <FlatList
                            data={filteredOptions}
                            renderItem={renderOption}
                            keyExtractor={(item) => item.value}
                            style={styles.optionsList}
                            ListEmptyComponent={() => (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>No results found</Text>
                                </View>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    requiredAsterisk: {
        color: '#FF0000',
        fontSize: Typography.fontSize.md,
        fontWeight: 'bold',
    },
    dropdown: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownError: {
        borderColor: '#FF0000',
        borderWidth: 2,
        backgroundColor: '#FFE5E5',
    },
    errorMessage: {
        color: '#FF0000',
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.regular,
    },
    selectedText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        flex: 1,
    },
    placeholder: {
        color: Colors.text.light,
    },
    arrowIcon: {
        width: 20,
        height: 20,
        tintColor: Colors.text.secondary,
        transform: [{ rotate: '-90deg' }],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        width: '90%',
        maxHeight: '70%',
        paddingVertical: Spacing.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semiBold,
        color: Colors.text.primary,
    },
    closeButton: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 22,
        color: Colors.text.secondary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.background,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchIcon: {
        width: 18,
        height: 18,
        tintColor: Colors.text.secondary,
        marginRight: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
        paddingVertical: Spacing.xs,
    },
    clearButton: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.xs,
    },
    clearButtonText: {
        fontSize: 20,
        color: Colors.text.secondary,
        fontWeight: 'bold',
    },
    optionsList: {
        paddingHorizontal: Spacing.lg,
    },
    option: {
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    optionText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.primary,
        fontFamily: Typography.fontFamily.regular,
    },
    emptyContainer: {
        paddingVertical: Spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: Typography.fontSize.md,
        color: Colors.text.secondary,
        fontFamily: Typography.fontFamily.regular,
    },
});

export default FormDropdown;