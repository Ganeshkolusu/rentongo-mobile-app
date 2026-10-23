// import React, { useState, useRef } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
// import { Colors } from '../constants/Colors';
// import { normalize, wp, hp, Spacing, BorderRadius } from '../constants/Dimensions';
// import { Typography } from '../constants/Typography';
// import MoreOptionsPopup from './MoreOptionsPopup';
// import { navigate } from '../services/NavigationService';

// const AutoCard = ({
//     autoName,
//     image,
//     members = '3 Members',
//     price,
//     priceUnit = '/km',
//     isAvailable = true,
//     onPress,
//     onEdit,
//     onDelete,
//     onAvailabilityChange,
//     onImagePress
// }) => {
//     const [showPopup, setShowPopup] = useState(false);
//     const [popupPosition, setPopupPosition] = useState({ top: 0, right: 0 });
//     const moreButtonRef = useRef(null);
//     const [currentAvailability, setCurrentAvailability] = useState(isAvailable);

//     const handleMorePress = () => {
//         moreButtonRef.current?.measure((fx, fy, width, height, px, py) => {
//             setPopupPosition({
//                 top: py + height,
//                 right: normalize(20)
//             });
//             setShowPopup(true);
//         });
//     };

//     const handleEdit = () => {
//         setShowPopup(false);
//         if (onEdit) onEdit();
//     };

//     const handleDelete = () => {
//         setShowPopup(false);
//         if (onDelete) onDelete();
//     };

//     const handleAvailabilityPress = () => {
//         navigate('DateTimeSelectionScreen', { fromScreen: 'availability' });
//     };


//     return (
//         <>
//         <TouchableOpacity
//             style={styles.card}
//             onPress={onPress}
//             activeOpacity={0.7}
//         >
//             <View style={styles.contentContainer}>
//                 <TouchableOpacity onPress={onImagePress} activeOpacity={0.8}>
//                     <Image
//                         source={typeof image === 'string' ? { uri: image } : image}
//                         style={styles.autoImage}
//                     />
//                 </TouchableOpacity>

//                 <View style={styles.detailsContainer}>
//                     <View style={styles.headerRow}>
//                         <Text style={styles.autoName}>{autoName}</Text>
//                         <TouchableOpacity
//                             ref={moreButtonRef}
//                             onPress={handleMorePress}
//                             style={styles.moreButton}
//                         >
//                             <Image
//                                 source={require('../assets/Icons/vector.png')}
//                                 style={styles.moreIcon}
//                             />
//                         </TouchableOpacity>
//                     </View>

//                     <View style={styles.specRow}>
//                         <Image
//                             source={require('../assets/Icons/seat.png')}
//                             style={styles.iconImage}
//                         />
//                         <Text style={styles.specText}>{members}</Text>
//                     </View>

//                     <View style={styles.priceRow}>
//                         <Text style={styles.price}>₹{price}</Text>
//                         <Text style={styles.priceUnit}>{priceUnit}</Text>
//                     </View>
//                 </View>
//             </View>

//             <TouchableOpacity
//                 style={[styles.statusContainer, currentAvailability ? styles.availableStatus : styles.unavailableStatus]}
//                 onPress={handleAvailabilityPress}
//                 activeOpacity={0.7}
//             >
//                 <Text style={[styles.statusText, currentAvailability ? styles.availableText : styles.unavailableText]}>
//                     {currentAvailability ? 'Available' : 'Not Available'}
//                 </Text>
//                 <Image
//                     source={require('../assets/Icons/dropdown.png')}
//                     style={[styles.dropdownIcon]}
//                 />
//             </TouchableOpacity>
//         </TouchableOpacity>

//         <MoreOptionsPopup
//             visible={showPopup}
//             onClose={() => setShowPopup(false)}
//             onEdit={handleEdit}
//             onDelete={handleDelete}
//             position={popupPosition}
//         />
//         </>
//     );
// };

// const styles = StyleSheet.create({
//     card: {
//         backgroundColor: Colors.white,
//         borderRadius: BorderRadius.lg,
//         marginBottom: Spacing.xs,
//         shadowColor: Colors.black,
//         shadowOffset: { width: 0, height: normalize(2) },
//         shadowOpacity: 0.08,
//         shadowRadius: normalize(4),
//         elevation: 3,
//         overflow: 'hidden',
//     },
//     contentContainer: {
//         flexDirection: 'row',
//         padding: Spacing.md,
//     },
//     autoImage: {
//         width: wp(25),
//         height: wp(25),
//         borderRadius: BorderRadius.md,
//         marginRight: Spacing.md,
//     },
//     detailsContainer: {
//         flex: 1,
//         justifyContent: 'space-between',
//     },
//     headerRow: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         marginBottom: Spacing.sm,
//     },
//     autoName: {
//         fontSize: Typography.fontSize.lg,
//         fontWeight: Typography.fontWeight.semiBold,
//         fontFamily: Typography.fontFamily.medium,
//         color: Colors.text.primary,
//     },
//     moreButton: {
//         padding: Spacing.xs,
//     },
//     specRow: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: Spacing.sm,
//     },
//     specText: {
//         marginLeft: Spacing.xs,
//         fontSize: Typography.fontSize.sm,
//         color: Colors.black,
//         fontFamily: Typography.fontFamily.regular,
//     },
//     priceRow: {
//         flexDirection: 'row',
//         alignItems: 'baseline',
//     },
//     price: {
//         fontSize: Typography.fontSize.xl,
//         fontWeight: Typography.fontWeight.bold,
//         fontFamily: Typography.fontFamily.bold,
//         color: Colors.text.primary,
//     },
//     priceUnit: {
//         fontSize: Typography.fontSize.sm,
//         color: Colors.text.secondary,
//         fontFamily: Typography.fontFamily.regular,
//     },
//     statusContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingHorizontal: Spacing.md,
//         paddingVertical: Spacing.sm,
//         width: normalize(170),
//         margin: normalize(10),
//         marginTop: normalize(-5)
//     },
//     availableStatus: {
//         backgroundColor: '#D7FBE4',
//     },
//     unavailableStatus: {
//         backgroundColor: '#FFC5C580',
//     },
//     statusText: {
//         fontSize: Typography.fontSize.md,
//         fontWeight: Typography.fontWeight.regular,
//         fontFamily: Typography.fontFamily.regular,
//     },
//     availableText: {
//         color: Colors.success,
//     },
//     unavailableText: {
//         color: Colors.error,
//     },
//     iconImage: {
//         width: normalize(16),
//         height: normalize(16),
//         tintColor: Colors.black,
//     },
//     dropdownIcon: {
//         width: normalize(20),
//         height: normalize(20),
//         tintColor: Colors.text.secondary,
//     },
//     moreIcon: {
//         width: normalize(20),
//         height: normalize(20),
//         resizeMode: 'contain',
//         tintColor: Colors.text.secondary,
//     },
// });

// export default AutoCard;