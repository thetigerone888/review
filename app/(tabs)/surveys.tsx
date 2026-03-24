import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore } from "@/lib/store";
import type { Survey, SurveyStatus } from "@/lib/types";

const STATUS_FILTERS: { value: SurveyStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "closed", label: "Closed" },
];

const STATUS_CONFIG: Record<SurveyStatus, { color: string; bg: string; label: string }> = {
  active: { color: "#10B981", bg: "#10B98120", label: "Active" },
  draft: { color: "#64748B", bg: "#64748B20", label: "Draft" },
  closed: { color: "#94A3B8", bg: "#94A3B820", label: "Closed" },
};

const CHANNEL_ICONS: Record<string, string> = {
  qr: "qrcode",
  link: "link",
  in_app: "eye",
  email: "paperplane.fill",
};

function SurveyCard({ survey, onPress }: { survey: Survey; onPress: () => void }) {
  const colors = useColors();
  const status = STATUS_CONFIG[survey.status];
  const date = new Date(survey.createdAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.surveyCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
        <Text style={[styles.cardDate, { color: colors.muted }]}>{date}</Text>
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {survey.title}
      </Text>
      {survey.description ? (
        <Text style={[styles.cardDesc, { color: colors.muted }]} numberOfLines={2}>
          {survey.description}
        </Text>
      ) : null}
      <View style={styles.cardFooter}>
        <View style={styles.responseCount}>
          <IconSymbol name="bubble.left.fill" size={14} color={colors.primary} />
          <Text style={[styles.responseCountText, { color: colors.foreground }]}>
            {survey.responseCount} responses
          </Text>
        </View>
        <View style={styles.channelIcons}>
          {survey.channels.map((ch) => (
            <View key={ch} style={[styles.channelIcon, { backgroundColor: colors.background }]}>
              <IconSymbol name={CHANNEL_ICONS[ch] as any} size={12} color={colors.muted} />
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

export default function SurveysScreen() {
  const router = useRouter();
  const colors = useColors();
  const { surveys } = useSurveyStore();
  const [filter, setFilter] = useState<SurveyStatus | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? surveys : surveys.filter((s) => s.status === filter)),
    [surveys, filter]
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Surveys</Text>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/survey/create");
          }}
          style={({ pressed }) => [styles.createBtn, pressed && { opacity: 0.8 }]}
        >
          <IconSymbol name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>New</Text>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {STATUS_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setFilter(f.value)}
            style={({ pressed }) => [
              styles.filterTab,
              filter === f.value && [styles.filterTabActive, { borderBottomColor: colors.primary }],
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterTabText,
                { color: filter === f.value ? colors.primary : colors.muted },
                filter === f.value && { fontWeight: "600" },
              ]}
            >
              {f.label}
            </Text>
            <Text style={[styles.filterTabCount, { color: filter === f.value ? colors.primary : colors.muted }]}>
              {f.value === "all"
                ? surveys.length
                : surveys.filter((s) => s.status === f.value).length}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SurveyCard
            survey={item}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/survey/${item.id}`);
            }}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No surveys yet</Text>
            <Text style={[styles.emptyDesc, { color: colors.muted }]}>
              Create your first survey to start collecting feedback
            </Text>
            <Pressable
              onPress={() => router.push("/survey/create")}
              style={({ pressed }) => [
                styles.emptyBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.emptyBtnText}>Create Survey</Text>
            </Pressable>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: 13,
  },
  filterTabCount: {
    fontSize: 11,
    fontWeight: "600",
  },
  list: {
    padding: 14,
    paddingBottom: 24,
  },
  surveyCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  cardDate: {
    fontSize: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  responseCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  responseCountText: {
    fontSize: 13,
    fontWeight: "500",
  },
  channelIcons: {
    flexDirection: "row",
    gap: 4,
  },
  channelIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
