export function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export const scorePalette = [
  { stop: 300, color: "#f87171" },
  { stop: 500, color: "#fb923c" },
  { stop: 650, color: "#facc15" },
  { stop: 750, color: "#4ade80" },
  { stop: 850, color: "#34d399" },
];

export function scoreToColor(score: number) {
  const palette = [...scorePalette].sort((a, b) => a.stop - b.stop);
  return palette.reduce((acc, swatch) => (score >= swatch.stop ? swatch.color : acc), palette[0].color);
}
