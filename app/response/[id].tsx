import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { useColors } from "@/hooks/use-colors";
import { useResponseStore } from "@/lib/store";

const AVAILABLE_TAGS = [
  "บริการดี", "ปรับปรุง", "แนะนำ", "ยอดเยี่ยม", "ไม่พอใจ",
  "รอนาน", "ราคาดี", "คุณภาพดี", "บัค", "ใช้งานง่าย",
  "excellent", "helpful", "disappointed", "great", "love",
];

const CHANNEL_LABELS: Record<string, string> = {
  qr: "QR Code",
  link: "Share Link",
  in_app: "In-App",
  email: "Email",
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  nps: "NPS (0-10)",
  rating: "Rating (1-5)",
  multiple_choice: "Multiple Choice",
  text: "Text",
  yes_no: "Yes / No",
};

export default function ResponseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { responses, updateResponseTags, updateResponseNotes } = useResponseStore();
  const response = useMemo(() => responses.find((r) => r.id === id), [responses, id]);

  const [notes, setNotes] = useState(response?.notes ?? "");
  const [notesSaved, setNotesSaved] = useState(true);

  if (!response) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>Response not found</Text>
      </ScreenContainer>
    );
  }

  const toggleTag = (tag: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const current = response.tags;
    const updated = current.includes(tag)
      ? current.filter((t) => t !== tag)
      : [...current, tag];
    updateResponseTags(id!, updated);
  };

  const saveNotes = () => {
    updateResponseNotes(id!, notes);
    setNotesSaved(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const renderAnswerValue = (value: any, type: string) => {
    if (type === "yes_no") return value ? "Yes ✓" : "No ✗";
    if (Array.isArray(value)) return value.join(", ");
    if (type === "nps") return `${value} / 10`;
    if (type === "rating") return `${"★".repeat(Number(value))}${"☆".repeat(5 - Number(value))}`;
    return String(value);
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
            Response Detail
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          {/* Meta Info */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.metaRow}>
              <SentimentBadge sentiment={response.sentiment} />
              {response.npsScore !== undefined && (
                <View style={[styles.npsBadge, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.npsBadgeText, { color: colors.primary }]}>
                    NPS: {response.npsScore}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.surveyTitle, { color: colors.foreground }]}>{response.surveyTitle}</Text>
            <View style={styles.metaDetails}>
              <View style={styles.metaItem}>
                <IconSymbol name="clock.fill" size={14} color={colors.muted} />
                <Text style={[styles.metaText, { color: colors.muted }]}>{formatDate(response.submittedAt)}</Text>
              </View>
              <View style={styles.metaItem}>
                <IconSymbol name="link" size={14} color={colors.muted} />
                <Text style={[styles.metaText, { color: colors.muted }]}>
                  {CHANNEL_LABELS[response.channel] ?? response.channel}
                </Text>
              </View>
            </View>
          </View>

          {/* Answers */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Answers</Text>
          {response.answers.map((answer, i) => (
            <View
              key={answer.questionId}
              style={[styles.answerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.answerQuestion, { color: colors.muted }]}>
                Q{i + 1} · {QUESTION_TYPE_LABELS[answer.questionType] ?? answer.questionType}
              </Text>
              <Text style={[styles.answerText, { color: colors.foreground }]}>{answer.questionText}</Text>
              <Text style={[styles.answerValue, { color: colors.primary }]}>
                {renderAnswerValue(answer.value, answer.questionType)}
              </Text>
            </View>
          ))}

          {/* Tags */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tags</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.tagCloud}>
              {AVAILABLE_TAGS.map((tag) => {
                const active = response.tags.includes(tag);
                return (
                  <Pressable
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={({ pressed }) => [
                      styles.tagChip,
                      {
                        backgroundColor: active ? colors.primary : colors.background,
                        borderColor: active ? colors.primary : colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tagChipText,
                        { color: active ? "#fff" : colors.muted },
                      ]}
                    >
                      {tag}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Internal Notes</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={(t) => { setNotes(t); setNotesSaved(false); }}
              placeholder="Add internal notes..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
              style={[styles.notesInput, { color: colors.foreground, borderColor: colors.border }]}
              returnKeyType="done"
            />
            {!notesSaved && (
              <Pressable
                onPress={saveNotes}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.saveBtnText}>Save Notes</Text>
              </Pressable>
            )}
          </View>
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
  content: {
    padding: 16,
    gap: 12,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  npsBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  npsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  surveyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  metaDetails: {
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  answerCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  answerQuestion: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  answerText: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  answerValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  tagCloud: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  notesInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
