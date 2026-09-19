import React, { useState } from 'react';
import { Eye, EyeOff, RotateCw, Check, RotateCcw, LayoutTemplate, Layers, Sliders, ChevronDown, ChevronUp } from 'lucide-react';
import { HUDLayoutState } from '../lib/hudLayout';
import { Sounds } from '../lib/audio';

interface HUDEditOverlayProps {
  isActive: boolean;
  layout: HUDLayoutState;
  onClose: () => void;
  onReset: () => void;
  onToggleVisibility: (elementKey: keyof HUDLayoutState) => void;
  onRotateBar?: (barKey: 'hotbar' | 'leftActionBar' | 'rightActionBar') => void;
}

export const HUDEditOverlay: React.FC<HUDEditOverlayProps> = ({
  isActive,
  layout,
  onClose,
  onReset,
  onToggleVisibility,
  onRotateBar
}) => {
  const [showToggles, setShowToggles] = useState(true);

  if (!isActive) return null;

  const elementsList: { key: keyof HUDLayoutState; label: string; isRotatable?: boolean; rotatableKey?: 'hotbar' | 'leftActionBar' | 'rightActionBar' }[] = [
    { key: 'hotbar', label: 'Main Hotbar', isRotatable: true, rotatableKey: 'hotbar' },
    { key: 'leftActionBar', label: 'Left Action Bar', isRotatable: true, rotatableKey: 'leftActionBar' },
    { key: 'rightActionBar', label: 'Right Action Bar', isRotatable: true, rotatableKey: 'rightActionBar' },
    { key: 'radar', label: 'Square Minimap' },
    { key: 'questTracker', label: 'Quest Tracker' },
    { key: 'partyOverlay', label: 'Party Frames' },
    { key: 'buffTray', label: 'Buff & Debuff Tray' }
  ];

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] pointer-events-auto select-none flex flex-col items-center gap-2 max-w-2xl w-full px-4 animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Top Banner Control Bar */}
      <div className="w-full bg-neutral-950/95 backdrop-blur-xl border border-amber-500/50 rounded-2xl p-2.5 px-4 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
            <LayoutTemplate size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              HUD Customizer Active
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                EDIT MODE
              </span>
            </span>
            <span className="text-[11px] text-neutral-400">
              Drag elements across screen • Click 90° to rotate • Toggle eye to remove/show
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              Sounds.slotClick();
              setShowToggles(prev => !prev);
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5"
            title="Toggle Element Visibility Tray"
          >
            <Layers size={13} className="text-amber-400" />
            <span className="hidden sm:inline">Elements</span>
            {showToggles ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          <button
            onClick={() => {
              Sounds.slotClick();
              onReset();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 active:scale-95"
            title="Reset all HUD elements to default positions"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              Sounds.slotClick();
              onClose();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] active:scale-95"
          >
            <Check size={14} />
            <span>Save & Exit</span>
          </button>
        </div>
      </div>

      {/* Floating Element Visibility Drawer */}
      {showToggles && (
        <div className="w-full bg-neutral-950/90 backdrop-blur-xl border border-neutral-800/90 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider text-[10px] w-full border-b border-neutral-800 pb-1.5 mb-1">
            <Sliders size={12} className="text-amber-400" />
            <span>Show / Remove HUD Elements:</span>
            <span className="text-[10px] text-neutral-500 font-normal lowercase ml-auto">
              (Hidden elements disappear from HUD)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 w-full">
            {elementsList.map(item => {
              const elementConf = layout[item.key] || { visible: true };
              const isVisible = elementConf.visible !== false;

              return (
                <div
                  key={item.key}
                  className={`flex flex-col gap-1 p-1.5 rounded-lg border transition-all ${
                    isVisible
                      ? 'bg-neutral-900/90 border-neutral-700/80 text-white'
                      : 'bg-rose-950/20 border-rose-900/40 text-neutral-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold truncate" title={item.label}>
                      {item.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        Sounds.slotClick();
                        onToggleVisibility(item.key);
                      }}
                      className={`p-1 rounded transition-colors ${
                        isVisible
                          ? 'text-emerald-400 hover:bg-emerald-500/20'
                          : 'text-rose-400 hover:bg-rose-500/20'
                      }`}
                      title={isVisible ? `Remove/Hide ${item.label}` : `Restore ${item.label}`}
                    >
                      {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[9px]">
                    <span className={`font-semibold ${isVisible ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isVisible ? 'Visible' : 'Hidden'}
                    </span>
                    {item.isRotatable && item.rotatableKey && isVisible && onRotateBar && (
                      <button
                        type="button"
                        onClick={() => {
                          Sounds.slotClick();
                          onRotateBar(item.rotatableKey!);
                        }}
                        className="px-1 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 flex items-center gap-0.5 font-mono"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw size={9} />
                        {(elementConf.rotation || 0)}°
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
