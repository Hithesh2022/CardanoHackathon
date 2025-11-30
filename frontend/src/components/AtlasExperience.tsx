"use client";

import { ScoreForm } from "./ScoreForm";
import { ScoreOrb } from "./ScoreOrb";
import { ScoreInsights } from "./ScoreInsights";
import { MemeBillboard } from "./MemeBillboard";
import { AgentStatusCard } from "./AgentStatusCard";
import { useScoreSession } from "@/hooks/useScoreSession";

export function AtlasExperience() {
  const { result, status, sessionId } = useScoreSession();
  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-800/80 p-6 backdrop-blur-lg">
        <h2 className="mb-4 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          🌐 AtlasCred: Decentralized Credit Scoring
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/30 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-blue-300">
              <span>👤</span> Credit Seekers (You)
            </h3>
            <p className="text-xs text-slate-400">
              Build credit using alternative data. Own your score. Control who sees what. No traditional credit history needed.
            </p>
          </div>
          <div className="rounded-lg border border-purple-500/20 bg-purple-950/30 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-purple-300">
              <span>🏦</span> Lenders
            </h3>
            <p className="text-xs text-slate-400">
              Verify creditworthiness on-chain. Request bucket proofs without invading privacy. Reduce default risk.
            </p>
          </div>
          <div className="rounded-lg border border-green-500/20 bg-green-950/30 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-300">
              <span>🤖</span> AI Agents
            </h3>
            <p className="text-xs text-slate-400">
              Masumi AI applies fairness algorithms to combat bias. Boosts underrepresented groups. Explainable scoring.
            </p>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-slate-900/60 p-3 text-xs text-slate-400">
          <strong className="text-cyan-400">How It Works:</strong> You submit proofs → AI scores with fairness → Score locked on Cardano → Lenders verify bucket → You control disclosure
        </div>
      </div>
      <MemeBillboard />
      <div className="grid gap-6 lg:grid-cols-[1fr,0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 backdrop-blur">
          <ScoreForm />
        </div>
        <ScoreOrb status={status} score={result} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ScoreInsights result={result} />
        <AgentStatusCard status={status} sessionId={sessionId} />
      </div>
    </div>
  );
}
