import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore, useResponseStore } from "@/lib/store";
import { calculateNPS } from "@/lib/analytics";

const CHANNEL_LABELS: Record<string, string> = {
  qr: "QR Code",
  link: "Share Link",
  in_app: "In-App",
  email: "Email",
};

const STATUS_CONFIG = {
  active: { color: "#10B981", bg: "#10B98120", label: "Active" },
  draft: { color: "#64748B", bg: "#64748B20", label: "Draft" },
  closed: { color: "#94A3B8", bg: "#94A3B820", label: "Closed" },
};

export default function SurveyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { surveys, setSurveyStatus, deleteSurvey } = useSurveyStore();
  const { responses } = useResponseStore();

  const survey = useMemo(() => surveys.find((s) => s.id === id), [surveys, id]);
  const surveyResponses = useMemo(
    () => responses.filter((r) => r.surveyId === id),
    [responses, id]
  );

  if (!survey) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>Survey not found</Text>
      </ScreenContainer>
    );
  }

  const status = STATUS_CONFIG[survey.status];
  const npsScore = calculateNPS(surveyResponses);
  const avgRating = useMemo(() => {
    const ratings = surveyResponses.flatMap((r) =>
      r.answers.filter((a) => a.questionType === "rating").map((a) => Number(a.value))
    );
    if (ratings.length === 0) return null;
    return (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1);
  }, [surveyResponses]);

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(survey.shareLink);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied!", "Survey link copied to clipboard");
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${survey.title}\n\nTake our survey: ${survey.shareLink}`,
        url: survey.shareLink,
      });
    } catch {}
  };

  const handleToggleStatus = () => {
    if (survey.status === "active") {
      Alert.alert("Close Survey", "Stop collecting responses?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Close",
          style: "destructive",
          onPress: () => {
            setSurveyStatus(id!, "closed");
            if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]);
    } else if (survey.status === "draft" || survey.status === "closed") {
      setSurveyStatus(id!, "active");
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Survey", "This will permanently delete the survey and all responses.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteSurvey(id!);
          router.back();
        },
      },
    ]);
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="chevron.left" size={22} color={colors.primary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            Survey Detail
          </Text>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
          >
            <IconSymbol name="trash" size={20} color={colors.error} />
          </Pressable>
        </View>

        <View style={styles.content}>
          {/* Survey Info */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
              <Pressable
                onPress={handleToggleStatus}
                style={({ pressed }) => [
                  styles.toggleBtn,
                  {
                    backgroundColor: survey.status === "active" ? colors.error + "15" : colors.success + "15",
                  },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    { color: survey.status === "active" ? colors.error : colors.success },
                  ]}
                >
                  {survey.status === "active" ? "Close Survey" : "Activate"}
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.surveyTitle, { color: colors.foreground }]}>{survey.title}</Text>
            {survey.description ? (
              <Text style={[styles.surveyDesc, { color: colors.muted }]}>{survey.description}</Text>
            ) : null}
            <Text style={[styles.surveyDate, { color: colors.muted }]}>
              Created {new Date(survey.createdAt).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{surveyResponses.length}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Responses</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: npsScore >= 30 ? colors.success : npsScore >= 0 ? colors.warning : colors.error }]}>
                {surveyResponses.length > 0 ? npsScore : "—"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>NPS Score</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {avgRating ?? "—"}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Avg Rating</Text>
            </View>
          </View>

          {/* Share Options */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Share Survey</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.linkBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <IconSymbol name="link" size={14} color={colors.muted} />
              <Text style={[styles.linkText, { color: colors.muted }]} numberOfLines={1}>
                {survey.shareLink}
              </Text>
            </View>
            <View style={styles.shareButtons}>
              <Pressable
                onPress={handleCopyLink}
                style={({ pressed }) => [
                  styles.shareBtn,
                  { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name="doc.on.doc" size={16} color={colors.primary} />
                <Text style={[styles.shareBtnText, { color: colors.primary }]}>Copy Link</Text>
              </Pressable>
              <Pressable
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.shareBtn,
                  { backgroundColor: colors.success + "15", borderColor: colors.success + "30" },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name="square.and.arrow.up" size={16} color={colors.success} />
                <Text style={[styles.shareBtnText, { color: colors.success }]}>Share</Text>
              </Pressable>
            </View>
          </View>

          {/* Distribution Channels */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Channels</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {survey.channels.map((ch) => (
              <View key={ch} style={[styles.channelRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.channelLabel, { color: colors.foreground }]}>
                  {CHANNEL_LABELS[ch] ?? ch}
                </Text>
                <View style={[styles.channelActive, { backgroundColor: colors.success + "20" }]}>
                  <Text style={[styles.channelActiveText, { color: colors.success }]}>Active</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Questions */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Questions ({survey.questions.length})
          </Text>
          {survey.questions.map((q, i) => (
            <View
              key={q.id}
              style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.questionNum, { color: colors.muted }]}>Q{i + 1} · {q.type.toUpperCase()}</Text>
              <Text style={[styles.questionText, { color: colors.foreground }]}>{q.text}</Text>
              {q.options && (
                <View style={styles.optionsList}>
                  {q.options.map((opt, j) => (
                    <Text key={j} style={[styles.optionItem, { color: colors.muted }]}>• {opt}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}

          {/* View Responses Button */}
          {surveyResponses.length > 0 && (
            <Pressable
              onPress={() => router.push("/responses")}
              style={({ pressed }) => [
                styles.viewResponsesBtn,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <IconSymbol name="bubble.left.fill" size={18} color="#fff" />
              <Text style={styles.viewResponsesBtnText}>
                View {surveyResponses.length} Responses
              </Text>
            </Pressable>
          )}

          {/* Fill Survey (Preview) */}
          <Pressable
            onPress={() => router.push(`/survey/${id}/fill`)}
            style={({ pressed }) => [
              styles.previewBtn,
              { borderColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
          >
            <IconSymbol name="eye" size={18} color={colors.primary} />
            <Text style={[styles.previewBtnText, { color: colors.primary }]}>Preview Survey</Text>
          </Pressable>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  surveyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
    lineHeight: 26,
  },
  surveyDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  surveyDate: {
    fontSize: 12,
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
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  linkBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
  },
  shareButtons: {
    flexDirection: "row",
    gap: 8,
  },
  shareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  channelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelLabel: {
    fontSize: 14,
  },
  channelActive: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  channelActiveText: {
    fontSize: 11,
    fontWeight: "600",
  },
  questionCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  questionNum: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  questionText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  optionsList: {
    marginTop: 4,
    gap: 2,
  },
  optionItem: {
    fontSize: 13,
    lineHeight: 18,
  },
  viewResponsesBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  viewResponsesBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  previewBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
