import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

export default function SafetyBanner() {
  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessible
      accessibilityLabel="Safety reminder: stop if you feel pain"
      accessibilityRole="alert"
    >
      <Text style={styles.text}>
        Movement guide — stop if you feel pain
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 130 : 110,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  text: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
  },
});
