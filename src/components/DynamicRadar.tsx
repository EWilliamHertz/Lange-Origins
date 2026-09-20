import React, { useState, useRef, useEffect } from 'react';
import { Compass, Mountain, Flame, Skull, Users, MapPin, Sparkles, AlertTriangle, Plus, Minus, Navigation, EyeOff, Radio } from 'lucide-react';
import { Sounds } from '../lib/audio';

interface RadarEntity {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'party' | 'quest' | 'portal' | 'ping';
  color?: string;
  subtext?: string;
}

interface DynamicRadarProps {
  playerX?: number;
  playerY?: number;
  playerPos?: { x: number; y: number };
  depth?: number;
  partyMembers?: { id: string; name: string; x: number; y: number; hp?: number; maxHp?: number }[];
  questTarget?: { x: number; y: number; title: string } | null;
  questTargets?: { id: string; name: string; x: number; y: number }[];
  dungeonPortal?: { x: number; y: number; name: string } | null;
  worldPings?: { id: string; x: number; y: number; type: 'danger' | 'alert' | 'loot' }[];
  isEditMode?: boolean;
  visible?: boolean;
  position?: { x?: number; y?: number; visible?: boolean };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  onHide?: () => void;
  onSendPing?: (type: 'danger' | 'alert' | 'loot') => void;
}

