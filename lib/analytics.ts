import type {
  Answer,
  SentimentType,
  SurveyResponse,
  SurveyAnalytics,
  NPSTrend,
  SentimentSummary,
  ChannelStats,
  TagStat,
} from "./types";

// ── Sentiment Analysis (keyword-based) ─────────────────────
const POSITIVE_KEYWORDS = [
  "ดี", "ยอดเยี่ยม", "ชอบ", "พอใจ", "ประทับใจ", "สุดยอด", "เยี่ยม", "ดีมาก",
  "good", "great", "excellent", "amazing", "love", "happy", "satisfied",
  "wonderful", "fantastic", "perfect", "awesome", "best", "helpful",
  "recommend", "outstanding", "superb",
];

const NEGATIVE_KEYWORDS = [
  "แย่", "ไม่ดี", "ผิดหวัง", "ไม่พอใจ", "เสียใจ", "แย่มาก", "ห่วย",
  "bad", "terrible", "awful", "horrible", "disappointed", "poor", "worst",
  "useless", "broken", "slow", "frustrating", "annoying", "unhappy",
  "not good", "not helpful",
];

export function analyzeSentiment(text: string): { sentiment: SentimentType; score: number } {
  const lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  POSITIVE_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) positiveCount++;
  });
  NEGATIVE_KEYWORDS.forEach((kw) => {
    if (lower.includes(kw)) negativeCount++;
  });

  if (positiveCount === 0 && negativeCount === 0) {
    return { sentiment: "neutral", score: 0 };
  }

  const total = positiveCount + negativeCount;
  const score = (positiveCount - negativeCount) / total;

  if (score > 0.2) return { sentiment: "positive", score };
  if (score < -0.2) return { sentiment: "negative", score };
  return { sentiment: "neutral", score };
}

export function analyzeSentimentFromAnswers(answers: Answer[]): {
  sentiment: SentimentType;
  score: number;
} {
  const textAnswers = answers.filter(
    (a) => a.questionType === "text" && typeof a.value === "string"
  );

  if (textAnswers.length === 0) {
    // Derive from rating/nps if no text
    const ratingAnswer = answers.find(
      (a) => a.questionType === "rating" || a.questionType === "nps"
    );
    if (ratingAnswer) {
      const val = Number(ratingAnswer.value);
      const max = ratingAnswer.questionType === "nps" ? 10 : 5;
      const normalized = val / max;
      if (normalized >= 0.7) return { sentiment: "positive", score: normalized - 0.5 };
      if (normalized <= 0.4) return { sentiment: "negative", score: normalized - 0.5 };
      return { sentiment: "neutral", score: 0 };
    }
    return { sentiment: "neutral", score: 0 };
  }

  const combined = textAnswers.map((a) => String(a.value)).join(" ");
  return analyzeSentiment(combined);
}

// ── NPS Calculation ─────────────────────────────────────────
export function getNPSCategory(score: number): "promoter" | "passive" | "detractor" {
  if (score >= 9) return "promoter";
  if (score >= 7) return "passive";
  return "detractor";
}

export function calculateNPS(responses: SurveyResponse[]): number {
  const npsResponses = responses.filter((r) => r.npsScore !== undefined);
  if (npsResponses.length === 0) return 0;

  const promoters = npsResponses.filter((r) => (r.npsScore ?? 0) >= 9).length;
  const detractors = npsResponses.filter((r) => (r.npsScore ?? 0) <= 6).length;
  const total = npsResponses.length;

  return Math.round(((promoters - detractors) / total) * 100);
}

// ── Analytics Aggregation ───────────────────────────────────
export function computeAnalytics(
  surveyId: string,
  responses: SurveyResponse[]
): SurveyAnalytics {
  const surveyResponses = responses.filter((r) => r.surveyId === surveyId);
  const total = surveyResponses.length;

  // Sentiment summary
  const sentimentSummary: SentimentSummary = { positive: 0, neutral: 0, negative: 0 };
  surveyResponses.forEach((r) => {
    sentimentSummary[r.sentiment]++;
  });

  // NPS
  const npsScore = calculateNPS(surveyResponses);
  const npsResponses = surveyResponses.filter((r) => r.npsScore !== undefined);
  const promoters = npsResponses.filter((r) => (r.npsScore ?? 0) >= 9).length;
  const passives = npsResponses.filter(
    (r) => (r.npsScore ?? 0) >= 7 && (r.npsScore ?? 0) <= 8
  ).length;
  const detractors = npsResponses.filter((r) => (r.npsScore ?? 0) <= 6).length;

  // Channel stats
  const channelMap: Record<string, number> = {};
  surveyResponses.forEach((r) => {
    channelMap[r.channel] = (channelMap[r.channel] || 0) + 1;
  });
  const channelStats: ChannelStats[] = Object.entries(channelMap).map(([ch, count]) => ({
    channel: ch as any,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
  }));

  // Tag stats
  const tagMap: Record<string, number> = {};
  surveyResponses.forEach((r) => {
    r.tags.forEach((tag) => {
      tagMap[tag] = (tagMap[tag] || 0) + 1;
    });
  });
  const tagStats: TagStat[] = Object.entries(tagMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // NPS trend (group by week)
  const trendMap: Record<string, { scores: number[]; promoters: number; passives: number; detractors: number }> = {};
  surveyResponses.forEach((r) => {
    const date = r.submittedAt.slice(0, 10); // YYYY-MM-DD
    if (!trendMap[date]) trendMap[date] = { scores: [], promoters: 0, passives: 0, detractors: 0 };
    if (r.npsScore !== undefined) {
      trendMap[date].scores.push(r.npsScore);
      const cat = getNPSCategory(r.npsScore);
      if (cat === "promoter") trendMap[date].promoters++;
      else if (cat === "passive") trendMap[date].passives++;
      else trendMap[date].detractors++;
    }
  });

  const npsTrend: NPSTrend[] = Object.entries(trendMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      const t = data.promoters + data.passives + data.detractors;
      const score = t > 0 ? Math.round(((data.promoters - data.detractors) / t) * 100) : 0;
      return { date, score, promoters: data.promoters, passives: data.passives, detractors: data.detractors };
    });

  // Avg rating
  const ratingAnswers = surveyResponses.flatMap((r) =>
    r.answers.filter((a) => a.questionType === "rating").map((a) => Number(a.value))
  );
  const avgRating =
    ratingAnswers.length > 0
      ? Math.round((ratingAnswers.reduce((s, v) => s + v, 0) / ratingAnswers.length) * 10) / 10
      : 0;

  return {
    surveyId,
    totalResponses: total,
    npsScore,
    sentimentSummary,
    npsBreakdown: { promoters, passives, detractors },
    channelStats,
    tagStats,
    npsTrend,
    avgRating,
    responseRate: total > 0 ? Math.min(100, Math.round((total / Math.max(total, 10)) * 100)) : 0,
  };
}

// ── Export Helpers ──────────────────────────────────────────
export function responsesToCSV(responses: SurveyResponse[]): string {
  if (responses.length === 0) return "";

  const headers = [
    "ID", "Survey", "Submitted At", "Channel", "Sentiment", "NPS Score", "Tags", "Notes",
  ];

  const rows = responses.map((r) => [
    r.id,
    r.surveyTitle,
    r.submittedAt,
    r.channel,
    r.sentiment,
    r.npsScore ?? "",
    r.tags.join("; "),
    r.notes,
  ]);

  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export function responsesToJSON(responses: SurveyResponse[]): string {
  return JSON.stringify(responses, null, 2);
}
