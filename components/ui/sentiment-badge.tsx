import { View, Text } from "react-native";
import { useColors } from "@/hooks/use-colors";
import type { SentimentType } from "@/lib/types";

interface SentimentBadgeProps {
  sentiment: SentimentType;
  size?: "sm" | "md";
}

const SENTIMENT_CONFIG = {
  positive: { emoji: "😊", label: "Positive" },
  neutral: { emoji: "😐", label: "Neutral" },
  negative: { emoji: "😞", label: "Negative" },
};

export function SentimentBadge({ sentiment, size = "md" }: SentimentBadgeProps) {
  const colors = useColors();
  const config = SENTIMENT_CONFIG[sentiment];

  const bgColor =
    sentiment === "positive"
      ? colors.success + "20"
      : sentiment === "negative"
      ? colors.error + "20"
      : colors.warning + "20";

  const textColor =
    sentiment === "positive"
      ? colors.success
      : sentiment === "negative"
      ? colors.error
      : colors.warning;

  const paddingH = size === "sm" ? 6 : 10;
  const paddingV = size === "sm" ? 2 : 4;
  const fontSize = size === "sm" ? 11 : 12;
  const emojiSize = size === "sm" ? 12 : 14;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: bgColor,
        paddingHorizontal: paddingH,
        paddingVertical: paddingV,
        borderRadius: 20,
      }}
    >
      <Text style={{ fontSize: emojiSize }}>{config.emoji}</Text>
      <Text style={{ fontSize, fontWeight: "600", color: textColor }}>{config.label}</Text>
    </View>
  );
}
