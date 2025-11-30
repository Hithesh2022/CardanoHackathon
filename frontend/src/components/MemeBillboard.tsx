"use client";

import { useEffect, useState } from "react";

type Meme = {
  title: string;
  line: string;
};

export function MemeBillboard() {
  const [memes, setMemes] = useState<Meme[]>([]);

  useEffect(() => {
    // Memes feature removed - AtlasCred is now a professional fintech platform
    setMemes([]);
  }, []);

  if (!memes.length) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-purple-900/40 to-indigo-900/40 p-4">
      <div className="animate-marquee flex gap-6 whitespace-nowrap text-sm font-semibold text-white">
        {memes.map((meme) => (
          <span key={meme.title}>
            {meme.title}: <span className="text-cyan-200">{meme.line}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
