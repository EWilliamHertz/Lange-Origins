import React, { useState, useRef, useEffect } from 'react';
import { 
  Users, UserPlus, LogOut, Shield, Zap, Sparkles, Crown, 
  Swords, Heart, CheckCircle2, Clock, Navigation, MoreVertical, 
  EyeOff, Radio, Settings, UserCheck, ShieldAlert 
} from 'lucide-react';
import { Sounds } from '../lib/audio';

export type PartyRole = 'tank' | 'healer' | 'dps';

export interface PartyMember {
  id: string;
  name: string;
  playerClass?: string;
  role?: PartyRole;
  level?: number;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  isLeader?: boolean;
  isReady?: boolean;
  x?: number;
  y?: number;
}

export interface PartyData {
  id: string;
  leaderId: string;
  lootMode?: 'need_greed' | 'round_robin' | 'free_for_all';
  members: PartyMember[];
}

interface HUDPartyOverlayProps {
  party: PartyMember[] | PartyData | null;
  nearbyPlayers: { id: string; name: string; playerClass?: string; level?: number }[];
  currentUserId: string;
  currentUserName?: string;
  currentHealth?: number;
  maxHealth?: number;
  currentMana?: number;
  maxMana?: number;
  playerPos?: { x: number; y: number };
  isEditMode?: boolean;
  visible?: boolean;
  position?: { x?: number; y?: number; visible?: boolean };
  onPositionChange?: (pos: { x: number; y: number }) => void;
  onInvitePlayer?: (targetId: string) => void;
  onLeaveParty?: () => void;
  onKickMember?: (memberId: string) => void;
  onPromoteLeader?: (memberId: string) => void;
  onChangeRole?: (role: PartyRole) => void;
  onStartReadyCheck?: () => void;
  onChangeLootMode?: (mode: 'need_greed' | 'round_robin' | 'free_for_all') => void;
  onInspectMember?: (member: PartyMember) => void;
  onHide?: () => void;
  isBlockProtectionActive?: boolean;
  onToggleBlockProtection?: () => void;
}

