import type { Survey, SurveyResponse } from "./types";
import { analyzeSentimentFromAnswers } from "./analytics";

// ── Seed Surveys ─────────────────────────────────────────────
export const SEED_SURVEYS: Survey[] = [
  {
    id: "survey-001",
    title: "ความพึงพอใจในบริการ",
    description: "แบบสอบถามเพื่อวัดความพึงพอใจของลูกค้าต่อบริการของเรา",
    status: "active",
    channels: ["qr", "link", "in_app"],
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z",
    responseCount: 48,
    shareLink: "https://feedbackiq.app/s/survey-001",
    questions: [
      {
        id: "q1",
        type: "nps",
        text: "คุณมีแนวโน้มจะแนะนำบริการของเราให้ผู้อื่นมากน้อยเพียงใด?",
        required: true,
        minLabel: "ไม่แนะนำเลย",
        maxLabel: "แนะนำอย่างยิ่ง",
      },
      {
        id: "q2",
        type: "rating",
        text: "คุณให้คะแนนความพึงพอใจโดยรวมเท่าไร?",
        required: true,
        minLabel: "แย่มาก",
        maxLabel: "ดีมาก",
      },
      {
        id: "q3",
        type: "multiple_choice",
        text: "ด้านใดที่คุณพึงพอใจมากที่สุด?",
        required: false,
        options: ["ความรวดเร็ว", "ความสุภาพ", "ความรู้ความสามารถ", "ราคา", "คุณภาพ"],
      },
      {
        id: "q4",
        type: "text",
        text: "มีข้อเสนอแนะหรือความคิดเห็นเพิ่มเติมไหม?",
        required: false,
      },
    ],
  },
  {
    id: "survey-002",
    title: "ประสบการณ์การใช้งานแอป",
    description: "ช่วยเราปรับปรุงแอปด้วยความคิดเห็นของคุณ",
    status: "active",
    channels: ["link", "in_app"],
    createdAt: "2026-03-10T10:00:00.000Z",
    updatedAt: "2026-03-10T10:00:00.000Z",
    responseCount: 23,
    shareLink: "https://feedbackiq.app/s/survey-002",
    questions: [
      {
        id: "q1",
        type: "rating",
        text: "ให้คะแนนความง่ายในการใช้งานแอป",
        required: true,
      },
      {
        id: "q2",
        type: "yes_no",
        text: "คุณพบปัญหาในการใช้งานหรือไม่?",
        required: true,
      },
      {
        id: "q3",
        type: "text",
        text: "อธิบายปัญหาที่พบ (ถ้ามี)",
        required: false,
      },
      {
        id: "q4",
        type: "nps",
        text: "คุณจะแนะนำแอปนี้ให้เพื่อนหรือไม่?",
        required: true,
        minLabel: "ไม่แนะนำ",
        maxLabel: "แนะนำแน่นอน",
      },
    ],
  },
  {
    id: "survey-003",
    title: "คุณภาพสินค้า Q1/2026",
    description: "แบบสอบถามประจำไตรมาสเกี่ยวกับคุณภาพสินค้า",
    status: "closed",
    channels: ["email", "qr"],
    createdAt: "2026-01-05T09:00:00.000Z",
    updatedAt: "2026-03-31T23:59:00.000Z",
    closedAt: "2026-03-31T23:59:00.000Z",
    responseCount: 112,
    shareLink: "https://feedbackiq.app/s/survey-003",
    questions: [
      {
        id: "q1",
        type: "rating",
        text: "ให้คะแนนคุณภาพสินค้าโดยรวม",
        required: true,
      },
      {
        id: "q2",
        type: "multiple_choice",
        text: "สินค้าใดที่คุณซื้อ?",
        required: true,
        options: ["สินค้า A", "สินค้า B", "สินค้า C", "อื่นๆ"],
      },
      {
        id: "q3",
        type: "text",
        text: "ความคิดเห็นเกี่ยวกับคุณภาพสินค้า",
        required: false,
      },
    ],
  },
  {
    id: "survey-004",
    title: "แบบสอบถามทดสอบ",
    description: "ร่างแบบสอบถามที่ยังไม่ได้เผยแพร่",
    status: "draft",
    channels: ["link"],
    createdAt: "2026-03-20T14:00:00.000Z",
    updatedAt: "2026-03-20T14:00:00.000Z",
    responseCount: 0,
    shareLink: "https://feedbackiq.app/s/survey-004",
    questions: [
      {
        id: "q1",
        type: "text",
        text: "คำถามทดสอบ",
        required: true,
      },
    ],
  },
];

