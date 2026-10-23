import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Image,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, BorderRadius } from '../../constants/Dimensions';

const FilterDropdown = ({ label, options, selectedValue, onValueChange, placeholder }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Filter options based on search text using useMemo for better performance
  const filteredOptions = useMemo(() => {
    if (!searchText.trim()) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText, options]);

  const handleSelect = useCallback((value) => {
    if (onValueChange) {
      onValueChange(value);
    }
    setSearchText('');
    setIsVisible(false);
  }, [onValueChange]);

  const toggleDropdown = () => {
    if (!isVisible) {
      setSearchText(''); // Reset search when opening
    }
    setIsVisible(!isVisible);
  };

  const getSelectedLabel = () => {
    if (!selectedValue || selectedValue === '') {
      return placeholder;
    }
    const selectedOption = options.find(
      (option) =>
        option.value === selectedValue ||
        option.value.toLowerCase() === selectedValue.toLowerCase()
    );
    return selectedOption ? selectedOption.label : placeholder;
  };

  const renderItem = useCallback(({ item }) => {
    const isSelected =
      selectedValue &&
      (item.value === selectedValue ||
        item.value.toLowerCase() === selectedValue.toLowerCase());
    return (
      <TouchableOpacity
        style={[styles.optionItem, isSelected && styles.selectedOption]}
        onPress={() => handleSelect(item.value)}
        activeOpacity={0.6}
      >
        <Text
          style={[
            styles.optionText,
            isSelected && styles.selectedOptionText,
          ]}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  }, [selectedValue, handleSelect]);

  const keyExtractor = useCallback((item) => item.value, []);


  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownText}>{getSelectedLabel()}</Text>
        <Text style={[styles.arrow, isVisible && styles.arrowUp]}>▼</Text>
      </TouchableOpacity>

      {isVisible && (
        <View style={styles.dropdownList}>
          {/* SearchBar */}
          <View style={styles.searchContainer}>
            <Image
              source={require('../../assets/Icons/search.png')}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={`Search ${label.toLowerCase()}...`}
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

          {filteredOptions.length > 0 ? (
            <FlatList
              data={filteredOptions}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={styles.scrollArea}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={10}
              removeClippedSubviews={true}
              getItemLayout={(data, index) => ({
                length: 48,
                offset: 48 * index,
                index,
              })}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.closeOption}
            onPress={() => setIsVisible(false)}
            activeOpacity={0.6}
          >
            <Text style={styles.closeOptionText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.regular,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  dropdownText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
    flex: 1,
  },
  arrow: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    transform: [{ rotate: '0deg' }],
  },
  arrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 300,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  scrollArea: {
    maxHeight: 200,
  },
  optionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    fontFamily: Typography.fontFamily.regular,
  },
  selectedOptionText: {
    color: '#141248',
    fontWeight: Typography.fontWeight.bold,
  },
  closeOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  closeOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
  emptyContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontFamily: Typography.fontFamily.regular,
  },
});

export default FilterDropdown;
