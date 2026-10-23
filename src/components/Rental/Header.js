import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => {
    return (
        <View style={styles.header}>
            <View style={styles.headerContent}>
                <Text style={styles.headerTitle}>LIVING THE</Text>
                <Text style={styles.headerSubtitle}>DIGITAL DREAM</Text>
                <View style={styles.carImageContainer}>
                    <View style={styles.carPlaceholder} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#007AFF',
        height: 200,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    carImageContainer: {
        alignItems: 'center',
    },
    carPlaceholder: {
        width: 120,
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 10,
    },
});

export default Header;