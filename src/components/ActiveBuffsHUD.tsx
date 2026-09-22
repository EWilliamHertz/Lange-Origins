import React from 'react';
import { Heart, Zap, Wind, Shield, Utensils } from 'lucide-react';

export interface ActiveBuff {
  id: string;
  name: string;
  description: string;
  icon: 'heart' | 'zap' | 'wind' | 'shield' | 'utensils';
  color: string;
  startTime: number;
  durationSeconds: number;
  maxHpBonus?: number;
  manaRegenMultiplier?: number;
  speedMultiplier?: number;
  defenseBonus?: number;
}

interface ActiveBuffsHUDProps {
  buffs: ActiveBuff[];
}

export const ActiveBuffsHUD: React.FC<ActiveBuffsHUDProps> = ({ buffs }) => {
  if (!buffs || buffs.length === 0) return null;

  const now = Date.now();

  return (
    <div
      id="active-buffs-hud"
      className="flex items-center gap-2 pointer-events-auto select-none"
    >
      {buffs.map((buff) => {
        const elapsed = (now - buff.startTime) / 1000;
        const remaining = Math.max(0, Math.ceil(buff.durationSeconds - elapsed));
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        return (
          <div
            key={buff.id}
            className={`group relative flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-neutral-950/80 backdrop-blur-md shadow-lg transition-all duration-200 hover:scale-105 ${buff.color}`}
            title={`${buff.name}: ${buff.description}`}
          >
            {buff.icon === 'heart' && <Heart size={13} className="text-rose-400 animate-pulse" />}
            {buff.icon === 'zap' && <Zap size={13} className="text-purple-400 animate-pulse" />}
            {buff.icon === 'wind' && <Wind size={13} className="text-emerald-400" />}
            {buff.icon === 'shield' && <Shield size={13} className="text-amber-400" />}
            {buff.icon === 'utensils' && <Utensils size={13} className="text-orange-400" />}

            <span className="text-[11px] font-bold text-white tracking-wide">
              {buff.name}
            </span>

            <span className="text-[10px] font-mono font-semibold text-neutral-300 bg-neutral-900/80 px-1.5 py-0.5 rounded-full border border-neutral-700/50">
              {timeStr}
            </span>

            {/* Hover Tooltip Card */}
            <div className="absolute top-full left-0 mt-1.5 hidden group-hover:flex flex-col gap-1 p-2 rounded-xl bg-neutral-950/95 border border-neutral-700/80 shadow-2xl z-50 min-w-[180px] pointer-events-none">
              <span className="text-xs font-bold text-white">{buff.name}</span>
              <span className="text-[10px] text-neutral-300 leading-tight">{buff.description}</span>
              <span className="text-[9px] text-amber-400 font-mono mt-0.5">Expires in {timeStr}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
export default ActiveBuffsHUD;
