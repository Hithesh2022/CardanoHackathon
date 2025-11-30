"use client";

type Props = {
  sessionId: string;
  status: "idle" | "streaming" | "scored" | "error";
};

const statusCopy: Record<Props["status"], { title: string; sub: string }> = {
  idle: { title: "Awaiting proof", sub: "Connect wallet to begin" },
  streaming: { title: "Locking on-chain", sub: "Cardano script validator signing" },
  scored: { title: "Score locked", sub: "Datum committed to Cardano" },
  error: { title: "Something broke", sub: "Retry or switch network" }
};

export function AgentStatusCard({ sessionId, status }: Props) {
  const copy = statusCopy[status];
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
        <span>Masumi Agent</span>
        <span>{sessionId}</span>
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{copy.title}</p>
      <p className="text-slate-400">{copy.sub}</p>
    </div>
  );
}
