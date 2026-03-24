import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Alert, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore } from "@/lib/store";
import type { Question, QuestionType, DistributionChannel } from "@/lib/types";

const QUESTION_TYPES: { type: QuestionType; label: string; icon: string; description: string }[] = [
  { type: "nps", label: "NPS", icon: "chart.line.uptrend.xyaxis", description: "0-10 scale" },
  { type: "rating", label: "Rating", icon: "star.fill", description: "1-5 stars" },
  { type: "multiple_choice", label: "Multiple Choice", icon: "checkmark.circle.fill", description: "Select options" },
  { type: "text", label: "Text", icon: "bubble.left.fill", description: "Open answer" },
  { type: "yes_no", label: "Yes / No", icon: "checkmark", description: "Binary choice" },
];

const CHANNELS: { id: DistributionChannel; label: string; icon: string }[] = [
  { id: "qr", label: "QR Code", icon: "qrcode" },
  { id: "link", label: "Share Link", icon: "link" },
  { id: "in_app", label: "In-App", icon: "eye" },
  { id: "email", label: "Email", icon: "paperplane.fill" },
];

function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: {
  question: Question;
  index: number;
  onUpdate: (q: Question) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={[styles.questionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [styles.questionHeader, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.questionIndex, { backgroundColor: colors.primary }]}>
          <Text style={styles.questionIndexText}>{index + 1}</Text>
        </View>
        <Text style={[styles.questionType, { color: colors.muted }]}>
          {QUESTION_TYPES.find((t) => t.type === question.type)?.label}
        </Text>
        <Text style={[styles.questionPreview, { color: colors.foreground }]} numberOfLines={1}>
          {question.text || "Untitled question"}
        </Text>
        <Pressable
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="trash" size={18} color={colors.error} />
        </Pressable>
      </Pressable>

      {expanded && (
        <View style={styles.questionBody}>
          <TextInput
            value={question.text}
            onChangeText={(t) => onUpdate({ ...question, text: t })}
            placeholder="Question text..."
            placeholderTextColor={colors.muted}
            style={[styles.questionInput, { color: colors.foreground, borderColor: colors.border }]}
            multiline
            returnKeyType="done"
          />
          {question.type === "multiple_choice" && (
            <View style={{ gap: 6, marginTop: 8 }}>
              <Text style={[styles.optionLabel, { color: colors.muted }]}>Options</Text>
              {(question.options ?? []).map((opt, i) => (
                <View key={i} style={styles.optionRow}>
                  <TextInput
                    value={opt}
                    onChangeText={(t) => {
                      const opts = [...(question.options ?? [])];
                      opts[i] = t;
                      onUpdate({ ...question, options: opts });
                    }}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor={colors.muted}
                    style={[styles.optionInput, { color: colors.foreground, borderColor: colors.border }]}
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => {
                      const opts = (question.options ?? []).filter((_, idx) => idx !== i);
                      onUpdate({ ...question, options: opts });
                    }}
                    style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                  >
                    <IconSymbol name="xmark" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
              <Pressable
                onPress={() =>
                  onUpdate({ ...question, options: [...(question.options ?? []), ""] })
                }
                style={({ pressed }) => [
                  styles.addOptionBtn,
                  { borderColor: colors.primary },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <IconSymbol name="plus" size={14} color={colors.primary} />
                <Text style={[styles.addOptionText, { color: colors.primary }]}>Add Option</Text>
              </Pressable>
            </View>
          )}
          <View style={styles.requiredRow}>
            <Text style={[styles.requiredLabel, { color: colors.muted }]}>Required</Text>
            <Switch
              value={question.required}
              onValueChange={(v) => onUpdate({ ...question, required: v })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>
      )}
    </View>
  );
}

export default function CreateSurveyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { addSurvey } = useSurveyStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([
    { id: "q1", type: "nps", text: "คุณมีแนวโน้มจะแนะนำเราให้ผู้อื่นมากน้อยเพียงใด?", required: true, minLabel: "ไม่แนะนำ", maxLabel: "แนะนำอย่างยิ่ง" },
  ]);
  const [channels, setChannels] = useState<DistributionChannel[]>(["link", "qr"]);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const addQuestion = (type: QuestionType) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const q: Question = {
      id: `q${Date.now()}`,
      type,
      text: "",
      required: false,
      options: type === "multiple_choice" ? ["Option 1", "Option 2"] : undefined,
    };
    setQuestions([...questions, q]);
    setShowTypeSelector(false);
  };

  const updateQuestion = (index: number, q: Question) => {
    const updated = [...questions];
    updated[index] = q;
    setQuestions(updated);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const toggleChannel = (ch: DistributionChannel) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handleSave = (status: "draft" | "active") => {
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a survey title");
      return;
    }
    if (questions.length === 0) {
      Alert.alert("Error", "Please add at least one question");
      return;
    }
    addSurvey({ title: title.trim(), description: description.trim(), status, questions, channels });
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="xmark" size={22} color={colors.muted} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Create Survey</Text>
        <Pressable
          onPress={() => handleSave("draft")}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.draftBtn, { color: colors.muted }]}>Draft</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Survey title *"
              placeholderTextColor={colors.muted}
              style={[styles.titleInput, { color: colors.foreground, borderBottomColor: colors.border }]}
              returnKeyType="next"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description (optional)"
              placeholderTextColor={colors.muted}
              style={[styles.descInput, { color: colors.foreground }]}
              multiline
              returnKeyType="done"
            />
          </View>

          {/* Questions */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Questions</Text>
          {questions.map((q, i) => (
            <QuestionEditor
              key={q.id}
              question={q}
              index={i}
              onUpdate={(updated) => updateQuestion(i, updated)}
              onDelete={() => deleteQuestion(i)}
            />
          ))}

          {/* Add Question */}
          {showTypeSelector ? (
            <View style={[styles.typeSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.typeSelectorTitle, { color: colors.foreground }]}>Select Question Type</Text>
              {QUESTION_TYPES.map((t) => (
                <Pressable
                  key={t.type}
                  onPress={() => addQuestion(t.type)}
                  style={({ pressed }) => [
                    styles.typeOption,
                    { borderBottomColor: colors.border },
                    pressed && { backgroundColor: colors.background },
                  ]}
                >
                  <IconSymbol name={t.icon as any} size={20} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.typeLabel, { color: colors.foreground }]}>{t.label}</Text>
                    <Text style={[styles.typeDesc, { color: colors.muted }]}>{t.description}</Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={colors.muted} />
                </Pressable>
              ))}
              <Pressable
                onPress={() => setShowTypeSelector(false)}
                style={({ pressed }) => [styles.cancelTypeBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.cancelTypeBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setShowTypeSelector(true)}
              style={({ pressed }) => [
                styles.addQuestionBtn,
                { borderColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <IconSymbol name="plus.circle.fill" size={20} color={colors.primary} />
              <Text style={[styles.addQuestionText, { color: colors.primary }]}>Add Question</Text>
            </Pressable>
          )}

          {/* Channels */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Distribution Channels</Text>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {CHANNELS.map((ch) => {
              const active = channels.includes(ch.id);
              return (
                <Pressable
                  key={ch.id}
                  onPress={() => toggleChannel(ch.id)}
                  style={({ pressed }) => [
                    styles.channelRow,
                    { borderBottomColor: colors.border },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View style={[styles.channelIcon, { backgroundColor: active ? colors.primary + "20" : colors.background }]}>
                    <IconSymbol name={ch.icon as any} size={18} color={active ? colors.primary : colors.muted} />
                  </View>
                  <Text style={[styles.channelLabel, { color: colors.foreground }]}>{ch.label}</Text>
                  <View
                    style={[
                      styles.channelCheck,
                      { backgroundColor: active ? colors.primary : colors.border },
                    ]}
                  >
                    {active && <IconSymbol name="checkmark" size={12} color="#fff" />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Publish */}
          <Pressable
            onPress={() => handleSave("active")}
            style={({ pressed }) => [
              styles.publishBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
            <Text style={styles.publishBtnText}>Publish Survey</Text>
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
  },
  draftBtn: {
    fontSize: 15,
    fontWeight: "500",
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
  titleInput: {
    fontSize: 18,
    fontWeight: "600",
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  descInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 60,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 4,
  },
  questionCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  questionIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  questionIndexText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  questionType: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    minWidth: 50,
  },
  questionPreview: {
    flex: 1,
    fontSize: 13,
  },
  deleteBtn: {
    padding: 4,
  },
  questionBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  questionInput: {
    fontSize: 14,
    lineHeight: 22,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  optionInput: {
    flex: 1,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    alignSelf: "flex-start",
  },
  addOptionText: {
    fontSize: 13,
    fontWeight: "500",
  },
  requiredRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  requiredLabel: {
    fontSize: 14,
  },
  addQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  addQuestionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  typeSelector: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  typeSelectorTitle: {
    fontSize: 14,
    fontWeight: "600",
    padding: 14,
    paddingBottom: 8,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  typeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  cancelTypeBtn: {
    padding: 14,
    alignItems: "center",
  },
  cancelTypeBtnText: {
    fontSize: 14,
  },
  channelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  channelLabel: {
    flex: 1,
    fontSize: 15,
  },
  channelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  publishBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
