// import React, { useState } from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Colors } from '../../constants/Colors';
// import { Typography } from '../../constants/Typography';
// import { Spacing } from '../../constants/Dimensions';

// const VehicleTypeSection = ({ onSelectionChange }) => {
//   const [selectedTypes, setSelectedTypes] = useState({
//     cars: false,
//     bikes: false,
//   });

//   const toggleSelection = (type) => {
//     const newSelection = {
//       ...selectedTypes,
//       [type]: !selectedTypes[type],
//     };
//     setSelectedTypes(newSelection);
//     onSelectionChange && onSelectionChange(newSelection);
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Vehicle Type</Text>

//       <TouchableOpacity
//         style={styles.checkboxRow}
//         onPress={() => toggleSelection('cars')}
//       >
//         <View
//           style={[
//             styles.checkbox,
//             selectedTypes.cars && styles.checkedBox,
//           ]}
//         >
//           {selectedTypes.cars && <Text style={styles.checkmark}>✓</Text>}
//         </View>
//         <Text style={styles.label}>Cars</Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={styles.checkboxRow}
//         onPress={() => toggleSelection('bikes')}
//       >
//         <View
//           style={[
//             styles.checkbox,
//             selectedTypes.bikes && styles.checkedBox,
//           ]}
//         >
//           {selectedTypes.bikes && <Text style={styles.checkmark}>✓</Text>}
//         </View>
//         <Text style={styles.label}>Bikes</Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingHorizontal: Spacing.lg,
//     marginBottom: Spacing.lg,
//   },
//   title: {
//     fontSize: Typography.fontSize.lg,
//     fontWeight: Typography.fontWeight.bold,
//     fontFamily: Typography.fontFamily.bold,
//     color: Colors.text.primary,
//     marginBottom: Spacing.md,
//   },
//   checkboxRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: Spacing.md,
//   },
//   checkbox: {
//     width: 22,
//     height: 22,
//     borderWidth: 2,
//     borderColor: Colors.border,
//     marginRight: Spacing.md,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 4,
//   },
//   checkedBox: {
//     backgroundColor: Colors.activeTab,
//     borderColor: Colors.activeTab,
//   },
//   checkmark: {
//     color: Colors.white,
//     fontSize: Typography.fontSize.sm,
//     fontWeight: Typography.fontWeight.bold,
//   },
//   label: {
//     fontSize: Typography.fontSize.md,
//     color: Colors.text.primary,
//     fontFamily: Typography.fontFamily.regular,
//   },
// });

// export default VehicleTypeSection;
