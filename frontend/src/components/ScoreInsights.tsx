"use client";

import type { ScoreResponse } from "@/lib/api";

export function ScoreInsights({ result }: { result?: ScoreResponse }) {
  if (!result) {
    return (
      <div className="rounded-3xl border border-white/10 bg-slate-900/30 p-6 text-sm text-slate-400">
        Share proofs to unlock your Midnight-backed score.
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/30 p-6 text-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Rationale</p>
        <ul className="mt-3 space-y-2 text-slate-200">
          {result.rationale.map((line) => (
            <li key={line} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-slate-300">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cardano Script Lock</p>
        <p className="font-mono text-xs text-white">{result.midnightProof.proofId}</p>
        {result.midnightProof.txHash && (
          <p className="font-mono text-xs text-cyan-300">Tx: {result.midnightProof.txHash.slice(0, 20)}...</p>
        )}
        <p className="mt-2 text-xs text-slate-400">Bucket: {result.midnightProof.publicState.scoreBucket}</p>
        <p className="text-xs text-slate-500">Expires {new Date(result.midnightProof.expiresAt).toLocaleString()}</p>
      </div>
    </div>
  );
}
