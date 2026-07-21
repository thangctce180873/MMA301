import { COLORS } from "../constants/colors";
import React from "react";

import { StyleSheet, TouchableOpacity } from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function BackButton({ onPress, disabled = false, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.72}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Quay lại"
      style={[styles.backButton, disabled && styles.disabledButton, style]}
    >
      <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: COLORS.primaryLight,

    borderWidth: 1,
    borderColor: COLORS.border,

    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 2,
  },

  disabledButton: {
    opacity: 0.5,
  },
});
