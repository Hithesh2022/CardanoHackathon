"use client";

import { create } from "zustand";
import { nanoid } from "nanoid";
import type { Aggregates, ScorePayload, ScoreResponse } from "@/lib/api";
import { openSessionStream, requestScore } from "@/lib/api";

const defaultAggregates: Aggregates = {
  incomeStability: 0.6,
  repaymentConsistency: 0.7,
  savingsRate: 0.4,
  communityTrust: 0.5,
};

type Store = {
  sessionId: string;
  status: "idle" | "streaming" | "scored" | "error";
  aggregates: Aggregates;
  result?: ScoreResponse;
  error?: string;
  setAggregate: (key: keyof Aggregates, value: number) => void;
  submit: (payload: Omit<ScorePayload, "sessionId" | "aggregates">) => Promise<void>;
  reset: () => void;
};

export const useScoreSession = create<Store>((set, get) => ({
  sessionId: nanoid(12),
  status: "idle",
  aggregates: defaultAggregates,
  setAggregate: (key, value) => {
    set((state) => ({ aggregates: { ...state.aggregates, [key]: value } }));
  },
  submit: async (payload) => {
    const { sessionId, aggregates } = get();
    set({ status: "streaming", error: undefined });

    const close = openSessionStream(sessionId, (result) => {
      set({ result, status: "scored" });
      close();
    });

    try {
      const immediate = await requestScore({ ...payload, sessionId, aggregates });
      // Fallback: if stream doesn't arrive, use immediate response
      set({ result: immediate, status: "scored" });
      close();
    } catch (error) {
      set({ status: "error", error: (error as Error).message });
      close();
    }
  },
  reset: () => {
    set({
      sessionId: nanoid(12),
      status: "idle",
      result: undefined,
      error: undefined,
      aggregates: defaultAggregates,
    });
  },
}));
