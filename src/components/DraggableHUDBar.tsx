import React, { useState, useRef } from 'react';
import { Move, RotateCw, EyeOff, Eye } from 'lucide-react';
import { ElementLayout } from '../lib/hudLayout';
import { Sounds } from '../lib/audio';

interface DraggableHUDBarProps {
  id: string;
  title: string;
  layout: ElementLayout;
  onLayoutChange: (updated: Partial<ElementLayout>) => void;
  onRotate?: () => void;
  onHide?: () => void;
  isEditMode: boolean;
  defaultPositionStyle?: React.CSSProperties;
  defaultClasses?: string;
  children: React.ReactNode;
}

export const DraggableHUDBar: React.FC<DraggableHUDBarProps> = ({
  id,
  title,
  layout,
  onLayoutChange,
  onRotate,
  onHide,
  isEditMode,
  defaultPositionStyle,
  defaultClasses = '',
  children
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);

  const isVisible = layout.visible !== false;

  if (!isVisible && !isEditMode) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const rect = (e.currentTarget.parentElement || e.currentTarget).getBoundingClientRect();
    const currentX = layout.x !== undefined ? layout.x : rect.left;
    const currentY = layout.y !== undefined ? layout.y : rect.top;

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

    const newX = Math.max(0, Math.min(window.innerWidth - 60, dragStartRef.current.startPosX + deltaX));
    const newY = Math.max(0, Math.min(window.innerHeight - 60, dragStartRef.current.startPosY + deltaY));

    onLayoutChange({ x: newX, y: newY, isCustom: true });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // If hidden but in Edit Mode: render ghost placeholder
  if (!isVisible && isEditMode) {
    const ghostStyle: React.CSSProperties = layout.x !== undefined && layout.y !== undefined
      ? { left: `${layout.x}px`, top: `${layout.y}px` }
      : defaultPositionStyle || {};

    return (
      <div
        id={`hud-ghost-${id}`}
        style={ghostStyle}
        className={`fixed z-[65] p-2 rounded-xl border-2 border-dashed border-rose-500/50 bg-rose-950/20 backdrop-blur-sm select-none ${defaultClasses}`}
      >
        <div className="flex items-center gap-1.5 text-xs text-rose-300 font-bold">
          <EyeOff size={13} />
          <span>{title} (Hidden)</span>
          {onHide && (
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                onHide();
              }}
              className="ml-2 px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
            >
              <Eye size={11} /> Unhide
            </button>
          )}
        </div>
      </div>
    );
  }

  const customStyle: React.CSSProperties = layout.x !== undefined && layout.y !== undefined
    ? { left: `${layout.x}px`, top: `${layout.y}px`, right: 'auto', bottom: 'auto', transform: 'none' }
    : defaultPositionStyle || {};

  return (
    <div
      id={id}
      style={customStyle}
      className={`fixed transition-shadow select-none ${
        isEditMode ? 'z-[65] ring-2 ring-dashed ring-amber-400 bg-amber-950/20 rounded-2xl p-1 shadow-[0_0_25px_rgba(245,158,11,0.35)]' : 'z-20'
      } ${defaultClasses}`}
    >
      {/* Edit Mode Handle Bar */}
      {isEditMode && (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full flex items-center justify-between gap-1.5 px-2 py-1 mb-1 rounded-lg bg-neutral-900/95 border border-amber-500/50 text-[10px] text-amber-300 font-bold cursor-move touch-none shadow-md"
          title="Drag to reposition"
        >
          <div className="flex items-center gap-1 truncate">
            <Move size={11} />
            <span className="truncate">{title}</span>
            {layout.rotation !== undefined && (
              <span className="font-mono text-[9px] text-amber-400/80">({layout.rotation}°)</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onRotate && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Sounds.slotClick();
                  onRotate();
                }}
                className="px-1 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 flex items-center gap-0.5"
                title="Rotate 90°"
              >
                <RotateCw size={9} />
                <span>90°</span>
              </button>
            )}
            {onHide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  Sounds.slotClick();
                  onHide();
                }}
                className="p-1 rounded text-neutral-400 hover:text-rose-400 hover:bg-neutral-800"
                title={`Hide / Remove ${title}`}
              >
                <EyeOff size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
