import React from 'react';
import { Flame, Shield, Zap, Sparkles, Heart, Skull, Snowflake, Apple, Eye } from 'lucide-react';

export interface ActiveEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  icon: 'food' | 'defense' | 'sprint' | 'flame' | 'vampiric' | 'burn' | 'poison' | 'frozen' | 'arcane';
  durationMs: number;
  remainingMs: number;
  description: string;
  stack?: number;
}

interface BuffDebuffTrayProps {
  effects: ActiveEffect[];
}

export const BuffDebuffTray: React.FC<BuffDebuffTrayProps> = ({ effects }) => {
  if (effects.length === 0) return null;

  const renderIcon = (icon: ActiveEffect['icon']) => {
    switch (icon) {
      case 'food':
        return <Apple size={13} className="text-amber-300" />;
      case 'defense':
        return <Shield size={13} className="text-sky-300" />;
      case 'sprint':
        return <Zap size={13} className="text-yellow-300" />;
      case 'flame':
        return <Flame size={13} className="text-orange-400" />;
      case 'vampiric':
        return <Heart size={13} className="text-purple-400" />;
      case 'burn':
        return <Flame size={13} className="text-rose-500 animate-pulse" />;
      case 'poison':
        return <Skull size={13} className="text-emerald-400 animate-pulse" />;
      case 'frozen':
        return <Snowflake size={13} className="text-cyan-300 animate-spin" />;
      case 'arcane':
      default:
        return <Sparkles size={13} className="text-indigo-300" />;
    }
  };

  return (
    <div className="flex items-center gap-1.5 pointer-events-auto select-none">
      {effects.map(effect => {
        const pct = Math.max(0, Math.min(100, (effect.remainingMs / effect.durationMs) * 100));
        const secondsLeft = Math.ceil(effect.remainingMs / 1000);
        const isDebuff = effect.type === 'debuff';

        return (
          <div
            key={effect.id}
            title={`${effect.name} (${secondsLeft}s): ${effect.description}`}
            className={`relative group rounded-lg p-1.5 flex items-center gap-1.5 border backdrop-blur-md shadow-md transition-all ${
              isDebuff
                ? 'bg-rose-950/80 border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                : 'bg-neutral-950/85 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
            }`}
          >
            {/* Circular countdown sweep */}
            <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isDebuff ? 'text-rose-500' : 'text-amber-400'}
                  strokeDasharray={`${pct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {renderIcon(effect.icon)}
              </div>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-bold font-mono text-white leading-none">
                {secondsLeft}s
              </span>
              {effect.stack && effect.stack > 1 && (
                <span className="text-[9px] font-bold text-amber-300 leading-none">
                  x{effect.stack}
                </span>
              )}
            </div>

            {/* Hover Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-44 p-2 bg-neutral-950/95 border border-white/20 rounded-lg shadow-xl text-left z-50 pointer-events-none">
              <span className={`text-[11px] font-bold ${isDebuff ? 'text-rose-400' : 'text-amber-300'}`}>
                {effect.name}
              </span>
              <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                {effect.description}
              </span>
              <span className="text-[9px] font-mono text-neutral-500 mt-1">
                {secondsLeft} seconds remaining
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
