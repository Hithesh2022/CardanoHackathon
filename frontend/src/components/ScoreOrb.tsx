"use client";

import { motion } from "framer-motion";
import { scoreToColor } from "@/lib/utils";
import type { ScoreResponse } from "@/lib/api";

type Props = {
  score?: ScoreResponse;
  status: "idle" | "streaming" | "scored" | "error";
};

export function ScoreOrb({ score, status }: Props) {
  const displayScore = score?.adjustedScore ?? 0;
  const color = scoreToColor(displayScore);
  return (
    <div className="relative flex flex-col items-center justify-center gap-4 rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/60 to-slate-900/20 p-10 text-center shadow-2xl">
      <motion.div
        animate={{
          background: `radial-gradient(circle at 30% 20%, ${color}, rgba(15,23,42,0.1))`,
          scale: status === "streaming" ? 1.05 : 1,
          boxShadow: `0 0 40px ${color}55`
        }}
        transition={{ duration: 0.8, repeat: status === "streaming" ? Infinity : 0, repeatType: "reverse" }}
        className="flex h-48 w-48 items-center justify-center rounded-full border border-white/10"
      >
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Atlas Score</p>
          <p className="text-5xl font-black text-white">{Math.round(displayScore) || "--"}</p>
        </div>
      </motion.div>
      <p className="text-sm text-slate-400">Confidence {Math.round((score?.confidence ?? 0) * 100)}%</p>
    </div>
  );
}
