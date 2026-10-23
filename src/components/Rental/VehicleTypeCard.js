import { LinearGradient } from "expo-linear-gradient";
import React, { forwardRef, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/Colors";
import { normalize, Spacing } from "../../constants/Dimensions";
import { Typography } from "../../constants/Typography";

const VehicleTypeCard = forwardRef(({ onSelect, selectedType: externalSelectedType }, ref) => {
  const [selectedType, setSelectedType] = useState(externalSelectedType || "car");

  useEffect(() => {
    if (onSelect) {
      onSelect("car"); // default select car when component mounts
    }
  }, []);

  const vehicleTypes = [
    { id: "car", title: "Car's", icon: require("../../assets/Icons/whitecar.png") },
    { id: "bike", title: "Bike", icon: require("../../assets/Icons/bike.png") },
    { id: "auto", title: "", icon: require("../../assets/Icons/autoRightFace.png") },
  ];

  const handleSelect = (id) => {
    setSelectedType(id);
    if (onSelect) onSelect(id);
  };

  return (
    <View ref={ref} style={styles.container}>
      <Text style={styles.title}>Select Category</Text>

      <View style={styles.cardRow}>
        {vehicleTypes.map((item) => {
          const isSelected = selectedType === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.cardWrapper}
              onPress={item.id === "auto" ? null : () => handleSelect(item.id)}
              activeOpacity={item.id === "auto" ? 1 : 0.85}
              disabled={item.id === "auto"}
            >
              <LinearGradient
                colors={isSelected ? Colors.gradient.primary : [Colors.white, Colors.white]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.card,
                  isSelected ? styles.selectedCard : styles.unselectedCard,
                  item.id === "auto" && { opacity: 0.08 },
                ]}
              >
                {/* Unselected */}
                {!isSelected && (
                  <LinearGradient
                    colors={Colors.gradient.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.borderLayer}
                  >
                    <View style={styles.innerCard}>
                      <LinearGradient colors={["#ffffff", "#fdfdfd"]} style={styles.innerContent}>
                        <LinearGradient
                          colors={Colors.gradient.primary}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.iconCircle}
                        >
                          <Image source={item.icon} style={styles.icon} resizeMode="contain" />
                        </LinearGradient>
                        <Text style={styles.text}>{item.title}</Text>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                )}

                {/* Selected */}
                {isSelected && (
                  <View style={styles.innerSelected}>
                    <View style={styles.selectedIconCircle}>
                      <Image
                        source={item.icon}
                        style={[styles.icon, styles.iconSelected]}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={[styles.text, styles.textSelected]}>{item.title}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

export default VehicleTypeCard;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: normalize(15),
    marginTop: normalize(10),
    marginBottom: normalize(15),
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    marginBottom: normalize(8),
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardWrapper: {
    flex: 1,
    marginHorizontal: normalize(6),
  },
  card: {
    height: normalize(110),
    width: normalize(106),
    borderRadius: normalize(16),
    justifyContent: "center",
    alignItems: "center",
  },
  unselectedCard: {
    backgroundColor: Colors.white,
  },
  borderLayer: {
    borderRadius: normalize(16),
    padding: 1.5,
    width: "100%",
    height: "100%",
  },
  innerCard: {
    flex: 1,
    borderRadius: normalize(16),
    backgroundColor: Colors.white,
  },
  innerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: normalize(16),
  },
  iconCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(60),
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  selectedCard: {
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  innerSelected: {
    justifyContent: "center",
    alignItems: "center",
  },
  selectedIconCircle: {
    width: normalize(60),
    height: normalize(60),
    borderRadius: normalize(60),
    backgroundColor: Colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  icon: {
    width: normalize(34),
    height: normalize(34),
  },
  iconSelected: {
    tintColor: Colors.gradient.primary[0],
  },
  text: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.text.primary,
  },
  textSelected: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
});