import { useEffect, useMemo } from "react";
import { ScrollView, Text, View, Pressable, FlatList, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore, useResponseStore } from "@/lib/store";
import { calculateNPS } from "@/lib/analytics";
import type { SurveyResponse } from "@/lib/types";

// ── NPS Gauge Component ──────────────────────────────────────
function NPSGauge({ score }: { score: number }) {
  const colors = useColors();
  const clampedScore = Math.max(-100, Math.min(100, score));
  const percentage = (clampedScore + 100) / 200; // 0 to 1

  const gaugeColor =
    clampedScore >= 30
      ? colors.success
      : clampedScore >= 0
      ? colors.warning
      : colors.error;

  const label =
    clampedScore >= 30
      ? "Excellent"
      : clampedScore >= 0
      ? "Good"
      : "Needs Improvement";

  return (
    <View style={styles.gaugeContainer}>
      <Text style={[styles.npsScore, { color: gaugeColor }]}>{clampedScore}</Text>
      <Text style={[styles.npsLabel, { color: colors.muted }]}>NPS Score</Text>
      <View style={[styles.gaugeBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.gaugeFill,
            { width: `${percentage * 100}%` as any, backgroundColor: gaugeColor },
          ]}
        />
      </View>
      <Text style={[styles.npsCategory, { color: gaugeColor }]}>{label}</Text>
    </View>
  );
}

// ── Stat Card Component ──────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <IconSymbol name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.muted }]}>{label}</Text>
    </View>
  );
}

// ── Response Item ────────────────────────────────────────────
function ResponseItem({ item, onPress }: { item: SurveyResponse; onPress: () => void }) {
  const colors = useColors();
  const preview = item.answers.find((a) => a.questionType === "text")?.value;
  const date = new Date(item.submittedAt).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.responseItem,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.responseHeader}>
        <SentimentBadge sentiment={item.sentiment} size="sm" />
        <Text style={[styles.responseDate, { color: colors.muted }]}>{date}</Text>
      </View>
      <Text style={[styles.responseSurvey, { color: colors.muted }]} numberOfLines={1}>
        {item.surveyTitle}
      </Text>
      {preview ? (
        <Text style={[styles.responsePreview, { color: colors.foreground }]} numberOfLines={2}>
          "{String(preview)}"
        </Text>
      ) : null}
    </Pressable>
  );
}

