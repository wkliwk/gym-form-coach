import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BADGES, loadEarnedBadges } from "../lib/badges";
import type { BadgeDefinition, EarnedBadge } from "../lib/badges";

const CATEGORY_LABELS: Record<string, string> = {
  consistency: "Consistency",
  volume: "Volume",
  form: "Form Quality",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function BadgeCard({
  badge,
  earned,
}: {
  badge: BadgeDefinition;
  earned: EarnedBadge | undefined;
}) {
  const unlocked = !!earned;
  return (
    <View style={[styles.badgeCard, !unlocked && styles.badgeCardLocked]}>
      <Text style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>
        {unlocked ? badge.emoji : "🔒"}
      </Text>
      <Text style={[styles.badgeName, !unlocked && styles.badgeTextLocked]}>
        {badge.name}
      </Text>
      <Text style={[styles.badgeDesc, !unlocked && styles.badgeTextLocked]}>
        {badge.description}
      </Text>
      {unlocked && earned && (
        <Text style={styles.badgeDate}>{formatDate(earned.unlockedAt)}</Text>
      )}
    </View>
  );
}

export default function BadgesScreen() {
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const refresh = useCallback(() => {
    loadEarnedBadges().then(setEarnedBadges);
  }, []);

  useFocusEffect(refresh);

  const earnedMap = new Map(earnedBadges.map((b) => [b.id, b]));

  const categories = ["all", "consistency", "volume", "form"];
  const filteredBadges =
    activeCategory === "all"
      ? BADGES
      : BADGES.filter((b) => b.category === activeCategory);

  const earnedCount = BADGES.filter((b) => earnedMap.has(b.id)).length;

  const renderItem = ({ item }: { item: BadgeDefinition }) => (
    <BadgeCard badge={item} earned={earnedMap.get(item.id)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Badges</Text>
        <Text style={styles.subtitle}>
          {earnedCount} / {BADGES.length} earned
        </Text>
      </View>

      {/* Category filter */}
      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterPill,
              activeCategory === cat && styles.filterPillActive,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.filterText,
                activeCategory === cat && styles.filterTextActive,
              ]}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredBadges}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0f",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: 14,
    color: "#ffffff50",
    fontWeight: "500",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#1a1a24",
    borderWidth: 1,
    borderColor: "#2a2a3a",
  },
  filterPillActive: {
    borderColor: "#00E5FF",
    backgroundColor: "#00E5FF15",
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff50",
  },
  filterTextActive: {
    color: "#00E5FF",
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    gap: 10,
    marginBottom: 10,
  },
  badgeCard: {
    flex: 1,
    backgroundColor: "#1a1a24",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#00E5FF30",
    minHeight: 140,
    justifyContent: "center",
  },
  badgeCardLocked: {
    borderColor: "#2a2a3a",
    opacity: 0.5,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 11,
    color: "#ffffff60",
    textAlign: "center",
    lineHeight: 15,
  },
  badgeTextLocked: {
    color: "#ffffff30",
  },
  badgeDate: {
    fontSize: 10,
    color: "#00E5FF",
    marginTop: 6,
    fontWeight: "500",
  },
});
