import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore, useResponseStore } from "@/lib/store";
import { computeAnalytics, calculateNPS } from "@/lib/analytics";
import type { Survey } from "@/lib/types";

// ── Simple Bar Chart ─────────────────────────────────────────
function BarChart({
  data,
  maxValue,
  color,
  labels,
}: {
  data: number[];
  maxValue: number;
  color: string;
  labels: string[];
}) {
  const colors = useColors();
  return (
    <View style={styles.barChart}>
      {data.map((val, i) => {
        const height = maxValue > 0 ? (val / maxValue) * 80 : 0;
        return (
          <View key={i} style={styles.barItem}>
            <Text style={[styles.barValue, { color: colors.foreground }]}>
              {val > 0 ? val : ""}
            </Text>
            <View style={[styles.barWrapper, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.barFill,
                  { height: Math.max(height, val > 0 ? 4 : 0), backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.muted }]} numberOfLines={1}>
              {labels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── NPS Trend Line ────────────────────────────────────────────
function NPSTrendChart({ trend }: { trend: { date: string; score: number }[] }) {
  const colors = useColors();
  if (trend.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={[styles.emptyChartText, { color: colors.muted }]}>No trend data yet</Text>
      </View>
    );
  }

  const scores = trend.map((t) => t.score);
  const min = Math.min(...scores, -50);
  const max = Math.max(...scores, 50);
  const range = max - min || 100;

  return (
    <View style={styles.trendChart}>
      <View style={styles.trendLine}>
        {trend.map((point, i) => {
          const normalized = (point.score - min) / range;
          const bottom = normalized * 60;
          const color =
            point.score >= 30 ? colors.success : point.score >= 0 ? colors.warning : colors.error;
          return (
            <View key={i} style={[styles.trendPoint, { bottom }]}>
              <View style={[styles.trendDot, { backgroundColor: color }]} />
              <Text style={[styles.trendScore, { color }]}>{point.score}</Text>
            </View>
          );
        })}
      </View>
      <View style={styles.trendLabels}>
        {trend.map((point, i) => (
          <Text key={i} style={[styles.trendLabel, { color: colors.muted }]}>
            {point.date.slice(5)}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Donut Segment ─────────────────────────────────────────────
function SentimentDonut({
  positive,
  neutral,
  negative,
  total,
}: {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}) {
  const colors = useColors();
  if (total === 0) {
    return (
      <View style={styles.donutEmpty}>
        <Text style={[styles.donutEmptyText, { color: colors.muted }]}>No data</Text>
      </View>
    );
  }

  const segments = [
    { value: positive, color: colors.success, label: "Positive", pct: Math.round((positive / total) * 100) },
    { value: neutral, color: colors.warning, label: "Neutral", pct: Math.round((neutral / total) * 100) },
    { value: negative, color: colors.error, label: "Negative", pct: Math.round((negative / total) * 100) },
  ];

  return (
    <View style={styles.donutContainer}>
      {/* Visual bar representation */}
      <View style={[styles.donutBar, { backgroundColor: colors.border }]}>
        {segments.map((seg) => (
          <View
            key={seg.label}
            style={[
              styles.donutSegment,
              { width: `${seg.pct}%` as any, backgroundColor: seg.color },
            ]}
          />
        ))}
      </View>
      <View style={styles.donutLegend}>
        {segments.map((seg) => (
          <View key={seg.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: seg.color }]} />
            <Text style={[styles.legendLabel, { color: colors.muted }]}>{seg.label}</Text>
            <Text style={[styles.legendValue, { color: colors.foreground }]}>
              {seg.value} ({seg.pct}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { surveys } = useSurveyStore();
  const { responses } = useResponseStore();

  const [selectedSurveyId, setSelectedSurveyId] = useState<string>("all");

  const filteredResponses = useMemo(() => {
    if (selectedSurveyId === "all") return responses;
    return responses.filter((r) => r.surveyId === selectedSurveyId);
  }, [responses, selectedSurveyId]);

  const analytics = useMemo(() => {
    const surveyId = selectedSurveyId === "all" ? "all" : selectedSurveyId;
    return computeAnalytics(surveyId, filteredResponses.map(r => ({ ...r, surveyId: surveyId })));
  }, [filteredResponses, selectedSurveyId]);

  const npsScore = useMemo(() => calculateNPS(filteredResponses), [filteredResponses]);

  const channelData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResponses.forEach((r) => {
      map[r.channel] = (map[r.channel] || 0) + 1;
    });
    return map;
  }, [filteredResponses]);

  const channelLabels = ["QR", "Link", "In-App", "Email"];
  const channelValues = [
    channelData["qr"] ?? 0,
    channelData["link"] ?? 0,
    channelData["in_app"] ?? 0,
    channelData["email"] ?? 0,
  ];
  const maxChannel = Math.max(...channelValues, 1);

  const npsTrend = useMemo(() => {
    const map: Record<string, number[]> = {};
    filteredResponses.forEach((r) => {
      if (r.npsScore !== undefined) {
        const date = r.submittedAt.slice(0, 10);
        if (!map[date]) map[date] = [];
        map[date].push(r.npsScore);
      }
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, scores]) => {
        const promoters = scores.filter((s) => s >= 9).length;
        const detractors = scores.filter((s) => s <= 6).length;
        const total = scores.length;
        return {
          date,
          score: total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0,
        };
      });
  }, [filteredResponses]);

  const topTags = useMemo(() => {
    const map: Record<string, number> = {};
    filteredResponses.forEach((r) => r.tags.forEach((t) => { map[t] = (map[t] || 0) + 1; }));
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [filteredResponses]);

  const positive = filteredResponses.filter((r) => r.sentiment === "positive").length;
  const neutral = filteredResponses.filter((r) => r.sentiment === "neutral").length;
  const negative = filteredResponses.filter((r) => r.sentiment === "negative").length;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Pressable
            onPress={() => router.replace("/(tabs)/settings" as any)}
            style={({ pressed }) => [styles.exportBtn, pressed && { opacity: 0.8 }]}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color="#fff" />
            <Text style={styles.exportBtnText}>Export</Text>
          </Pressable>
        </View>

        {/* Survey Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.selectorScroll, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          contentContainerStyle={styles.selectorContent}
        >
          <Pressable
            onPress={() => setSelectedSurveyId("all")}
            style={({ pressed }) => [
              styles.selectorChip,
              {
                backgroundColor: selectedSurveyId === "all" ? colors.primary : colors.background,
                borderColor: selectedSurveyId === "all" ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={[styles.selectorText, { color: selectedSurveyId === "all" ? "#fff" : colors.muted }]}>
              All Surveys
            </Text>
          </Pressable>
          {surveys.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => setSelectedSurveyId(s.id)}
              style={({ pressed }) => [
                styles.selectorChip,
                {
                  backgroundColor: selectedSurveyId === s.id ? colors.primary : colors.background,
                  borderColor: selectedSurveyId === s.id ? colors.primary : colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text
                style={[styles.selectorText, { color: selectedSurveyId === s.id ? "#fff" : colors.muted }]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.content}>
          {/* KPI Row */}
          <View style={styles.kpiRow}>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiValue, { color: npsScore >= 30 ? colors.success : npsScore >= 0 ? colors.warning : colors.error }]}>
                {filteredResponses.length > 0 ? npsScore : "—"}
              </Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>NPS Score</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiValue, { color: colors.primary }]}>{filteredResponses.length}</Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Responses</Text>
            </View>
            <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.kpiValue, { color: colors.success }]}>
                {filteredResponses.length > 0 ? Math.round((positive / filteredResponses.length) * 100) : 0}%
              </Text>
              <Text style={[styles.kpiLabel, { color: colors.muted }]}>Positive</Text>
            </View>
          </View>

          {/* NPS Breakdown */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>NPS Breakdown</Text>
            <View style={styles.npsBreakdown}>
              {[
                { label: "Promoters", count: filteredResponses.filter((r) => (r.npsScore ?? 0) >= 9).length, color: colors.success, desc: "Score 9-10" },
                { label: "Passives", count: filteredResponses.filter((r) => (r.npsScore ?? 0) >= 7 && (r.npsScore ?? 0) <= 8).length, color: colors.warning, desc: "Score 7-8" },
                { label: "Detractors", count: filteredResponses.filter((r) => (r.npsScore ?? 0) <= 6 && r.npsScore !== undefined).length, color: colors.error, desc: "Score 0-6" },
              ].map((item) => (
                <View key={item.label} style={[styles.npsBreakdownCard, { backgroundColor: item.color + "10", borderColor: item.color + "30" }]}>
                  <Text style={[styles.npsBreakdownCount, { color: item.color }]}>{item.count}</Text>
                  <Text style={[styles.npsBreakdownLabel, { color: colors.foreground }]}>{item.label}</Text>
                  <Text style={[styles.npsBreakdownDesc, { color: colors.muted }]}>{item.desc}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sentiment Breakdown */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Sentiment Analysis</Text>
            <SentimentDonut
              positive={positive}
              neutral={neutral}
              negative={negative}
              total={filteredResponses.length}
            />
          </View>

          {/* NPS Trend */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>NPS Trend (Last 7 Days)</Text>
            <NPSTrendChart trend={npsTrend} />
          </View>

          {/* Response by Channel */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Responses by Channel</Text>
            <BarChart
              data={channelValues}
              maxValue={maxChannel}
              color={colors.primary}
              labels={channelLabels}
            />
          </View>

          {/* Top Tags */}
          {topTags.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>Top Tags</Text>
              <View style={styles.tagCloud}>
                {topTags.map(([tag, count]) => (
                  <View
                    key={tag}
                    style={[styles.tagItem, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}
                  >
                    <Text style={[styles.tagName, { color: colors.primary }]}>{tag}</Text>
                    <View style={[styles.tagCount, { backgroundColor: colors.primary }]}>
                      <Text style={styles.tagCountText}>{count}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
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
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  selectorScroll: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectorContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: "row",
  },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 160,
  },
  selectorText: {
    fontSize: 13,
    fontWeight: "500",
  },
  content: {
    padding: 14,
    gap: 12,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 4,
  },
  kpiValue: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  kpiLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 14,
  },
  npsBreakdown: {
    flexDirection: "row",
    gap: 8,
  },
  npsBreakdownCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    gap: 2,
  },
  npsBreakdownCount: {
    fontSize: 24,
    fontWeight: "800",
  },
  npsBreakdownLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  npsBreakdownDesc: {
    fontSize: 10,
  },
  donutContainer: {
    gap: 12,
  },
  donutBar: {
    height: 20,
    borderRadius: 10,
    flexDirection: "row",
    overflow: "hidden",
  },
  donutSegment: {
    height: "100%",
  },
  donutLegend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  donutEmpty: {
    alignItems: "center",
    paddingVertical: 20,
  },
  donutEmptyText: {
    fontSize: 14,
  },
  trendChart: {
    height: 100,
    position: "relative",
  },
  trendLine: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 80,
    position: "relative",
  },
  trendPoint: {
    position: "absolute",
    alignItems: "center",
    gap: 2,
  },
  trendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  trendScore: {
    fontSize: 10,
    fontWeight: "700",
  },
  trendLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 4,
  },
  trendLabel: {
    fontSize: 10,
  },
  emptyChart: {
    alignItems: "center",
    paddingVertical: 20,
  },
  emptyChartText: {
    fontSize: 13,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 120,
  },
  barItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  barValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  barWrapper: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    textAlign: "center",
  },
  tagCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagName: {
    fontSize: 13,
    fontWeight: "500",
  },
  tagCount: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tagCountText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
