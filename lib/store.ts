import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Survey, SurveyResponse, SurveyStatus, DistributionChannel } from "./types";
import { SEED_SURVEYS, SEED_RESPONSES } from "./seed-data";
import { analyzeSentimentFromAnswers } from "./analytics";

// ── Survey Store ─────────────────────────────────────────────
interface SurveyStore {
  surveys: Survey[];
  addSurvey: (survey: Omit<Survey, "id" | "createdAt" | "updatedAt" | "responseCount" | "shareLink">) => Survey;
  updateSurvey: (id: string, updates: Partial<Survey>) => void;
  deleteSurvey: (id: string) => void;
  setSurveyStatus: (id: string, status: SurveyStatus) => void;
  getSurveyById: (id: string) => Survey | undefined;
  initialized: boolean;
  initializeWithSeedData: () => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set, get) => ({
      surveys: [],
      initialized: false,

      initializeWithSeedData: () => {
        if (!get().initialized) {
          set({ surveys: SEED_SURVEYS, initialized: true });
        }
      },

      addSurvey: (data) => {
        const now = new Date().toISOString();
        const id = `survey-${Date.now()}`;
        const survey: Survey = {
          ...data,
          id,
          createdAt: now,
          updatedAt: now,
          responseCount: 0,
          shareLink: `https://feedbackiq.app/s/${id}`,
        };
        set((state) => ({ surveys: [survey, ...state.surveys] }));
        return survey;
      },

      updateSurvey: (id, updates) => {
        set((state) => ({
          surveys: state.surveys.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },

      deleteSurvey: (id) => {
        set((state) => ({ surveys: state.surveys.filter((s) => s.id !== id) }));
      },

      setSurveyStatus: (id, status) => {
        set((state) => ({
          surveys: state.surveys.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status,
                  updatedAt: new Date().toISOString(),
                  closedAt: status === "closed" ? new Date().toISOString() : s.closedAt,
                }
              : s
          ),
        }));
      },

      getSurveyById: (id) => get().surveys.find((s) => s.id === id),
    }),
    {
      name: "feedbackiq-surveys",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ── Response Store ────────────────────────────────────────────
interface ResponseStore {
  responses: SurveyResponse[];
  initialized: boolean;
  initializeWithSeedData: () => void;
  addResponse: (
    surveyId: string,
    surveyTitle: string,
    answers: SurveyResponse["answers"],
    channel: DistributionChannel
  ) => SurveyResponse;
  updateResponseTags: (id: string, tags: string[]) => void;
  updateResponseNotes: (id: string, notes: string) => void;
  deleteResponse: (id: string) => void;
  getResponsesBySurvey: (surveyId: string) => SurveyResponse[];
  getAllTags: () => string[];
}

export const useResponseStore = create<ResponseStore>()(
  persist(
    (set, get) => ({
      responses: [],
      initialized: false,

      initializeWithSeedData: () => {
        if (!get().initialized) {
          set({ responses: SEED_RESPONSES, initialized: true });
        }
      },

      addResponse: (surveyId, surveyTitle, answers, channel) => {
        const { sentiment, score } = analyzeSentimentFromAnswers(answers);
        const npsAnswer = answers.find((a) => a.questionType === "nps");
        const npsScore = npsAnswer ? Number(npsAnswer.value) : undefined;

        const response: SurveyResponse = {
          id: `r${Date.now()}`,
          surveyId,
          surveyTitle,
          answers,
          sentiment,
          sentimentScore: score,
          npsScore,
          tags: [],
          notes: "",
          channel,
          submittedAt: new Date().toISOString(),
        };

        set((state) => ({ responses: [response, ...state.responses] }));

        // Update survey response count
        useSurveyStore.getState().updateSurvey(surveyId, {
          responseCount: get().responses.filter((r) => r.surveyId === surveyId).length,
        });

        return response;
      },

      updateResponseTags: (id, tags) => {
        set((state) => ({
          responses: state.responses.map((r) => (r.id === id ? { ...r, tags } : r)),
        }));
      },

      updateResponseNotes: (id, notes) => {
        set((state) => ({
          responses: state.responses.map((r) => (r.id === id ? { ...r, notes } : r)),
        }));
      },

      deleteResponse: (id) => {
        set((state) => ({ responses: state.responses.filter((r) => r.id !== id) }));
      },

      getResponsesBySurvey: (surveyId: string) =>
        get().responses.filter((r: SurveyResponse) => r.surveyId === surveyId),

      getAllTags: () => {
        const tagSet = new Set<string>();
        get().responses.forEach((r: SurveyResponse) => r.tags.forEach((t: string) => tagSet.add(t)));
        return Array.from(tagSet).sort();
      },
    }),
    {
      name: "feedbackiq-responses",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
