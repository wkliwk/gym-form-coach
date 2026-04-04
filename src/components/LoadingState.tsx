import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#00E5FF" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  message: {
    fontSize: 14,
    color: "#ffffff60",
    marginTop: 16,
    textAlign: "center",
  },
});