export const DynamicRadar: React.FC<DynamicRadarProps> = ({
  playerX: propX,
  playerY: propY,
  playerPos,
  depth = 0,
  partyMembers = [],
  questTarget,
  questTargets = [],
  dungeonPortal,
  worldPings = [],
  isEditMode = false,
  visible,
  position,
  onPositionChange,
  onHide,
  onSendPing
}) => {
  const playerX = propX ?? playerPos?.x ?? 0;
  const playerY = propY ?? playerPos?.y ?? 0;
  const isRadarVisible = visible ?? position?.visible ?? true;

  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(60); // blocks radius
  const dragStartRef = useRef<{ startMouseX: number; startMouseY: number; startPosX: number; startPosY: number } | null>(null);

  const [localPos, setLocalPos] = useState<{ x: number; y: number }>({
    x: position?.x ?? 0,
    y: position?.y ?? 0
  });

  useEffect(() => {
    if (position?.x !== undefined && position?.y !== undefined) {
      setLocalPos({ x: position.x, y: position.y });
    }
  }, [position?.x, position?.y]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const currentX = position?.x ?? (localPos.x > 0 ? localPos.x : Math.max(16, window.innerWidth - 204));
    const currentY = position?.y ?? (localPos.y > 0 ? localPos.y : 16);

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

    const newX = Math.max(8, Math.min(window.innerWidth - 220, dragStartRef.current.startPosX + deltaX));
    const newY = Math.max(8, Math.min(window.innerHeight - 220, dragStartRef.current.startPosY + deltaY));

    setLocalPos({ x: newX, y: newY });
    onPositionChange?.({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Determine Biome / Depth Zone
  const currentDepth = depth || Math.floor(playerY);
  let zoneName = 'Surface Realm';
  let zoneColor = 'text-emerald-400';
  let zoneBorder = 'border-emerald-500/40';
  let ZoneIcon = Mountain;

  if (currentDepth > 120) {
    zoneName = 'Underworld Depths';
    zoneColor = 'text-rose-400';
    zoneBorder = 'border-rose-500/50';
    ZoneIcon = Flame;
  } else if (currentDepth > 40) {
    zoneName = 'Cavern Network';
    zoneColor = 'text-cyan-400';
    zoneBorder = 'border-cyan-500/40';
    ZoneIcon = Compass;
  }

  // Square map dimensions
  const MAP_SIZE_PX = 168; // px width & height of the square map canvas
  const HALF_SIZE = MAP_SIZE_PX / 2;

  // Collect entities to plot
  const entities: RadarEntity[] = [];

  partyMembers.forEach(m => {
    entities.push({
      id: `party-${m.id}`,
      name: m.name,
      x: m.x,
      y: m.y,
      type: 'party',
      color: '#38bdf8'
    });
  });

  if (questTarget) {
    entities.push({
      id: 'quest-target',
      name: questTarget.title,
      x: questTarget.x,
      y: questTarget.y,
      type: 'quest',
      color: '#fbbf24'
    });
  }

  questTargets.forEach(qt => {
    if (!entities.some(e => e.id === `quest-${qt.id}`)) {
      entities.push({
        id: `quest-${qt.id}`,
        name: qt.name,
        x: qt.x,
        y: qt.y,
        type: 'quest',
        color: '#fbbf24'
      });
    }
  });

  if (dungeonPortal) {
    entities.push({
      id: 'dungeon-portal',
      name: dungeonPortal.name,
      x: dungeonPortal.x,
      y: dungeonPortal.y,
      type: 'portal',
      color: '#c084fc'
    });
  }

  worldPings.forEach(p => {
    entities.push({
      id: `ping-${p.id}`,
      name: p.type === 'danger' ? 'Danger Beacon' : p.type === 'loot' ? 'Loot Marker' : 'Party Alert',
      x: p.x,
      y: p.y,
      type: 'ping',
      color: p.type === 'danger' ? '#ef4444' : p.type === 'loot' ? '#3b82f6' : '#f59e0b'
    });
  });

  const stylePosition: React.CSSProperties =
    position?.x !== undefined || localPos.x > 0
      ? { left: `${localPos.x}px`, top: `${localPos.y}px` }
      : { right: '16px', top: '16px' };

  if (!isRadarVisible) {
    if (!isEditMode) return null;
    return (
      <div
        id="hud-dynamic-radar-ghost"
        style={stylePosition}
        className="fixed z-30 p-2.5 rounded-xl border-2 border-dashed border-amber-500/50 bg-neutral-950/60 backdrop-blur-sm select-none pointer-events-auto shadow-lg"
      >
        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
          <EyeOff size={14} />
          <span>Minimap (Hidden)</span>
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
      id="hud-dynamic-radar"
      style={stylePosition}
      className={`fixed z-30 pointer-events-auto select-none transition-shadow ${
        isEditMode ? 'ring-2 ring-amber-400 ring-dashed shadow-[0_0_25px_rgba(245,158,11,0.35)]' : ''
      }`}
    >
      <div
        className={`bg-neutral-950/95 backdrop-blur-xl rounded-xl p-2 border ${zoneBorder} shadow-2xl flex flex-col items-center gap-1.5`}
      >
        {/* Top Header / Drag Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full flex items-center justify-between text-[11px] font-bold px-1.5 py-0.5 border-b border-white/10 cursor-move touch-none bg-neutral-900/60 rounded-t-lg"
          title="Tactical Minimap (Drag to move)"
        >
          <div className="flex items-center gap-1.5 truncate">
            <ZoneIcon size={13} className={zoneColor} />
            <span className={`truncate max-w-[95px] tracking-wide text-xs ${zoneColor}`}>
              {zoneName}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono text-neutral-400 text-[10px]">
              Y:{currentDepth}m
            </span>
            {isEditMode && onHide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHide();
                }}
                className="text-neutral-400 hover:text-rose-400 p-0.5 rounded hover:bg-white/10"
                title="Hide / Remove Minimap"
              >
                <EyeOff size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Tactical Square / Rectangle Minimap Canvas */}
        <div
          className="relative w-[168px] h-[168px] bg-neutral-900/95 rounded-lg border border-white/15 overflow-hidden flex items-center justify-center shadow-inner"
        >
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* Coordinate Crosshairs */}
          <div className="absolute w-full h-px bg-white/10 pointer-events-none" />
          <div className="absolute h-full w-px bg-white/10 pointer-events-none" />

          {/* Center Range Ring */}
          <div className="absolute w-24 h-24 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute w-12 h-12 rounded-full border border-white/5 pointer-events-none" />

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-amber-500/10 animate-[spin_6s_linear_infinite] pointer-events-none" />

          {/* Player Center Marker */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 rounded-full bg-white ring-2 ring-amber-400 shadow-[0_0_10px_#fbbf24] flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-neutral-950" />
            </div>
            {/* View Cone / Heading indicator */}
            <div className="absolute -top-2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-amber-400" />
          </div>

          {/* Entity Blips in Square Boundary */}
          {entities.map(ent => {
            const dx = ent.x - playerX;
            const dy = ent.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Scale to square coordinate range (-HALF_SIZE to +HALF_SIZE)
            const scale = HALF_SIZE / zoomLevel;
            let screenX = dx * scale;
            let screenY = dy * scale;

            // Clamping within square with safety margins
            const maxOffset = HALF_SIZE - 10;
            const isOffscreen = Math.abs(screenX) > maxOffset || Math.abs(screenY) > maxOffset;

            if (isOffscreen) {
              const maxDim = Math.max(Math.abs(screenX), Math.abs(screenY));
              screenX = (screenX / maxDim) * maxOffset;
              screenY = (screenY / maxDim) * maxOffset;
            }

            return (
              <div
                key={ent.id}
                title={`${ent.name} (${Math.round(dist)}m)`}
                className="absolute z-20 pointer-events-none transition-transform duration-100"
                style={{
                  transform: `translate(${screenX}px, ${screenY}px)`
                }}
              >
                {ent.type === 'quest' ? (
                  <div className="w-3.5 h-3.5 -ml-1.5 -mt-1.5 bg-amber-400 rotate-45 border border-black shadow-[0_0_8px_#fbbf24] flex items-center justify-center animate-pulse" />
                ) : ent.type === 'portal' ? (
                  <div className="w-3.5 h-3.5 -ml-1.5 -mt-1.5 rounded-full bg-purple-500 border border-white/80 shadow-[0_0_8px_#c084fc] animate-ping" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shadow-md ${isOffscreen ? 'opacity-85' : 'animate-pulse'}`}
                      style={{
                        backgroundColor: ent.color || '#38bdf8',
                        boxShadow: `0 0 8px ${ent.color || '#38bdf8'}`
                      }}
                    />
                    {isOffscreen && (
                      <div
                        className="absolute -top-2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[4px]"
                        style={{ borderBottomColor: ent.color || '#38bdf8' }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Square Compass Cardinal Directions along borders */}
          <span className="absolute top-1 text-[9px] font-black font-mono text-amber-400/90 tracking-wider">
            N
          </span>
          <span className="absolute bottom-1 text-[9px] font-black font-mono text-neutral-400">
            S
          </span>
          <span className="absolute left-1 text-[9px] font-black font-mono text-neutral-400">
            W
          </span>
          <span className="absolute right-1 text-[9px] font-black font-mono text-neutral-400">
            E
          </span>

          {/* Floating Zoom Controls (+ / -) */}
          <div className="absolute bottom-1 right-1 flex flex-col gap-1 z-20">
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                setZoomLevel(z => Math.max(30, z - 15));
              }}
              className="w-5 h-5 rounded bg-black/70 hover:bg-black text-white/90 hover:text-white border border-white/20 flex items-center justify-center transition-colors text-xs font-bold"
              title="Zoom In"
            >
              <Plus size={11} />
            </button>
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                setZoomLevel(z => Math.min(140, z + 15));
              }}
              className="w-5 h-5 rounded bg-black/70 hover:bg-black text-white/90 hover:text-white border border-white/20 flex items-center justify-center transition-colors text-xs font-bold"
              title="Zoom Out"
            >
              <Minus size={11} />
            </button>
          </div>

          {/* Ping Beacon Button */}
          {onSendPing && (
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                onSendPing('alert');
              }}
              className="absolute top-1 right-1 w-5 h-5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 flex items-center justify-center transition-colors z-20"
              title="Broadcast Party Ping at your location"
            >
              <Radio size={10} />
            </button>
          )}
        </div>

        {/* Bottom Coordinates & Zoom Readout */}
        <div className="w-full flex items-center justify-between text-[10px] font-mono text-neutral-400 px-1 pt-0.5">
          <span className="text-neutral-300 font-bold">
            X:{Math.floor(playerX)} Y:{Math.floor(playerY)}
          </span>
          <div className="flex items-center gap-1 text-[9px] text-neutral-500">
            <span>{zoomLevel}m</span>
            {partyMembers.length > 0 && (
              <span className="text-sky-400 flex items-center gap-0.5 font-bold ml-1">
                <Users size={10} /> {partyMembers.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
