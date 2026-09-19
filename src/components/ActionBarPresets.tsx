import React from 'react';
import { Swords, Pickaxe, Compass } from 'lucide-react';
import { Sounds } from '../lib/audio';

export interface LoadoutPreset {
  id: number;
  name: string;
  icon: React.ReactNode;
  shortcut: string;
}

export const PRESETS: LoadoutPreset[] = [
  { id: 1, name: 'Combat', icon: <Swords size={12} className="text-rose-400" />, shortcut: 'Shift+1' },
  { id: 2, name: 'Mining', icon: <Pickaxe size={12} className="text-amber-400" />, shortcut: 'Shift+2' },
  { id: 3, name: 'Explore', icon: <Compass size={12} className="text-cyan-400" />, shortcut: 'Shift+3' }
];

interface ActionBarPresetsProps {
  activePreset: number;
  onSelectPreset: (presetId: number) => void;
}

export const ActionBarPresets: React.FC<ActionBarPresetsProps> = ({
  activePreset,
  onSelectPreset
}) => {
  return (
    <div
      id="action-bar-presets"
      className="flex items-center gap-1.5 bg-neutral-950/80 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10 shadow-lg select-none pointer-events-auto"
    >
      <span className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase mr-1 hidden sm:inline">
        Preset:
      </span>
      {PRESETS.map((preset) => {
        const isActive = activePreset === preset.id;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              Sounds.slotClick();
              onSelectPreset(preset.id);
            }}
            title={`${preset.name} Loadout (${preset.shortcut})`}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
              isActive
                ? 'bg-amber-500 text-neutral-950 shadow-[0_0_10px_rgba(245,158,11,0.5)] ring-1 ring-amber-300'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
            }`}
          >
            {preset.icon}
            <span>{preset.name}</span>
            <span className={`text-[9px] font-mono opacity-60 hidden md:inline ml-0.5`}>
              [{preset.id}]
            </span>
          </button>
        );
      })}
    </div>
  );
};