// ── Main Dashboard Screen ────────────────────────────────────
export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();

  const { surveys, initializeWithSeedData: initSurveys } = useSurveyStore();
  const { responses, initializeWithSeedData: initResponses } = useResponseStore();

  useEffect(() => {
    initSurveys();
    initResponses();
  }, []);

  const activeSurveys = useMemo(() => surveys.filter((s) => s.status === "active"), [surveys]);
  const npsScore = useMemo(() => calculateNPS(responses), [responses]);
  const recentResponses = useMemo(() => responses.slice(0, 5), [responses]);

  const todayResponses = useMemo(() => {
    const today = new Date().toDateString();
    return responses.filter((r) => new Date(r.submittedAt).toDateString() === today).length;
  }, [responses]);

  const positiveCount = useMemo(
    () => responses.filter((r) => r.sentiment === "positive").length,
    [responses]
  );
  const negativeCount = useMemo(
    () => responses.filter((r) => r.sentiment === "negative").length,
    [responses]
  );

  const handleResponsePress = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/response/${id}`);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.headerTitle}>FeedbackIQ</Text>
            <Text style={styles.headerSubtitle}>Customer Feedback Dashboard</Text>
          </View>
          <Pressable
            onPress={() => router.push("/survey/create")}
            style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="plus" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* NPS Card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Net Promoter Score</Text>
            <NPSGauge score={npsScore} />
            <View style={styles.npsBreakdown}>
              <View style={styles.npsBreakdownItem}>
                <View style={[styles.npsBreakdownDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.npsBreakdownLabel, { color: colors.muted }]}>Promoters</Text>
                <Text style={[styles.npsBreakdownValue, { color: colors.foreground }]}>
                  {responses.filter((r) => (r.npsScore ?? 0) >= 9).length}
                </Text>
              </View>
              <View style={styles.npsBreakdownItem}>
                <View style={[styles.npsBreakdownDot, { backgroundColor: colors.warning }]} />
                <Text style={[styles.npsBreakdownLabel, { color: colors.muted }]}>Passives</Text>
                <Text style={[styles.npsBreakdownValue, { color: colors.foreground }]}>
                  {responses.filter((r) => (r.npsScore ?? 0) >= 7 && (r.npsScore ?? 0) <= 8).length}
                </Text>
              </View>
              <View style={styles.npsBreakdownItem}>
                <View style={[styles.npsBreakdownDot, { backgroundColor: colors.error }]} />
                <Text style={[styles.npsBreakdownLabel, { color: colors.muted }]}>Detractors</Text>
                <Text style={[styles.npsBreakdownValue, { color: colors.foreground }]}>
                  {responses.filter((r) => (r.npsScore ?? 0) <= 6 && r.npsScore !== undefined).length}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <StatCard
              label="Total Responses"
              value={responses.length}
              icon="bubble.left.fill"
              color={colors.primary}
            />
            <StatCard
              label="Today"
              value={todayResponses}
              icon="clock.fill"
              color={colors.success}
            />
            <StatCard
              label="Active Surveys"
              value={activeSurveys.length}
              icon="doc.text.fill"
              color={colors.warning}
            />
          </View>

          {/* Sentiment Row */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sentiment Overview</Text>
            <View style={styles.sentimentRow}>
              <View style={styles.sentimentItem}>
                <Text style={styles.sentimentEmoji}>😊</Text>
                <Text style={[styles.sentimentCount, { color: colors.success }]}>{positiveCount}</Text>
                <Text style={[styles.sentimentLabel, { color: colors.muted }]}>Positive</Text>
              </View>
              <View style={styles.sentimentItem}>
                <Text style={styles.sentimentEmoji}>😐</Text>
                <Text style={[styles.sentimentCount, { color: colors.warning }]}>
                  {responses.filter((r) => r.sentiment === "neutral").length}
                </Text>
                <Text style={[styles.sentimentLabel, { color: colors.muted }]}>Neutral</Text>
              </View>
              <View style={styles.sentimentItem}>
                <Text style={styles.sentimentEmoji}>😞</Text>
                <Text style={[styles.sentimentCount, { color: colors.error }]}>{negativeCount}</Text>
                <Text style={[styles.sentimentLabel, { color: colors.muted }]}>Negative</Text>
              </View>
            </View>
            {responses.length > 0 && (
              <View style={[styles.sentimentBar, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.sentimentBarFill,
                    {
                      width: `${(positiveCount / responses.length) * 100}%` as any,
                      backgroundColor: colors.success,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.sentimentBarFill,
                    {
                      width: `${(responses.filter((r) => r.sentiment === "neutral").length / responses.length) * 100}%` as any,
                      backgroundColor: colors.warning,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.sentimentBarFill,
                    {
                      width: `${(negativeCount / responses.length) * 100}%` as any,
                      backgroundColor: colors.error,
                    },
                  ]}
                />
              </View>
            )}
          </View>

          {/* Recent Responses */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Responses</Text>
            <Pressable
              onPress={() => router.push("/responses")}
              style={({ pressed }) => [pressed && { opacity: 0.6 }]}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
            </Pressable>
          </View>

          {recentResponses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No responses yet</Text>
            </View>
          ) : (
            recentResponses.map((item) => (
              <ResponseItem
                key={item.id}
                item={item}
                onPress={() => handleResponsePress(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
  },
  gaugeContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  npsScore: {
    fontSize: 56,
    fontWeight: "800",
    letterSpacing: -2,
    lineHeight: 64,
  },
  npsLabel: {
    fontSize: 13,
    marginBottom: 12,
  },
  gaugeBar: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    flexDirection: "row",
  },
  gaugeFill: {
    height: "100%",
    borderRadius: 4,
  },
  npsCategory: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  npsBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E2E8F0",
  },
  npsBreakdownItem: {
    alignItems: "center",
    gap: 4,
  },
  npsBreakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  npsBreakdownLabel: {
    fontSize: 11,
  },
  npsBreakdownValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  sentimentRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  sentimentItem: {
    alignItems: "center",
    gap: 4,
  },
  sentimentEmoji: {
    fontSize: 28,
  },
  sentimentCount: {
    fontSize: 20,
    fontWeight: "700",
  },
  sentimentLabel: {
    fontSize: 11,
  },
  sentimentBar: {
    height: 6,
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  sentimentBarFill: {
    height: "100%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "500",
  },
  responseItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  responseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  responseDate: {
    fontSize: 12,
  },
  responseSurvey: {
    fontSize: 12,
  },
  responsePreview: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  emptyState: {
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
