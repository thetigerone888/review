// ============================================================
// FeedbackIQ — Core TypeScript Types
// ============================================================

export type QuestionType = "rating" | "nps" | "multiple_choice" | "text" | "yes_no";

export type SurveyStatus = "draft" | "active" | "closed";

export type SentimentType = "positive" | "neutral" | "negative";

export type DistributionChannel = "qr" | "link" | "in_app" | "email";

// ── Question ────────────────────────────────────────────────
export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  required: boolean;
  options?: string[]; // for multiple_choice
  minLabel?: string; // for nps/rating
  maxLabel?: string; // for nps/rating
}

// ── Survey ──────────────────────────────────────────────────
export interface Survey {
  id: string;
  title: string;
  description: string;
  status: SurveyStatus;
  questions: Question[];
  channels: DistributionChannel[];
  createdAt: string; // ISO date string
  updatedAt: string;
  closedAt?: string;
  responseCount: number;
  shareLink: string;
}

// ── Answer ──────────────────────────────────────────────────
export interface Answer {
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  value: string | number | boolean | string[];
}

// ── Response ─────────────────────────────────────────────────
export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyTitle: string;
  answers: Answer[];
  sentiment: SentimentType;
  sentimentScore: number; // -1.0 to 1.0
  npsScore?: number; // 0-10
  tags: string[];
  notes: string;
  channel: DistributionChannel;
  submittedAt: string; // ISO date string
}

// ── Analytics ────────────────────────────────────────────────
export interface NPSTrend {
  date: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ChannelStats {
  channel: DistributionChannel;
  count: number;
  percentage: number;
}

export interface TagStat {
  tag: string;
  count: number;
}

export interface SurveyAnalytics {
  surveyId: string;
  totalResponses: number;
  npsScore: number;
  sentimentSummary: SentimentSummary;
  npsBreakdown: { promoters: number; passives: number; detractors: number };
  channelStats: ChannelStats[];
  tagStats: TagStat[];
  npsTrend: NPSTrend[];
  avgRating: number;
  responseRate: number;
}
