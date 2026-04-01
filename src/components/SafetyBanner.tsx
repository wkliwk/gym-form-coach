import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SafetyBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Movement guide — stop if you feel pain
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: "#00000080",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  text: {
    fontSize: 12,
    color: "#ffffff99",
    textAlign: "center",
  },
});
