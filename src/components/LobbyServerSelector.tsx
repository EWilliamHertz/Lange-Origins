import React, { useState, useEffect } from 'react';
import { Globe, Users, Wifi, ChevronRight, Sparkles, Compass } from 'lucide-react';
import { PRESET_SERVERS, ServerRealm, ServerBrowserModal, measureServerPing, pingTone } from './ServerBrowserModal';

interface LobbyServerSelectorProps {
  selectedServerId: string;
  onSelectServer: (serverId: string) => void;
  onDirectJoin: (serverId: string) => void;
}

export const LobbyServerSelector: React.FC<LobbyServerSelectorProps> = ({
  selectedServerId,
  onSelectServer,
  onDirectJoin
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [serverList, setServerList] = useState<ServerRealm[]>(PRESET_SERVERS);

  useEffect(() => {
    let mounted = true;
    const fetchCounts = () => {
      fetch('/api/servers')
        .then(res => res.json())
        .then(data => {
          if (!mounted) return;
          if (data && Array.isArray(data.servers)) {
            const countMap = new Map<string, number>();
            data.servers.forEach((s: { id: string; players: number }) => {
              countMap.set(s.id, s.players);
            });
            setServerList(prev =>
              prev.map(srv => ({
                ...srv,
                players: countMap.get(srv.id) ?? 0
              }))
            );
          }
        })
        .catch(() => {});
      // Measure real latency instead of showing a hardcoded ping.
      void measureServerPing().then(ping => {
        if (!mounted || ping === null) return;
        setServerList(prev => prev.map(srv => ({ ...srv, ping })));
      });
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const activeServer =
    serverList.find(s => s.id === selectedServerId) || {
      id: selectedServerId || 'public-lobby',
      name: selectedServerId ? `Custom Realm (${selectedServerId})` : 'Realm Alpha (Main World)',
      category: 'Standard' as const,
      description: 'The primary realm with abundant wood, community trade depot, and starter quests.',
      players: 0,
      maxPlayers: 20,
      ping: null as number | null,
      biomeTag: 'Verdant Woodlands'
    };

  return (
    <>
      <div className="w-80 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 flex flex-col gap-4 text-white shadow-2xl z-20 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold tracking-wider uppercase text-amber-200">
              World & Realm
            </h3>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ONLINE
          </span>
        </div>

        {/* Current Active Realm Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-900/60 to-neutral-950 border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Selected Realm
              </span>
              <h4 className="text-base font-black text-white leading-tight mt-0.5">
                {activeServer.name}
              </h4>
            </div>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/10 text-neutral-300">
              {activeServer.category}
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-snug line-clamp-2">
            {activeServer.description}
          </p>

          {activeServer.biomeTag && (
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
              <Sparkles size={12} className="text-emerald-400" />
              <span>Biome Seed: {activeServer.biomeTag}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <Users size={12} className="text-sky-400" /> {activeServer.players}/{activeServer.maxPlayers} Adventurers
            </span>
            <span className={`flex items-center gap-1 font-bold ${pingTone(activeServer.ping) === 'good' ? 'text-emerald-400' : pingTone(activeServer.ping) === 'ok' ? 'text-amber-400' : pingTone(activeServer.ping) === 'bad' ? 'text-rose-400' : 'text-neutral-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pingTone(activeServer.ping) === 'good' ? 'bg-emerald-400' : pingTone(activeServer.ping) === 'ok' ? 'bg-amber-400' : pingTone(activeServer.ping) === 'bad' ? 'bg-rose-400' : 'bg-neutral-500'} animate-pulse`} />
              <Wifi size={12} /> {activeServer.ping === null ? '—' : `${activeServer.ping}ms`}
            </span>
          </div>
        </div>

        {/* Quick Realm Switches */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Quick Switch Realm
          </span>
          <div className="grid grid-cols-1 gap-1.5">
            {serverList.slice(0, 3).map(server => (
              <button
                key={server.id}
                onClick={() => onSelectServer(server.id)}
                className={`w-full px-3 py-2 rounded-lg text-left text-xs font-medium flex items-center justify-between transition-all ${
                  selectedServerId === server.id
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedServerId === server.id ? 'bg-amber-400 ring-2 ring-amber-400/40' : 'bg-neutral-600'
                    }`}
                  />
                  <span className="truncate font-semibold">{server.name}</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 shrink-0 ml-2">
                  {server.players} online
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Browse All Realms Button */}
        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-neutral-800 to-neutral-900 hover:from-neutral-700 hover:to-neutral-800 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <Compass size={14} className="text-amber-400" />
          <span>Browse All Realms & Custom ID</span>
          <ChevronRight size={14} className="text-neutral-400" />
        </button>
      </div>

      <ServerBrowserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedServerId={selectedServerId}
        onSelectServer={onSelectServer}
        onDirectJoin={id => {
          setModalOpen(false);
          onDirectJoin(id);
        }}
      />
    </>
  );
};
