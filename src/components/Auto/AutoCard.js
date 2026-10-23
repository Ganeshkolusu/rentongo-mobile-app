// import React from 'react';
// import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
// import { Colors } from '../../constants/Colors';
// import { Typography } from '../../constants/Typography';
// import { Spacing, BorderRadius, wp, hp, responsiveValue } from '../../constants/Dimensions';

// const AutoCard = ({ auto, onPress }) => {
//     return (
//         <TouchableOpacity
//             style={styles.autoItem}
//             onPress={() => onPress && onPress(auto)}
//         >
//             <View style={styles.autoImageContainer}>
//                 <Image
//                     source={auto.image}
//                     style={styles.autoImage}
//                     resizeMode="cover"
//                 />
//             </View>

//             <View style={styles.autoDetails}>
//                 <Text style={styles.autoTitle}>{auto.title}</Text>

//                 <View style={styles.ratingContainer}>
//                     <Image
//                         source={require('../../assets/Icons/star.png')}
//                         style={styles.starIcon}
//                     />
//                     <Text style={styles.rating}>{auto.rating || '4.2'}</Text>
//                 </View>

//                 <View style={styles.membersContainer}>
//                     <Image
//                         source={require('../../assets/Icons/seat.png')}
//                         style={styles.seatIcon}
//                     />
//                     <Text style={styles.membersText}>{auto.seats} Members</Text>
//                 </View>
//             </View>

//             <View style={styles.rightSection}>
//                 <Text style={styles.price}>₹{auto.price}/km</Text>
//                 <TouchableOpacity
//                     style={styles.arrowButton}
//                     onPress={() => onPress && onPress(auto)}
//                 >
//                     <Text style={styles.arrow}>❯</Text>
//                 </TouchableOpacity>
//             </View>
//         </TouchableOpacity>
//     );
// };

// const styles = StyleSheet.create({
//     autoItem: {
//         flexDirection: 'row',
//         backgroundColor: Colors.white,
//         borderRadius: BorderRadius.lg,
//         padding: Spacing.md,
//         marginBottom: Spacing.sm,
//         alignItems: 'center',
//         shadowColor: Colors.black,
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     autoImageContainer: {
//         width: responsiveValue(wp(18), wp(20), wp(22), wp(16)),
//         height: responsiveValue(wp(18), wp(20), wp(22), wp(16)),
//         borderRadius: responsiveValue(BorderRadius.sm, BorderRadius.md, BorderRadius.md, BorderRadius.lg),
//         overflow: 'hidden',
//         marginRight: responsiveValue(wp(3), wp(4), wp(4.5), wp(5)),
//     },
//     autoImage: {
//         width: '100%',
//         height: '100%',
//     },
//     autoDetails: {
//         flex: 1,
//         justifyContent: 'center',
//     },
//     autoTitle: {
//         fontSize: Typography.fontSize.lg,
//         fontWeight: Typography.fontWeight.bold,
//         fontFamily: Typography.fontFamily.bold,
//         color: Colors.text.primary,
//         marginBottom: Spacing.xs,
//     },
//     ratingContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         borderWidth: 1,
//         borderColor: '#FFD700',
//         paddingHorizontal: Spacing.sm,
//         paddingVertical: 4,
//         borderRadius: BorderRadius.sm,
//         backgroundColor: Colors.white,
//         alignSelf: 'flex-start',
//         marginBottom: Spacing.xs,
//     },
//     starIcon: {
//         width: 14,
//         height: 14,
//         marginRight: 4,
//         tintColor: '#FFD700',
//     },
//     rating: {
//         fontSize: Typography.fontSize.sm,
//         fontWeight: Typography.fontWeight.medium,
//         color: '#FFD700',
//     },
//     membersContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//     },
//     seatIcon: {
//         width: 16,
//         height: 16,
//         marginRight: Spacing.xs,
//         tintColor: Colors.text.secondary,
//     },
//     membersText: {
//         fontSize: Typography.fontSize.sm,
//         color: Colors.text.secondary,
//         fontWeight: Typography.fontWeight.regular,
//         fontFamily: Typography.fontFamily.regular,
//     },
//     rightSection: {
//         alignItems: 'flex-end',
//         justifyContent: 'space-between',
//         height: responsiveValue(wp(18), wp(20), wp(22), wp(16)),
//         paddingVertical: responsiveValue(wp(1), wp(1.5), wp(2), wp(2.5)),
//     },
//     price: {
//         fontSize: Typography.fontSize.md,
//         fontWeight: Typography.fontWeight.bold,
//         fontFamily: Typography.fontFamily.bold,
//         color: Colors.text.primary,
//     },
//     arrowButton: {
//         width: responsiveValue(wp(7), wp(8), wp(9), wp(6)),
//         height: responsiveValue(wp(7), wp(8), wp(9), wp(6)),
//         borderRadius: responsiveValue(wp(3.5), wp(4), wp(4.5), wp(3)),
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     arrow: {
//         fontSize: Typography.fontSize.md,
//         color: Colors.text.primary,
//         fontWeight: Typography.fontWeight.bold,
//     },
// });

// export default AutoCard;