import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SentimentBadge } from "@/components/ui/sentiment-badge";
import { useColors } from "@/hooks/use-colors";
import { useResponseStore } from "@/lib/store";
import type { SurveyResponse, SentimentType } from "@/lib/types";

const SENTIMENT_FILTERS: { value: SentimentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "positive", label: "😊 Positive" },
  { value: "neutral", label: "😐 Neutral" },
  { value: "negative", label: "😞 Negative" },
];

const CHANNEL_LABELS: Record<string, string> = {
  qr: "QR",
  link: "Link",
  in_app: "In-App",
  email: "Email",
};

export default function ResponsesScreen() {
  const router = useRouter();
  const colors = useColors();
  const { responses } = useResponseStore();

  const [search, setSearch] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<SentimentType | "all">("all");

  const filtered = useMemo(() => {
    return responses.filter((r) => {
      const matchSentiment = sentimentFilter === "all" || r.sentiment === sentimentFilter;
      const matchSearch =
        search === "" ||
        r.surveyTitle.toLowerCase().includes(search.toLowerCase()) ||
        r.answers.some((a) => String(a.value).toLowerCase().includes(search.toLowerCase())) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
      return matchSentiment && matchSearch;
    });
  }, [responses, search, sentimentFilter]);

  const renderItem = ({ item }: { item: SurveyResponse }) => {
    const preview = item.answers.find((a) => a.questionType === "text")?.value;
    const date = new Date(item.submittedAt).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
    });

    return (
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/response/${item.id}`);
        }}
        style={({ pressed }) => [
          styles.responseCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 },
        ]}
      >
        <View style={styles.cardTop}>
          <SentimentBadge sentiment={item.sentiment} size="sm" />
          <View style={styles.cardMeta}>
            <Text style={[styles.cardChannel, { color: colors.muted }]}>
              {CHANNEL_LABELS[item.channel] ?? item.channel}
            </Text>
            <Text style={[styles.cardDate, { color: colors.muted }]}>{date}</Text>
          </View>
        </View>
        <Text style={[styles.cardSurvey, { color: colors.muted }]} numberOfLines={1}>
          {item.surveyTitle}
        </Text>
        {preview ? (
          <Text style={[styles.cardPreview, { color: colors.foreground }]} numberOfLines={2}>
            "{String(preview)}"
          </Text>
        ) : null}
        {item.npsScore !== undefined && (
          <View style={[styles.npsChip, { backgroundColor: colors.primary + "15" }]}>
            <Text style={[styles.npsChipText, { color: colors.primary }]}>NPS: {item.npsScore}</Text>
          </View>
        )}
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.tagMore, { color: colors.muted }]}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <ScreenContainer>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}
        >
          <IconSymbol name="chevron.left" size={22} color={colors.primary} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>All Responses</Text>
        <Text style={[styles.headerCount, { color: colors.muted }]}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <IconSymbol name="magnifyingglass" size={16} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search responses..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.foreground }]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <IconSymbol name="xmark.circle.fill" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sentiment Filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {SENTIMENT_FILTERS.map((f) => (
          <Pressable
            key={f.value}
            onPress={() => setSentimentFilter(f.value)}
            style={({ pressed }) => [
              styles.filterChip,
              {
                backgroundColor: sentimentFilter === f.value ? colors.primary : colors.background,
                borderColor: sentimentFilter === f.value ? colors.primary : colors.border,
              },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: sentimentFilter === f.value ? "#fff" : colors.muted },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>No responses found</Text>
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
  headerCount: {
    fontSize: 14,
    fontWeight: "500",
    minWidth: 36,
    textAlign: "right",
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  list: {
    padding: 12,
    paddingBottom: 24,
  },
  responseCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  cardChannel: {
    fontSize: 11,
    fontWeight: "500",
  },
  cardDate: {
    fontSize: 12,
  },
  cardSurvey: {
    fontSize: 12,
  },
  cardPreview: {
    fontSize: 13,
    lineHeight: 18,
    fontStyle: "italic",
  },
  npsChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  npsChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  tagRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
  },
  tagMore: {
    fontSize: 11,
    alignSelf: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 14,
  },
});