export const HUDPartyOverlay: React.FC<HUDPartyOverlayProps> = ({
  party,
  nearbyPlayers,
  currentUserId,
  currentUserName,
  currentHealth,
  maxHealth,
  currentMana,
  maxMana,
  playerPos,
  isEditMode = false,
  visible,
  position,
  onPositionChange,
  onInvitePlayer,
  onLeaveParty,
  onKickMember,
  onPromoteLeader,
  onChangeRole,
  onStartReadyCheck,
  onChangeLootMode,
  onInspectMember,
  onHide,
  isBlockProtectionActive = false,
  onToggleBlockProtection
}) => {
  const isPartyVisible = visible ?? position?.visible ?? true;
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPartySettings, setShowPartySettings] = useState(false);
  const [selectedMemberMenu, setSelectedMemberMenu] = useState<string | null>(null);
  const [inviteSearch, setInviteSearch] = useState('');
  const [readyCheckActive, setReadyCheckActive] = useState(false);
  const [readyCheckTime, setReadyCheckTime] = useState(10);

  // Position dragging
  const [isDragging, setIsDragging] = useState(false);
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

    const currentX = position?.x ?? (localPos.x > 0 ? localPos.x : 16);
    const currentY = position?.y ?? (localPos.y > 0 ? localPos.y : 76);

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

    const newX = Math.max(8, Math.min(window.innerWidth - 240, dragStartRef.current.startPosX + deltaX));
    const newY = Math.max(8, Math.min(window.innerHeight - 300, dragStartRef.current.startPosY + deltaY));

    setLocalPos({ x: newX, y: newY });
    onPositionChange?.({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    dragStartRef.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const defaultHp = currentHealth !== undefined ? Math.round(currentHealth) : 20;
  const defaultMaxHp = maxHealth !== undefined ? Math.max(1, maxHealth) : 20;
  const defaultMana = currentMana !== undefined ? Math.round(currentMana) : 100;
  const defaultMaxMana = maxMana !== undefined ? Math.max(1, maxMana) : 100;

  const members: PartyMember[] = Array.isArray(party) 
    ? party 
    : (party?.members || [
        { 
          id: currentUserId || 'self', 
          name: currentUserName || 'You', 
          playerClass: 'warrior', 
          role: 'tank', 
          level: 1, 
          hp: defaultHp, 
          maxHp: defaultMaxHp, 
          mana: defaultMana, 
          maxMana: defaultMaxMana, 
          isLeader: true 
        }
      ]);

  const isLeader = members.find(m => m.id === currentUserId)?.isLeader ?? true;
  const currentLootMode = (!Array.isArray(party) && party?.lootMode) || 'need_greed';

  const getRoleIcon = (role?: PartyRole) => {
    switch (role) {
      case 'tank':
        return <Shield size={12} className="text-amber-400" title="Role: Tank" />;
      case 'healer':
        return <Heart size={12} className="text-emerald-400" title="Role: Healer" />;
      case 'dps':
      default:
        return <Swords size={12} className="text-rose-400" title="Role: DPS" />;
    }
  };

  const getClassIcon = (cls?: string) => {
    switch (cls) {
      case 'archer':
        return <Zap size={11} className="text-emerald-400" />;
      case 'mage':
        return <Sparkles size={11} className="text-cyan-400" />;
      case 'warrior':
      default:
        return <Shield size={11} className="text-rose-400" />;
    }
  };

  const handleTriggerReadyCheck = () => {
    Sounds.slotClick();
    setReadyCheckActive(true);
    setReadyCheckTime(10);
    onStartReadyCheck?.();

    const interval = setInterval(() => {
      setReadyCheckTime(t => {
        if (t <= 1) {
          clearInterval(interval);
          setReadyCheckActive(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const inviteablePlayers = nearbyPlayers.filter(
    p => p.id !== currentUserId && 
         !members.some(m => m.id === p.id) &&
         (inviteSearch.trim() === '' || p.name.toLowerCase().includes(inviteSearch.toLowerCase()))
  );

  const stylePosition: React.CSSProperties =
    position?.x !== undefined || localPos.x > 0
      ? { left: `${localPos.x}px`, top: `${localPos.y}px` }
      : { left: '16px', top: '76px' };

  if (!isPartyVisible) {
    if (!isEditMode) return null;
    return (
      <div
        id="hud-party-overlay-ghost"
        style={stylePosition}
        className="fixed z-30 p-2.5 rounded-xl border-2 border-dashed border-amber-500/50 bg-neutral-950/60 backdrop-blur-sm select-none pointer-events-auto shadow-lg"
      >
        <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
          <EyeOff size={14} />
          <span>Party Frames (Hidden)</span>
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
      id="hud-party-overlay"
      style={stylePosition}
      className={`fixed z-30 select-none pointer-events-auto transition-shadow ${
        isEditMode ? 'ring-2 ring-amber-400 ring-dashed shadow-[0_0_20px_rgba(245,158,11,0.35)]' : ''
      }`}
    >
      <div className="flex flex-col gap-1.5 w-60">
        {/* Party Header Drag Bar */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center justify-between bg-neutral-950/95 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-white/15 shadow-xl cursor-move touch-none"
        >
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-cyan-400" />
            <span className="text-xs font-black tracking-wide text-neutral-100">
              Party ({members.length}/4)
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 font-mono border border-cyan-800/50">
              {currentLootMode === 'need_greed' ? 'N/G' : currentLootMode === 'round_robin' ? 'R.Robin' : 'FFA'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Ready check trigger button */}
            <button
              type="button"
              onClick={handleTriggerReadyCheck}
              className={`p-1 rounded transition-colors ${
                readyCheckActive 
                  ? 'bg-amber-500 text-black animate-pulse' 
                  : 'text-neutral-400 hover:text-amber-400 hover:bg-neutral-800'
              }`}
              title="Initiate 10s Party Ready Check"
            >
              <CheckCircle2 size={13} />
            </button>

            {/* Indestructible Block Protection for Party Owner */}
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                onToggleBlockProtection?.();
              }}
              title={
                isBlockProtectionActive
                  ? "Party Block Protection: ACTIVE (Blocks placed are indestructible to non-members)"
                  : "Party Block Protection: INACTIVE (Click to make placed blocks indestructible)"
              }
              className={`p-1 rounded transition-colors ${
                isBlockProtectionActive
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'text-neutral-400 hover:text-amber-300 hover:bg-neutral-800'
              }`}
            >
              <Shield size={13} className={isBlockProtectionActive ? 'fill-amber-400 text-amber-400' : ''} />
            </button>

            {/* Invite button */}
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                setShowInviteModal(prev => !prev);
              }}
              title="Invite players to party"
              className="p-1 text-neutral-400 hover:text-cyan-300 rounded hover:bg-neutral-800 transition-colors"
            >
              <UserPlus size={13} />
            </button>

            {/* Settings button */}
            <button
              type="button"
              onClick={() => {
                Sounds.slotClick();
                setShowPartySettings(prev => !prev);
              }}
              title="Party Settings & Loot Rules"
              className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
            >
              <Settings size={13} />
            </button>

            {/* Leave Party button */}
            {members.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  Sounds.slotClick();
                  onLeaveParty?.();
                }}
                title="Leave Party"
                className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800 transition-colors"
              >
                <LogOut size={13} />
              </button>
            )}

            {/* In Edit Mode: Hide button */}
            {isEditMode && onHide && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onHide();
                }}
                className="p-1 text-neutral-400 hover:text-rose-400 rounded hover:bg-neutral-800"
                title="Hide / Remove Party Frame"
              >
                <EyeOff size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Ready Check Active Banner */}
        {readyCheckActive && (
          <div className="bg-amber-950/90 border border-amber-500/60 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-xs text-amber-200 shadow-lg animate-in fade-in">
            <span className="flex items-center gap-1 font-bold">
              <Clock size={12} className="animate-spin" /> Ready Check:
            </span>
            <span className="font-mono font-black text-amber-400">{readyCheckTime}s remaining</span>
          </div>
        )}

        {/* Party Member Frames */}
        {(() => {
          const seenMemberKeys = new Set<string>();
          const uniqueMembers = members.filter((m, i) => {
            const key = m.id || `idx-${i}`;
            if (seenMemberKeys.has(key)) return false;
            seenMemberKeys.add(key);
            return true;
          });

          return uniqueMembers.map((member, memberIdx) => {
            const isSelf = member.id === currentUserId || member.name === 'You' || member.id === 'self' || (Boolean(currentUserName) && member.name === currentUserName);
            const rawHp = isSelf && currentHealth !== undefined ? currentHealth : member.hp;
            const rawMaxHp = isSelf && maxHealth !== undefined ? maxHealth : member.maxHp;
            const rawMana = isSelf && currentMana !== undefined ? currentMana : member.mana;
            const rawMaxMana = isSelf && maxMana !== undefined ? maxMana : member.maxMana;

            const hp = Math.max(0, Math.round(rawHp ?? 0));
            const memberMaxHp = Math.max(1, Math.round(rawMaxHp ?? 20));
            const hpPercent = Math.max(0, Math.min(100, Math.floor((hp / memberMaxHp) * 100)));

            const mana = Math.max(0, Math.round(rawMana ?? 100));
            const memberMaxMana = Math.max(1, Math.round(rawMaxMana ?? 100));
            const manaPercent = Math.max(0, Math.min(100, Math.floor((mana / memberMaxMana) * 100)));

            // Distance calculation if playerPos exists
            let distanceStr = '';
            if (playerPos && member.x !== undefined && member.y !== undefined && !isSelf) {
              const dx = member.x - playerPos.x;
              const dy = member.y - playerPos.y;
              const dist = Math.round(Math.sqrt(dx * dx + dy * dy));
              distanceStr = `${dist}m`;
            }

            return (
              <div
                key={member.id || `member-${memberIdx}`}
                className={`relative bg-neutral-950/90 backdrop-blur-md p-2 rounded-xl border transition-all shadow-md ${
                hpPercent <= 25 
                  ? 'border-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.2)]' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {/* Top row: Name, Role, Crown, Level */}
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  {member.isLeader && <Crown size={12} className="text-amber-400 shrink-0" title="Party Leader" />}
                  <button
                    type="button"
                    onClick={() => {
                      if (isSelf && onChangeRole) {
                        const roles: PartyRole[] = ['tank', 'healer', 'dps'];
                        const next = roles[(roles.indexOf(member.role || 'dps') + 1) % roles.length];
                        onChangeRole(next);
                      }
                    }}
                    className={isSelf ? 'hover:scale-110 cursor-pointer transition-transform' : ''}
                    title={isSelf ? 'Click to change your party role' : `Role: ${member.role || 'dps'}`}
                  >
                    {getRoleIcon(member.role)}
                  </button>
                  <span className="truncate text-white text-[11px]">
                    {member.name} {isSelf && <span className="text-neutral-500 font-normal">(You)</span>}
                  </span>
                  {member.level && (
                    <span className="text-[9px] font-mono text-amber-400/90 font-bold">
                      L{member.level}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {distanceStr && (
                    <span className="text-[9px] font-mono text-sky-400 font-medium">
                      {distanceStr}
                    </span>
                  )}
                  {/* Context menu toggle */}
                  {!isSelf && (
                    <button
                      type="button"
                      onClick={() => setSelectedMemberMenu(selectedMemberMenu === member.id ? null : member.id)}
                      className="text-neutral-500 hover:text-neutral-200 p-0.5 rounded"
                      title="Member actions"
                    >
                      <MoreVertical size={11} />
                    </button>
                  )}
                </div>
              </div>

              {/* Health Bar with exact values */}
              <div className="w-full bg-neutral-900 rounded h-2 overflow-hidden border border-neutral-800 relative mb-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    hpPercent > 50
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : hpPercent > 25
                      ? 'bg-gradient-to-r from-amber-600 to-amber-400'
                      : 'bg-gradient-to-r from-rose-700 to-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[8px] font-mono font-black text-white/90 drop-shadow-[0_1px_1px_black]">
                  {hp} / {memberMaxHp} ({hpPercent}%)
                </span>
              </div>

              {/* Mana Bar */}
              <div className="w-full bg-neutral-900 rounded h-1.5 overflow-hidden border border-neutral-800/80 relative">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-sky-400 transition-all duration-300"
                  style={{ width: `${manaPercent}%` }}
                />
              </div>

              {/* Member Context Dropdown Menu */}
              {selectedMemberMenu === member.id && (
                <div className="absolute top-8 right-2 z-40 bg-neutral-900 border border-neutral-700 rounded-lg p-1.5 shadow-2xl flex flex-col gap-1 w-36 text-xs text-neutral-200">
                  {onInspectMember && (
                    <button
                      type="button"
                      onClick={() => {
                        onInspectMember(member);
                        setSelectedMemberMenu(null);
                      }}
                      className="text-left px-2 py-1 hover:bg-neutral-800 rounded font-medium text-purple-300"
                    >
                      Inspect Gear
                    </button>
                  )}
                  {isLeader && onPromoteLeader && (
                    <button
                      type="button"
                      onClick={() => {
                        onPromoteLeader(member.id);
                        setSelectedMemberMenu(null);
                      }}
                      className="text-left px-2 py-1 hover:bg-neutral-800 rounded font-medium text-amber-300"
                    >
                      Promote Leader
                    </button>
                  )}
                  {isLeader && onKickMember && (
                    <button
                      type="button"
                      onClick={() => {
                        onKickMember(member.id);
                        setSelectedMemberMenu(null);
                      }}
                      className="text-left px-2 py-1 hover:bg-rose-950/60 text-rose-400 rounded font-medium"
                    >
                      Kick from Party
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        });
      })()}

        {/* Party Settings & Loot Rules Menu */}
        {showPartySettings && (
          <div className="bg-neutral-950/95 backdrop-blur-md p-3 rounded-xl border border-amber-500/30 shadow-2xl flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between border-b border-white/10 pb-1">
              <span className="text-xs font-bold text-amber-300">Party Loot Distribution</span>
              <button
                type="button"
                onClick={() => setShowPartySettings(false)}
                className="text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-1">
              {[
                { id: 'need_greed', label: 'Need Before Greed', desc: 'Roll dice for dungeon drops' },
                { id: 'round_robin', label: 'Round Robin', desc: 'Drops rotate equally across members' },
                { id: 'free_for_all', label: 'Free For All', desc: 'Anyone can pick up anything' },
              ].map(mode => (
                <button
                  key={mode.id}
                  type="button"
                  disabled={!isLeader}
                  onClick={() => {
                    Sounds.slotClick();
                    onChangeLootMode?.(mode.id as any);
                  }}
                  className={`flex flex-col items-start p-1.5 rounded-lg text-left transition-colors border ${
                    currentLootMode === mode.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-white'
                      : 'bg-neutral-900 border-transparent text-neutral-400 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <span className="text-[11px] font-bold">{mode.label}</span>
                  <span className="text-[9px] text-neutral-500">{mode.desc}</span>
                </button>
              ))}
              {!isLeader && (
                <span className="text-[9px] text-amber-400/80 italic mt-1">
                  Only the party leader can change party rules.
                </span>
              )}

              {/* Block Protection Setting */}
              <div className="mt-2 pt-2 border-t border-white/10 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-200 flex items-center gap-1">
                    <Shield size={12} className="text-amber-400" />
                    Block Protection
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      Sounds.slotClick();
                      onToggleBlockProtection?.();
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black transition-colors ${
                      isBlockProtectionActive
                        ? 'bg-amber-500 text-neutral-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isBlockProtectionActive ? 'ON' : 'OFF'}
                  </button>
                </div>
                <span className="text-[9px] text-neutral-400 leading-tight">
                  Protects placed blocks making them indestructible to non-party members.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Invite Popup */}
        {showInviteModal && (
          <div className="bg-neutral-950/95 backdrop-blur-md p-3 rounded-xl border border-cyan-500/30 shadow-2xl flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300">Invite Players</span>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="text-neutral-500 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <input
              type="text"
              placeholder="Search player name..."
              value={inviteSearch}
              onChange={(e) => setInviteSearch(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
            />

            {inviteablePlayers.length === 0 ? (
              <p className="text-[11px] text-neutral-400 italic py-1">No other players available to invite.</p>
            ) : (
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {inviteablePlayers.map(player => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-1.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {getClassIcon(player.playerClass)}
                      <span className="truncate text-neutral-200 text-[11px]">{player.name}</span>
                      {player.level && (
                        <span className="text-[9px] font-mono text-amber-400">L{player.level}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        Sounds.slotClick();
                        onInvitePlayer?.(player.id);
                        setShowInviteModal(false);
                      }}
                      className="px-2 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[10px] font-bold active:scale-95"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
