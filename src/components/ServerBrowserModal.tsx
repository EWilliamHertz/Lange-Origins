import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Globe, Server, Users, Wifi, Shield, Swords, Sparkles, Search, X, Check, ArrowRight } from 'lucide-react';

export interface ServerRealm {
  id: string;
  name: string;
  category: 'Standard' | 'Wilderness' | 'Frontier';
  description: string;
  players: number;
  maxPlayers: number;
  ping: number;
  biomeTag?: string;
  featured?: boolean;
}

export const PRESET_SERVERS: ServerRealm[] = [
  {
    id: 'public-lobby',
    name: 'Realm Alpha (Main World)',
    category: 'Standard',
    description: 'The primary realm with abundant wood, community trade depot, and starter quests.',
    players: 8,
    maxPlayers: 20,
    ping: 42,
    biomeTag: 'Verdant Woodlands',
    featured: true
  },
  {
    id: 'realm-2',
    name: 'Realm Beta (Wilderness)',
    category: 'Wilderness',
    description: 'Expansive wild frontier with dense forests, volcanic crags, and deep crystal caverns.',
    players: 14,
    maxPlayers: 20,
    ping: 38,
    biomeTag: 'Obsidian Caverns',
    featured: true
  },
  {
    id: 'realm-3',
    name: 'Realm Gamma (Frontier)',
    category: 'Frontier',
    description: 'A serene expanse with snow-capped mountain peaks and undisturbed subterranean ruins.',
    players: 5,
    maxPlayers: 20,
    ping: 54,
    biomeTag: 'Glacial Peaks',
    featured: false
  }
];

interface ServerBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedServerId: string;
  onSelectServer: (serverId: string) => void;
  onDirectJoin: (serverId: string) => void;
}

export const ServerBrowserModal: React.FC<ServerBrowserModalProps> = ({
  isOpen,
  onClose,
  selectedServerId,
  onSelectServer,
  onDirectJoin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [customServerInput, setCustomServerInput] = useState('');
  const [liveServers, setLiveServers] = useState<ServerRealm[]>(PRESET_SERVERS);

  // Attempt to fetch any active rooms from backend if available
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/servers')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.servers)) {
          // Merge dynamic rooms
          const dynamicMap = new Map<string, number>();
          data.servers.forEach((s: { id: string; players: number }) => {
            dynamicMap.set(s.id, s.players);
          });
          setLiveServers(prev =>
            prev.map(srv => ({
              ...srv,
              players: dynamicMap.has(srv.id) ? dynamicMap.get(srv.id)! : srv.players
            }))
          );
        }
      })
      .catch(() => {
        // Fall back gracefully to preset servers
      });
  }, [isOpen]);

  // Escape key listener to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredServers = liveServers.filter(srv => {
    const matchesSearch =
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || srv.category.toLowerCase() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryBadge = (cat: ServerRealm['category']) => {
    switch (cat) {
      case 'Wilderness':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40">Wilderness</span>;
      case 'Frontier':
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">Frontier</span>;
      default:
        return <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-500/40">Standard</span>;
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl bg-neutral-950 border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Globe size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                World Realm Browser
              </h2>
              <p className="text-xs text-neutral-400">Select an online realm or connect to a custom private server</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-white/5 bg-neutral-900/40 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search realms by name, biome, or ID..."
              className="w-full bg-neutral-900 border border-white/10 text-white rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {['all', 'standard', 'dungeon', 'hardcore', 'creative', 'arcane'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${
                  filterCategory === cat
                    ? 'bg-amber-500 text-neutral-950 shadow-md'
                    : 'bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Server List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar">
          {filteredServers.map(srv => {
            const isSelected = selectedServerId === srv.id;
            return (
              <div
                key={srv.id}
                onClick={() => onSelectServer(srv.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50'
                    : 'bg-neutral-900/50 border-white/5 hover:bg-neutral-900/80 hover:border-white/10'
                }`}
              >
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-white tracking-wide">{srv.name}</h4>
                    {getCategoryBadge(srv.category)}
                    {srv.biomeTag && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                        <Sparkles size={10} className="text-emerald-400" />
                        {srv.biomeTag}
                      </span>
                    )}
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Check size={11} /> Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{srv.description}</p>
                  <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Users size={13} className="text-sky-400" /> {srv.players}/{srv.maxPlayers} Adventurers
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${srv.ping < 40 ? 'bg-emerald-400' : (srv.ping < 60 ? 'bg-amber-400' : 'bg-rose-400')} animate-pulse`} />
                      <Wifi size={13} className={srv.ping < 40 ? 'text-emerald-400' : 'text-amber-400'} /> {srv.ping}ms
                    </span>
                    <span className="text-neutral-500">ID: {srv.id}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onSelectServer(srv.id);
                      onDirectJoin(srv.id);
                    }}
                    className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    <span>Connect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredServers.length === 0 && (
            <div className="text-center py-12 text-neutral-500 text-sm">
              No world realms matched your filter query.
            </div>
          )}
        </div>

        {/* Custom Server Connect Footer */}
        <div className="p-4 border-t border-white/10 bg-neutral-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <Server size={16} className="text-amber-400 shrink-0" />
            <input
              type="text"
              value={customServerInput}
              onChange={e => setCustomServerInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && customServerInput.trim()) {
                  onSelectServer(customServerInput.trim());
                  onDirectJoin(customServerInput.trim());
                }
              }}
              placeholder="Enter Custom Realm ID (e.g. guild-room-42)..."
              className="bg-neutral-950 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 w-full sm:w-64 font-mono"
            />
            <button
              onClick={() => {
                if (customServerInput.trim()) {
                  onSelectServer(customServerInput.trim());
                  onDirectJoin(customServerInput.trim());
                }
              }}
              disabled={!customServerInput.trim()}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white text-xs font-bold transition-colors shrink-0"
            >
              Join Custom
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-bold transition-colors w-full sm:w-auto"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