// ── Seed Responses ────────────────────────────────────────────
function makeResponse(
  id: string,
  surveyId: string,
  surveyTitle: string,
  npsScore: number,
  ratingScore: number,
  textFeedback: string,
  tags: string[],
  channel: "qr" | "link" | "in_app" | "email",
  daysAgo: number
): SurveyResponse {
  const date = new Date(Date.now() - daysAgo * 86400000).toISOString();
  const answers = [
    { questionId: "q1", questionText: "NPS", questionType: "nps" as const, value: npsScore },
    { questionId: "q2", questionText: "Rating", questionType: "rating" as const, value: ratingScore },
    { questionId: "q4", questionText: "Comment", questionType: "text" as const, value: textFeedback },
  ];
  const { sentiment, score } = analyzeSentimentFromAnswers(answers);
  return {
    id,
    surveyId,
    surveyTitle,
    answers,
    sentiment,
    sentimentScore: score,
    npsScore,
    tags,
    notes: "",
    channel,
    submittedAt: date,
  };
}

export const SEED_RESPONSES: SurveyResponse[] = [
  makeResponse("r001", "survey-001", "ความพึงพอใจในบริการ", 9, 5, "บริการดีมาก พนักงานสุภาพและใส่ใจลูกค้า ประทับใจมาก", ["บริการดี", "พนักงาน"], "in_app", 1),
  makeResponse("r002", "survey-001", "ความพึงพอใจในบริการ", 10, 5, "ยอดเยี่ยมมาก จะแนะนำให้เพื่อนทุกคน", ["แนะนำ", "ยอดเยี่ยม"], "qr", 2),
  makeResponse("r003", "survey-001", "ความพึงพอใจในบริการ", 7, 4, "โดยรวมดี แต่รอนานไปหน่อย", ["รอนาน"], "link", 3),
  makeResponse("r004", "survey-001", "ความพึงพอใจในบริการ", 3, 2, "บริการแย่มาก ไม่พอใจเลย ผิดหวังมาก", ["ปรับปรุง", "ไม่พอใจ"], "in_app", 4),
  makeResponse("r005", "survey-001", "ความพึงพอใจในบริการ", 8, 4, "ดีครับ แต่ยังมีจุดที่ปรับปรุงได้", ["ปรับปรุง"], "qr", 5),
  makeResponse("r006", "survey-001", "ความพึงพอใจในบริการ", 9, 5, "excellent service, very happy with the experience", ["excellent", "happy"], "link", 6),
  makeResponse("r007", "survey-001", "ความพึงพอใจในบริการ", 2, 1, "terrible experience, very disappointed", ["ปรับปรุง", "disappointed"], "in_app", 7),
  makeResponse("r008", "survey-001", "ความพึงพอใจในบริการ", 10, 5, "สุดยอดมากๆ ดีที่สุดที่เคยใช้", ["สุดยอด", "แนะนำ"], "qr", 8),
  makeResponse("r009", "survey-001", "ความพึงพอใจในบริการ", 6, 3, "พอใช้ได้ ไม่มีอะไรพิเศษ", [], "link", 9),
  makeResponse("r010", "survey-001", "ความพึงพอใจในบริการ", 9, 5, "great service, would recommend to everyone", ["แนะนำ", "great"], "in_app", 10),
  makeResponse("r011", "survey-002", "ประสบการณ์การใช้งานแอป", 8, 4, "แอปใช้งานง่าย ชอบมาก", ["ใช้งานง่าย"], "in_app", 2),
  makeResponse("r012", "survey-002", "ประสบการณ์การใช้งานแอป", 5, 3, "มีบัคบางส่วน ควรปรับปรุง", ["บัค", "ปรับปรุง"], "link", 4),
  makeResponse("r013", "survey-002", "ประสบการณ์การใช้งานแอป", 9, 5, "amazing app, love it!", ["love", "amazing"], "in_app", 6),
  makeResponse("r014", "survey-002", "ประสบการณ์การใช้งานแอป", 7, 4, "ดีครับ แต่อยากให้มีฟีเจอร์เพิ่มเติม", [], "link", 8),
  makeResponse("r015", "survey-002", "ประสบการณ์การใช้งานแอป", 10, 5, "ดีมากๆ ใช้งานสะดวก ประทับใจ", ["ประทับใจ", "สะดวก"], "in_app", 10),
];
