import { describe, it, expect } from "vitest";
import {
  analyzeSentiment,
  analyzeSentimentFromAnswers,
  calculateNPS,
  getNPSCategory,
  responsesToCSV,
  responsesToJSON,
} from "../lib/analytics";
import type { Answer, SurveyResponse } from "../lib/types";

// ── Sentiment Analysis Tests ─────────────────────────────────
describe("analyzeSentiment", () => {
  it("returns positive for positive keywords", () => {
    const result = analyzeSentiment("บริการดีมาก excellent service");
    expect(result.sentiment).toBe("positive");
    expect(result.score).toBeGreaterThan(0);
  });

  it("returns negative for negative keywords", () => {
    const result = analyzeSentiment("แย่มาก terrible experience");
    expect(result.sentiment).toBe("negative");
    expect(result.score).toBeLessThan(0);
  });

  it("returns neutral for no keywords", () => {
    const result = analyzeSentiment("ขอบคุณ");
    expect(result.sentiment).toBe("neutral");
    expect(result.score).toBe(0);
  });
});

describe("analyzeSentimentFromAnswers", () => {
  it("derives sentiment from text answer", () => {
    const answers: Answer[] = [
      { questionId: "q1", questionText: "How was it?", questionType: "text", value: "great service" },
    ];
    const result = analyzeSentimentFromAnswers(answers);
    expect(result.sentiment).toBe("positive");
  });

  it("derives sentiment from NPS when no text", () => {
    const answers: Answer[] = [
      { questionId: "q1", questionText: "NPS", questionType: "nps", value: 9 },
    ];
    const result = analyzeSentimentFromAnswers(answers);
    expect(result.sentiment).toBe("positive");
  });

  it("derives negative from low NPS", () => {
    const answers: Answer[] = [
      { questionId: "q1", questionText: "NPS", questionType: "nps", value: 2 },
    ];
    const result = analyzeSentimentFromAnswers(answers);
    expect(result.sentiment).toBe("negative");
  });

  it("returns neutral for empty answers", () => {
    const result = analyzeSentimentFromAnswers([]);
    expect(result.sentiment).toBe("neutral");
  });
});

// ── NPS Calculation Tests ────────────────────────────────────
describe("calculateNPS", () => {
  const makeResponse = (npsScore: number): SurveyResponse => ({
    id: `r${npsScore}`,
    surveyId: "s1",
    surveyTitle: "Test",
    answers: [],
    sentiment: "neutral",
    sentimentScore: 0,
    npsScore,
    tags: [],
    notes: "",
    channel: "link",
    submittedAt: new Date().toISOString(),
  });

  it("returns 0 for empty responses", () => {
    expect(calculateNPS([])).toBe(0);
  });

  it("calculates NPS correctly with all promoters", () => {
    const responses = [makeResponse(9), makeResponse(10), makeResponse(9)];
    expect(calculateNPS(responses)).toBe(100);
  });

  it("calculates NPS correctly with all detractors", () => {
    const responses = [makeResponse(3), makeResponse(5), makeResponse(6)];
    expect(calculateNPS(responses)).toBe(-100);
  });

  it("calculates mixed NPS correctly", () => {
    // 2 promoters (9,10), 1 passive (7), 1 detractor (4)
    const responses = [makeResponse(9), makeResponse(10), makeResponse(7), makeResponse(4)];
    // (2-1)/4 * 100 = 25
    expect(calculateNPS(responses)).toBe(25);
  });

  it("ignores responses without NPS score", () => {
    const withNPS = makeResponse(9);
    const withoutNPS: SurveyResponse = { ...makeResponse(0), npsScore: undefined };
    expect(calculateNPS([withNPS, withoutNPS])).toBe(100);
  });
});

describe("getNPSCategory", () => {
  it("classifies 9-10 as promoter", () => {
    expect(getNPSCategory(9)).toBe("promoter");
    expect(getNPSCategory(10)).toBe("promoter");
  });

  it("classifies 7-8 as passive", () => {
    expect(getNPSCategory(7)).toBe("passive");
    expect(getNPSCategory(8)).toBe("passive");
  });

  it("classifies 0-6 as detractor", () => {
    expect(getNPSCategory(0)).toBe("detractor");
    expect(getNPSCategory(6)).toBe("detractor");
  });
});

// ── Export Tests ─────────────────────────────────────────────
describe("responsesToCSV", () => {
  const sampleResponse: SurveyResponse = {
    id: "r1",
    surveyId: "s1",
    surveyTitle: "Customer Survey",
    answers: [],
    sentiment: "positive",
    sentimentScore: 0.5,
    npsScore: 9,
    tags: ["excellent", "helpful"],
    notes: "Great customer",
    channel: "qr",
    submittedAt: "2026-03-24T00:00:00.000Z",
  };

  it("returns empty string for empty array", () => {
    expect(responsesToCSV([])).toBe("");
  });

  it("includes header row", () => {
    const csv = responsesToCSV([sampleResponse]);
    expect(csv).toContain("ID");
    expect(csv).toContain("Survey");
    expect(csv).toContain("NPS Score");
  });

  it("includes response data", () => {
    const csv = responsesToCSV([sampleResponse]);
    expect(csv).toContain("r1");
    expect(csv).toContain("Customer Survey");
    expect(csv).toContain("positive");
    expect(csv).toContain("9");
  });

  it("joins tags with semicolon", () => {
    const csv = responsesToCSV([sampleResponse]);
    expect(csv).toContain("excellent; helpful");
  });
});

describe("responsesToJSON", () => {
  it("returns valid JSON", () => {
    const responses: SurveyResponse[] = [];
    const json = responsesToJSON(responses);
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json)).toEqual([]);
  });

  it("includes all response fields", () => {
    const response: SurveyResponse = {
      id: "r1",
      surveyId: "s1",
      surveyTitle: "Test",
      answers: [],
      sentiment: "neutral",
      sentimentScore: 0,
      npsScore: 7,
      tags: [],
      notes: "",
      channel: "link",
      submittedAt: "2026-03-24T00:00:00.000Z",
    };
    const json = JSON.parse(responsesToJSON([response]));
    expect(json[0].id).toBe("r1");
    expect(json[0].npsScore).toBe(7);
  });
});
