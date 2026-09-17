import React, { useState } from 'react';
import { Shield, Sword, Heart, Zap, Star } from 'lucide-react';

export const ModernHUD = ({ 
  health, 
  maxHealth, 
  mana, 
  maxMana, 
  level, 
  xp, 
  job,
  onSkillUse 
}: { 
  health: number, 
  maxHealth: number, 
  mana: number, 
  maxMana: number, 
  level: number, 
  xp: number, 
  job: string,
  onSkillUse: (skill: string) => void 
}) => {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  const getJobSkills = () => {
    switch(job.toLowerCase()) {
      case 'warrior': return [
        { id: 'whirlwind', name: 'Whirlwind', icon: '🌪️', cd: 5, key: 'Q' },
        { id: 'charge', name: 'Charge', icon: '⚡', cd: 8, key: 'E' },
        { id: 'shout', name: 'Battle Shout', icon: '🗣️', cd: 15, key: 'R' }
      ];
      case 'mage': return [
        { id: 'fireball', name: 'Fireball', icon: '🔥', cd: 2, key: 'Q' },
        { id: 'blink', name: 'Blink', icon: '✨', cd: 10, key: 'E' },
        { id: 'frostnova', name: 'Frost Nova', icon: '❄️', cd: 12, key: 'R' }
      ];
      case 'ranger': return [
        { id: 'multishot', name: 'Multi-Shot', icon: '🏹', cd: 4, key: 'Q' },
        { id: 'trap', name: 'Trap', icon: '🕸️', cd: 8, key: 'E' },
        { id: 'dash', name: 'Dash', icon: '💨', cd: 6, key: 'R' }
      ];
      default: return [];
    }
  };

  const skills = getJobSkills();

  return (
    <div className="pointer-events-none absolute inset-0 w-full h-full">
      {/* Top Left: Player Plate */}
      <div className="absolute top-4 left-4 flex items-center gap-4 bg-neutral-900/80 backdrop-blur-md p-3 rounded-xl border border-neutral-700 shadow-2xl pointer-events-auto">
        
        {/* Avatar Placeholder */}
        <div className="relative w-16 h-16 bg-neutral-800 rounded-full border-2 border-amber-500 flex items-center justify-center overflow-hidden">
          <div className="text-2xl">{job === 'warrior' ? '⚔️' : job === 'mage' ? '🔮' : job === 'ranger' ? '🏹' : '👤'}</div>
          <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full border-2 border-neutral-900">
            Lv.{level}
          </div>
        </div>

        {/* Vitals */}
        <div className="flex flex-col gap-2 w-48">
          <div className="flex justify-between items-end mb-[-4px]">
            <span className="text-white font-bold tracking-wider capitalize text-lg drop-shadow-md">{job}</span>
          </div>
          
          {/* Health Bar */}
          <div className="relative w-full h-4 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${(health/maxHealth)*100}%` }}></div>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {health} / {maxHealth}
            </span>
          </div>

          {/* Mana / Energy Bar */}
          <div className="relative w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
            <div className={`absolute top-0 left-0 h-full transition-all duration-300 ${job === 'warrior' ? 'bg-gradient-to-r from-orange-600 to-red-500' : job === 'ranger' ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' : 'bg-gradient-to-r from-blue-700 to-blue-400'}`} style={{ width: `${(mana/maxMana)*100}%` }}></div>
          </div>
          
          {/* XP Bar */}
          <div className="relative w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
            <div className="absolute top-0 left-0 h-full bg-purple-500 transition-all duration-300" style={{ width: `${(xp % (level * 100)) / (level * 100) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* Action Bars / Skills */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto">
        
        {/* Job Skills Container */}
        <div className="flex gap-2 p-2 bg-neutral-900/60 backdrop-blur-md border border-neutral-700/50 rounded-xl shadow-2xl">
          {skills.map((s, i) => (
            <button 
              key={s.id}
              className="relative w-14 h-14 bg-neutral-800 border-2 border-neutral-600 rounded-lg flex items-center justify-center hover:border-amber-400 transition-all active:scale-95 group overflow-hidden"
              onClick={() => onSkillUse(s.id)}
            >
              {/* Icon */}
              <span className="text-2xl drop-shadow-lg z-10 group-hover:scale-110 transition-transform">{s.icon}</span>
              
              {/* Keybind badge */}
              <div className="absolute top-0 left-0 bg-neutral-900 text-neutral-300 text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg border-b border-r border-neutral-600 z-20">
                {s.key}
              </div>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-0"></div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
