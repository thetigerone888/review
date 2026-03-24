import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { useSurveyStore, useResponseStore } from "@/lib/store";
import type { Answer } from "@/lib/types";

// ── Star Rating Component ────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(star);
          }}
          style={({ pressed }) => [pressed && { opacity: 0.7 }]}
        >
          <Text style={[styles.star, { color: star <= value ? colors.warning : colors.border }]}>
            ★
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── NPS Slider Component ─────────────────────────────────────
function NPSSelector({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const colors = useColors();
  return (
    <View style={styles.npsContainer}>
      <View style={styles.npsGrid}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = value === i;
          const color = i >= 9 ? colors.success : i >= 7 ? colors.warning : colors.error;
          return (
            <Pressable
              key={i}
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChange(i);
              }}
              style={({ pressed }) => [
                styles.npsBtn,
                {
                  backgroundColor: selected ? color : color + "20",
                  borderColor: color,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.npsBtnText, { color: selected ? "#fff" : color }]}>{i}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.npsLabels}>
        <Text style={[styles.npsLabelText, { color: colors.muted }]}>Not likely</Text>
        <Text style={[styles.npsLabelText, { color: colors.muted }]}>Very likely</Text>
      </View>
    </View>
  );
}

export default function FillSurveyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();

  const { surveys } = useSurveyStore();
  const { addResponse } = useResponseStore();
  const survey = useMemo(() => surveys.find((s) => s.id === id), [surveys, id]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitted, setSubmitted] = useState(false);

  if (!survey) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted }}>Survey not found</Text>
      </ScreenContainer>
    );
  }

  const question = survey.questions[currentIndex];
  const progress = (currentIndex + 1) / survey.questions.length;
  const isLast = currentIndex === survey.questions.length - 1;
  const currentAnswer = answers[question.id];
  const canProceed = !question.required || currentAnswer !== undefined;

  const handleNext = () => {
    if (isLast) {
      handleSubmit();
    } else {
      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = () => {
    const builtAnswers: Answer[] = survey.questions.map((q) => ({
      questionId: q.id,
      questionText: q.text,
      questionType: q.type,
      value: answers[q.id] ?? (q.type === "yes_no" ? false : q.type === "multiple_choice" ? [] : ""),
    }));

    addResponse(survey.id, survey.title, builtAnswers, "in_app");
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <ScreenContainer>
        <View style={styles.thankYou}>
          <Text style={styles.thankYouEmoji}>🎉</Text>
          <Text style={[styles.thankYouTitle, { color: colors.foreground }]}>Thank You!</Text>
          <Text style={[styles.thankYouDesc, { color: colors.muted }]}>
            Your feedback has been submitted successfully.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {survey.title}
          </Text>
          <Text style={[styles.headerProgress, { color: colors.muted }]}>
            {currentIndex + 1} of {survey.questions.length}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` as any, backgroundColor: colors.primary },
          ]}
        />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.questionContainer}>
          {/* Question */}
          <Text style={[styles.questionLabel, { color: colors.muted }]}>
            Question {currentIndex + 1}
            {question.required && <Text style={{ color: colors.error }}> *</Text>}
          </Text>
          <Text style={[styles.questionText, { color: colors.foreground }]}>{question.text}</Text>

          {/* Answer Input */}
          {question.type === "rating" && (
            <StarRating
              value={currentAnswer ?? 0}
              onChange={(v) => setAnswers({ ...answers, [question.id]: v })}
            />
          )}

          {question.type === "nps" && (
            <NPSSelector
              value={currentAnswer ?? null}
              onChange={(v) => setAnswers({ ...answers, [question.id]: v })}
            />
          )}

          {question.type === "text" && (
            <TextInput
              value={currentAnswer ?? ""}
              onChangeText={(t) => setAnswers({ ...answers, [question.id]: t })}
              placeholder="Type your answer here..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={5}
              style={[
                styles.textInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
              textAlignVertical="top"
              returnKeyType="done"
            />
          )}

          {question.type === "yes_no" && (
            <View style={styles.yesNoRow}>
              {[
                { value: true, label: "Yes ✓", color: colors.success },
                { value: false, label: "No ✗", color: colors.error },
              ].map((opt) => (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAnswers({ ...answers, [question.id]: opt.value });
                  }}
                  style={({ pressed }) => [
                    styles.yesNoBtn,
                    {
                      backgroundColor:
                        currentAnswer === opt.value ? opt.color : opt.color + "15",
                      borderColor: opt.color,
                    },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Text
                    style={[
                      styles.yesNoBtnText,
                      { color: currentAnswer === opt.value ? "#fff" : opt.color },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {question.type === "multiple_choice" && (
            <View style={styles.optionsList}>
              {(question.options ?? []).map((opt) => {
                const selected = (currentAnswer ?? []).includes(opt);
                return (
                  <Pressable
                    key={opt}
                    onPress={() => {
                      if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const current: string[] = currentAnswer ?? [];
                      const updated = selected
                        ? current.filter((o: string) => o !== opt)
                        : [...current, opt];
                      setAnswers({ ...answers, [question.id]: updated });
                    }}
                    style={({ pressed }) => [
                      styles.optionBtn,
                      {
                        backgroundColor: selected ? colors.primary + "15" : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <View
                      style={[
                        styles.optionCheck,
                        {
                          backgroundColor: selected ? colors.primary : colors.background,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {selected && <IconSymbol name="checkmark" size={12} color="#fff" />}
                    </View>
                    <Text style={[styles.optionText, { color: colors.foreground }]}>{opt}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={[styles.navBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.navBackBtn,
            { borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <IconSymbol name="chevron.left" size={18} color={colors.muted} />
          <Text style={[styles.navBackText, { color: colors.muted }]}>Back</Text>
        </Pressable>
        <Pressable
          onPress={handleNext}
          disabled={!canProceed}
          style={({ pressed }) => [
            styles.navNextBtn,
            { backgroundColor: canProceed ? colors.primary : colors.border },
            pressed && canProceed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
          ]}
        >
          <Text style={[styles.navNextText, { color: canProceed ? "#fff" : colors.muted }]}>
            {isLast ? "Submit" : "Next"}
          </Text>
          {!isLast && <IconSymbol name="chevron.right" size={18} color={canProceed ? "#fff" : colors.muted} />}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  headerProgress: {
    fontSize: 12,
    marginTop: 2,
  },
  progressBar: {
    height: 3,
  },
  progressFill: {
    height: "100%",
  },
  questionContainer: {
    padding: 24,
    gap: 20,
    flex: 1,
  },
  questionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontWeight: "600",
  },
  questionText: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 28,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    paddingVertical: 16,
  },
  star: {
    fontSize: 48,
  },
  npsContainer: {
    gap: 12,
  },
  npsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  npsBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  npsBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  npsLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  npsLabelText: {
    fontSize: 12,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
  },
  yesNoRow: {
    flexDirection: "row",
    gap: 12,
  },
  yesNoBtn: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
  },
  yesNoBtnText: {
    fontSize: 18,
    fontWeight: "700",
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: {
    fontSize: 15,
    fontWeight: "500",
  },
  navBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  navBackText: {
    fontSize: 15,
    fontWeight: "500",
  },
  navNextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  navNextText: {
    fontSize: 16,
    fontWeight: "700",
  },
  thankYou: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  thankYouEmoji: {
    fontSize: 72,
  },
  thankYouTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  thankYouDesc: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  doneBtn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
