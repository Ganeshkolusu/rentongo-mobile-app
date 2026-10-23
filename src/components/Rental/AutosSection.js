// import React from 'react';
// import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
// import { Colors } from '../../constants/Colors';
// import { Typography } from '../../constants/Typography';
// import { Spacing } from '../../constants/Dimensions';
// import AutoCard from './AutoCard';

// const AutosSection = ({ autos, onViewAll, onAutoPress }) => {
//     return (
//         <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//                 <Text style={styles.sectionTitle}>Looking for an Auto?</Text>
//                 <TouchableOpacity onPress={onViewAll} style={styles.viewAllButton}>
//                     <Text style={styles.viewAll}>View All</Text>
//                     <Text style={styles.arrow}> ❯ </Text>
//                 </TouchableOpacity>
//             </View>

//             <ScrollView
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.horizontalScroll}
//             >
//                 {autos.map((auto, index) => (
//                     <AutoCard
//                         key={auto.id || index}
//                         auto={auto}
//                         onPress={() => onAutoPress && onAutoPress(auto)}
//                     />
//                 ))}
//             </ScrollView>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     section: {
//         paddingHorizontal: Spacing.md,
//         marginBottom: 120,
//         marginTop: Spacing.sm,
//     },
//     sectionHeader: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: Spacing.md,
//     },
//     sectionTitle: {
//         fontSize: Typography.fontSize.lg,
//         fontWeight: Typography.fontWeight.bold,
//         fontFamily: Typography.fontFamily.bold,
//         color: Colors.text.primary,
//     },
//     viewAllButton: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     viewAll: {
//         fontSize: Typography.fontSize.md,
//         fontWeight: Typography.fontWeight.medium,
//         fontFamily: Typography.fontFamily.medium,
//         color: Colors.text.primary,
//     },
//     arrow: {
//         fontSize: Typography.fontSize.lg,
//         color: Colors.text.primary,
//         marginLeft: 4,
//     },
//     horizontalScroll: {
//         paddingRight: Spacing.lg,
//         marginBottom: Spacing.md,
//     },
// });

// export default AutosSection;