import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { BadgeDefinition } from "../lib/badges";

interface BadgeUnlockModalProps {
  badges: BadgeDefinition[];
  onDismiss: () => void;
}

export default function BadgeUnlockModal({
  badges,
  onDismiss,
}: BadgeUnlockModalProps) {
  const visible = badges.length > 0;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.headline}>
            {badges.length === 1 ? "Badge Unlocked! 🎉" : `${badges.length} Badges Unlocked! 🎉`}
          </Text>

          <ScrollView
            contentContainerStyle={styles.badgeList}
            showsVerticalScrollIndicator={false}
          >
            {badges.map((badge) => (
              <View key={badge.id} style={styles.badgeRow}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                <View style={styles.badgeInfo}>
                  <Text style={styles.badgeName}>{badge.name}</Text>
                  <Text style={styles.badgeDesc}>{badge.description}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={onDismiss}
            activeOpacity={0.8}
          >
            <Text style={styles.dismissText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "#1a1a24",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderColor: "#00E5FF30",
  },
  headline: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
  },
  badgeList: {
    gap: 14,
    paddingBottom: 4,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: "#0a0a0f",
    borderRadius: 12,
    padding: 14,
  },
  badgeEmoji: {
    fontSize: 36,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 3,
  },
  badgeDesc: {
    fontSize: 13,
    color: "#ffffff60",
    lineHeight: 18,
  },
  dismissButton: {
    marginTop: 20,
    backgroundColor: "#00E5FF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  dismissText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0a0a0f",
  },
});
