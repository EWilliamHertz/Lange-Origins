import React, { useState, useRef, useEffect } from 'react';
import { Scroll, ChevronDown, ChevronUp, CheckCircle2, GripHorizontal, EyeOff, Eye } from 'lucide-react';
import { Sounds } from '../lib/audio';

export interface Quest {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  completed: boolean;
  rewardText: string;
  prerequisiteId?: string;
}

interface HUDQuestTrackerProps {
  quests: Quest[];
  onOpenMenu?: () => void;
  position?: { x?: number; y?: number; visible?: boolean };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  isEditMode?: boolean;
  visible?: boolean;
  onHide?: () => void;
}

export const HUDQuestTracker: React.FC<HUDQuestTrackerProps> = ({
  quests,
  onOpenMenu,
  position,
  onPositionChange,
  isEditMode = false,
  visible,
  onHide
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);

  const isTrackerVisible = visible ?? position?.visible ?? true;

  // Fallback / initial position if not specified (placed comfortably beneath Dynamic Radar)
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>({
    x: position?.x ?? 0,
    y: position?.y ?? 272
  });

  useEffect(() => {
    if (position?.x !== undefined && position?.y !== undefined) {
      setLocalPos({ x: position.x, y: position.y });
    }
  }, [position?.x, position?.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or when in edit mode
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const currentX = position?.x ?? (localPos.x > 0 ? localPos.x : Math.max(16, window.innerWidth - 276));
    const currentY = position?.y ?? (localPos.y > 0 ? localPos.y : 272);

    dragStartRef.current = {
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startPosX: currentX,
      startPosY: currentY
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const deltaX = e.clientX - dragStartRef.current.startMouseX;
    const deltaY = e.clientY - dragStartRef.current.startMouseY;

    const newX = Math.max(8, Math.min(window.innerWidth - 270, dragStartRef.current.startPosX + deltaX));
    const newY = Math.max(8, Math.min(window.innerHeight - 200, dragStartRef.current.startPosY + deltaY));

    setLocalPos({ x: newX, y: newY });
    onPositionChange?.({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Active quests are not yet completed and have prerequisites satisfied
  const activeQuests = quests.filter(q => {
    if (q.completed) return false;
    if (q.prerequisiteId) {
      const prereq = quests.find(p => p.id === q.prerequisiteId);
      if (prereq && !prereq.completed) return false;
    }
    return true;
  });

  if (activeQuests.length === 0 && !isEditMode) return null;

  const stylePosition: React.CSSProperties =
    position?.x !== undefined || localPos.x > 0
      ? { left: `${localPos.x}px`, top: `${localPos.y}px` }
      : { right: '16px', top: '272px' };

  if (!isTrackerVisible) {
    if (!isEditMode) return null;
    return (
      <div
        id="hud-quest-tracker-ghost"
        style={stylePosition}
        className="fixed z-30 p-2.5 rounded-xl border-2 border-dashed border-amber-500/50 bg-neutral-950/60 backdrop-blur-sm select-none pointer-events-auto shadow-lg"
      >
        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
          <EyeOff size={14} />
          <span>Quest Tracker (Hidden)</span>
          {onHide && (
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                onHide();
              }}
              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
            >
              Unhide
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      id="hud-quest-tracker"
      style={stylePosition}
      className={`fixed z-30 w-64 select-none pointer-events-auto transition-shadow duration-200 ${
        isEditMode ? 'ring-2 ring-amber-400 ring-dashed shadow-[0_0_25px_rgba(245,158,11,0.4)]' : ''
      }`}
    >
      <div className="bg-neutral-950/85 backdrop-blur-md rounded-xl border border-amber-500/30 shadow-2xl overflow-hidden text-white">
        {/* Header with Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-950/70 via-neutral-900/70 to-neutral-950/90 cursor-move hover:bg-neutral-900/90 transition-colors border-b border-amber-500/20 touch-none"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal size={14} className="text-amber-400/80" />
            <Scroll size={14} className="text-amber-400" />
            <span className="text-xs font-bold tracking-wide text-amber-200">
              Quest Tracker ({activeQuests.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {isEditMode && onHide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Sounds.slotClick();
                  onHide();
                }}
                className="text-neutral-400 hover:text-rose-400 p-1"
                title="Hide Quest Tracker"
              >
                <EyeOff size={13} />
              </button>
            )}
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setIsCollapsed(prev => !prev);
              }}
              className="text-neutral-400 hover:text-white transition-colors p-1"
              title={isCollapsed ? 'Expand Tracker' : 'Collapse Tracker'}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Quest List */}
        {!isCollapsed && (
          <div className="p-2.5 flex flex-col gap-2.5 max-h-64 overflow-y-auto">
            {activeQuests.length === 0 && isEditMode && (
              <div className="text-xs text-neutral-400 text-center py-2 italic">
                No active quests. Drag header to position.
              </div>
            )}
            {activeQuests.slice(0, 3).map(quest => {
              const progressPct = Math.min(100, Math.floor((quest.current / quest.goal) * 100));
              const isFinished = quest.current >= quest.goal;

              return (
                <div
                  key={quest.id}
                  onClick={onOpenMenu}
                  className="bg-neutral-900/70 hover:bg-neutral-900/90 rounded-lg p-2 border border-neutral-800/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-1.5 mb-1">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-amber-300 transition-colors line-clamp-1">
                      {quest.title}
                    </span>
                    {isFinished ? (
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">
                        {quest.current}/{quest.goal}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-neutral-400 leading-tight mb-2 line-clamp-2">
                    {quest.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-950 rounded-full h-1.5 overflow-hidden border border-neutral-800">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-amber-400'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  {/* Reward Text */}
                  <div className="flex items-center justify-between mt-1 text-[9px] text-neutral-500">
                    <span>Reward: {quest.rewardText}</span>
                    <span className="font-mono">{progressPct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
