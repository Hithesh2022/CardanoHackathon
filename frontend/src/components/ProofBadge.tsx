"use client";

type Props = {
  label: string;
  active?: boolean;
};

export function ProofBadge({ label, active }: Props) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
        active ? "border-emerald-400/60 bg-emerald-400/20 text-emerald-100" : "border-slate-600 text-slate-400"
      }`}
    >
      {label}
    </span>
  );
}
