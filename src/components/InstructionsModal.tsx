import React, { useState, useEffect } from 'react';
import { ArrowRight, X, Compass, Swords, Backpack, Sparkles, HelpCircle, Shield } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(() => {
    return localStorage.getItem('hasSeenInstructions') === 'true';
  });

  const handleEnterGame = () => {
    if (dontShowAgain) {
      localStorage.setItem('hasSeenInstructions', 'true');
    } else {
      localStorage.removeItem('hasSeenInstructions');
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        handleEnterGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-hidden select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleEnterGame();
        }
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="instructions-title"
        className="w-full max-w-2xl max-h-[90vh] bg-gradient-to-b from-[#18181c] via-[#121215] to-[#0d0d10] rounded-3xl border border-amber-500/30 shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Modal Header (Fixed, non-scrolling) */}
        <div className="shrink-0 px-6 py-4 sm:py-5 border-b border-white/10 bg-black/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Compass size={22} />
            </div>
            <div>
              <h2 id="instructions-title" className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                Controls & Game Guide
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Lange: Origins
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Master movement, mining, combat, and shortcuts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEnterGame}
              aria-label="Close instructions"
              className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable if height is constrained) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Movement & Combat */}
            <div className="bg-black/50 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 pb-1 border-b border-white/5">
                <Swords size={16} /> Movement & Combat
              </div>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-amber-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    WASD
                  </kbd>
                  <span className="text-neutral-300">Move & Jump</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-amber-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    SHIFT
                  </kbd>
                  <span className="text-neutral-300">Hold to Sprint (uses Stamina)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-amber-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    L-CLICK
                  </kbd>
                  <span className="text-neutral-300">Mine blocks / Attack monsters</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-amber-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    R-CLICK
                  </kbd>
                  <span className="text-neutral-300">Place blocks / Open chests & tables</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-amber-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    S
                  </kbd>
                  <span className="text-neutral-300">Drop down wooden platforms</span>
                </li>
              </ul>
            </div>

            {/* Menus & Inventory */}
            <div className="bg-black/50 p-4 sm:p-5 rounded-2xl border border-white/5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 pb-1 border-b border-white/5">
                <Backpack size={16} /> Menus & Shortcuts
              </div>
              <ul className="space-y-2.5 text-xs">
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-blue-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    TAB / E
                  </kbd>
                  <span className="text-neutral-300">Unified Menu (Bag, Talents, Quests)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-blue-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    1 - 9
                  </kbd>
                  <span className="text-neutral-300">Select Hotbar & Cast Assigned Skills</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-blue-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    Q
                  </kbd>
                  <span className="text-neutral-300">Drop selected item from inventory</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-blue-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    J / L
                  </kbd>
                  <span className="text-neutral-300">Quest Journal & Tracker</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <kbd className="min-w-[54px] text-center px-2 py-1 rounded-md bg-neutral-800 text-blue-300 font-mono font-bold border border-white/10 text-[11px] shadow-sm">
                    H / ?
                  </kbd>
                  <span className="text-neutral-300">Reopen this Controls Guide</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Quick Survival Tips Banner */}
          <div className="bg-gradient-to-r from-amber-950/30 via-neutral-900/60 to-neutral-900/40 p-4 rounded-2xl border border-amber-500/20 flex items-start gap-3 text-xs">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-amber-200">Adventurer's Tip</div>
              <p className="text-neutral-300 leading-relaxed">
                Chop trees for wood to craft a Workbench. Place it down and right-click it to craft pickaxes, torches, and weapons. Night brings hostile skeletons and zombies—fortify your shelter before dark!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer (Sticky, guaranteed visible on every screen resolution) */}
        <div className="shrink-0 p-4 sm:p-5 bg-neutral-950/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2.5 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer accent-amber-500"
            />
            <span>Don't show this guide on startup</span>
          </label>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-[11px] text-neutral-500 font-mono hidden md:inline">
              Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700">Space</kbd>
            </span>
            <button
              id="enter-game-instructions-btn"
              onClick={handleEnterGame}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] active:scale-95 flex items-center justify-center gap-2"
            >
              Enter Game
              <ArrowRight size={18} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
