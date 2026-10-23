import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { normalize, wp, hp, responsiveValue, Spacing, BorderRadius, Layout } from '../constants/Dimensions';
import { Typography } from '../constants/Typography';

const FormInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    multiline = false,
    numberOfLines = 1,
    keyboardType = 'default',
    style,
    error = false,
    errorMessage = '',
    maxLength,
    required = false,
    autoCapitalize,
    editable = true
}) => {
    return (
        <View style={[styles.container, style]}>
            {label ? (
                <Text style={[styles.label, !editable && styles.labelDisabled]}>
                    {label}
                    {required && <Text style={styles.requiredAsterisk}> *</Text>}
                </Text>
            ) : null}
            <TextInput
                style={[
                    styles.input,
                    multiline && { height: numberOfLines * normalize(40), textAlignVertical: 'top' },
                    error && styles.inputError,
                    !editable && styles.inputDisabled
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={!editable ? Colors.grey : Colors.text.light}
                multiline={multiline}
                numberOfLines={numberOfLines}
                keyboardType={keyboardType}
                maxLength={maxLength}
                autoCapitalize={autoCapitalize}
                editable={editable}
            />
            {error && errorMessage ? (
                <Text style={styles.errorMessage}>{errorMessage}</Text>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.md,
        lineHeight: Typography.lineHeight.md,
        fontWeight: Typography.fontWeight.medium,
        fontFamily: Typography.fontFamily.medium,
        color: Colors.text.primary,
        marginBottom: Spacing.sm,
    },
    requiredAsterisk: {
        color: '#FF0000',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    input: {
        borderWidth: normalize(1),
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
        lineHeight: Typography.lineHeight.md,
        color: Colors.text.primary,
        backgroundColor: Colors.white,
        fontFamily: Typography.fontFamily.regular,
    },
    inputError: {
        borderColor: '#FF0000',
        borderWidth: normalize(2),
        backgroundColor: '#FFE5E5',
    },
    inputDisabled: {
        backgroundColor: '#F0F0F0',
        color: Colors.grey,
    },
    labelDisabled: {
        color: Colors.grey,
    },
    errorMessage: {
        color: '#FF0000',
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
        fontFamily: Typography.fontFamily.regular,
    },
});

export default FormInput;