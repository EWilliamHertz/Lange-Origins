import React, { useEffect, useState } from 'react';
import { Sparkles, Zap, Shield, Flame } from 'lucide-react';

export interface ActiveCast {
  id: string;
  name: string;
  totalDurationMs: number;
  startTime: number;
  icon?: string;
  color?: string;
}

interface CastBarProps {
  cast: ActiveCast | null;
  onCastComplete?: () => void;
}

export const CastBarIndicator: React.FC<CastBarProps> = ({ cast, onCastComplete }) => {
  const [progress, setProgress] = useState(0);
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!cast) {
      setProgress(0);
      setRemainingSec(0);
      return;
    }

    const interval = setInterval(() => {
      const elapsed = Date.now() - cast.startTime;
      const pct = Math.min(100, Math.max(0, (elapsed / cast.totalDurationMs) * 100));
      const rem = Math.max(0, ((cast.totalDurationMs - elapsed) / 1000));
      setProgress(pct);
      setRemainingSec(rem);

      if (elapsed >= cast.totalDurationMs) {
        clearInterval(interval);
        onCastComplete?.();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [cast, onCastComplete]);

  if (!cast || progress >= 100) return null;

  return (
    <div className="pointer-events-none fixed bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 w-72 animate-in fade-in zoom-in-95 duration-150">
      <div className="w-full flex items-center justify-between text-xs font-bold px-1 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
        <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-amber-300">
          <Sparkles size={13} className="text-amber-400 animate-spin" />
          {cast.name}
        </span>
        <span className="font-mono text-[11px] text-neutral-300">
          {remainingSec.toFixed(1)}s
        </span>
      </div>

      {/* Fantasy Themed Cast Bar Container */}
      <div className="w-full h-4 bg-neutral-950/90 rounded-full p-0.5 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)] overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-75 ease-linear bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  );
};
