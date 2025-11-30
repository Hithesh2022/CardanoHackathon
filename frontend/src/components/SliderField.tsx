"use client";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

export function SliderField({ label, value, onChange }: Props) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-slate-400">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-1 cursor-pointer appearance-none rounded-full bg-slate-600 accent-cyan-300"
      />
    </label>
  );
}
