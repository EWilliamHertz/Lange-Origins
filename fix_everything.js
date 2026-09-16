import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Top Right Profile \*\/\}.*?(?=const countAmmo =)/s;

const replacement = `{/* Top Right Profile */}
        {currentUser && (
          <div className="absolute top-6 right-6 z-20 flex items-center gap-4 bg-[#141417]/80 backdrop-blur-xl px-5 py-2.5 rounded-full border border-white/5 shadow-2xl">
             <img src={currentUser.photoURL || \`https://ui-avatars.com/api/?name=\${currentUser.displayName}\`} alt="avatar" className="w-9 h-9 rounded-full ring-2 ring-neutral-800" />
             <span className="text-neutral-300 font-medium text-sm hidden md:block">{currentUser.displayName}</span>
             <div className="w-px h-4 bg-neutral-800 mx-1 hidden md:block"></div>
             <button onClick={handleSignOut} className="px-4 py-2 rounded-xl text-sm font-bold bg-[#1A1A1F] text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all">Sign Out</button>
          </div>
        )}

        <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 h-full z-10 pt-24 lg:pt-8">
          
          <div className="flex-1 bg-[#141417]/80 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-10 border border-white/5 flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
             
             <div className="flex items-center gap-4 mb-10 shrink-0">
               <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/30">
                 <Globe size={28} className="text-white" />
               </div>
               <div>
                 <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500 tracking-tight">World Browser</h1>
                 <p className="text-neutral-400 font-medium">Join an existing realm or start your own.</p>
               </div>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
               <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4 shrink-0">
                 <button
                     onClick={() => setLobbyTab('play')}
                     className={\`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all \${lobbyTab === 'play' ? 'bg-blue-600/20 text-blue-400' : 'text-neutral-500 hover:text-white'}\`}
                 >Live Servers</button>
                 <button
                     onClick={() => setLobbyTab('marketplace')}
                     className={\`text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all flex items-center gap-2 \${lobbyTab === 'marketplace' ? 'bg-emerald-600/20 text-emerald-400' : 'text-neutral-500 hover:text-white'}\`}
                 ><ShoppingBag size={14}/> Marketplace</button>
               </div>
                          
               {lobbyTab === 'play' ? (
                 <div className="flex flex-col">
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Star size={14} className="text-amber-500" /> Favorites
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {favoriteServers.length > 0 ? favoriteServers.map(srv => (
                         <div key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                           <span className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv}</span>
                           <button onClick={(e) => toggleFavorite(srv, e)} className="text-amber-500 hover:text-amber-400 p-1">
                             <Star size={18} fill="currentColor" />
                           </button>
                         </div>
                       )) : <p className="text-neutral-600 text-sm italic py-2">No favorites yet.</p>}
                     </div>
                   </div>
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Globe size={14} className="text-blue-500" /> Public Realms
                     </h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {publicServers.map(srv => (
                         <div key={srv.id} onClick={() => joinServer(srv.id)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                           <div>
                             <div className="font-bold text-neutral-200 group-hover:text-white transition-colors">{srv.id}</div>
                             <div className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5"><User size={12} /> {srv.players} online</div>
                           </div>
                           <button onClick={(e) => toggleFavorite(srv.id, e)} className="text-neutral-600 hover:text-amber-500 p-1 transition-colors">
                             <Star size={18} fill={favoriteServers.includes(srv.id) ? "currentColor" : "none"} />
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                   <div className="mb-8">
                     <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                       <Clock size={14} className="text-neutral-500" /> Recent
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {recentServers.length > 0 ? recentServers.map(srv => (
                         <button key={srv} onClick={() => joinServer(srv)} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-neutral-700 px-4 py-2 rounded-xl text-sm font-medium text-neutral-300 hover:text-white transition-colors">
                           {srv}
                         </button>
                       )) : <p className="text-neutral-600 text-sm italic py-1">No recent servers.</p>}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div className="flex flex-col gap-4">
                    <div className="bg-[#1A1A1E] rounded-2xl p-5 border border-emerald-500/30 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                       <div>
                         <h4 className="text-emerald-400 font-bold mb-1">Publish Your World</h4>
                         <p className="text-sm text-neutral-400">Share your custom realm or minigame blueprint with the community.</p>
                       </div>
                       <button onClick={() => publishBlueprint()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap active:scale-95 shadow-lg shadow-emerald-900/50">Publish World</button>
                    </div>
                                     
                    <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-2 mt-4 flex items-center gap-2">
                      <Globe size={14} className="text-emerald-500" /> Community Blueprints
                    </h3>
                    <div className="grid grid-cols-1 gap-4 pb-4">
                      {marketBlueprints.length > 0 ? marketBlueprints.map(bp => (
                         <div key={bp.id} className="bg-[#0A0A0B]/60 hover:bg-[#1A1A1E]/80 border border-neutral-800/50 hover:border-emerald-500/30 p-4 rounded-2xl transition-all flex flex-col gap-3 group">
                            <div className="flex items-center justify-between">
                               <div className="font-bold text-neutral-200 group-hover:text-emerald-400 transition-colors text-lg">{bp.name}</div>
                               <button onClick={() => handleUpvote(bp.id)} className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 bg-black/40 hover:bg-black/60 px-3 py-1.5 rounded-full border border-white/5 hover:border-red-500/30 transition-all active:scale-95 cursor-pointer">
                                  <Heart size={14} className="text-red-500/70" /> {bp.likes || 0}
                               </button>
                            </div>
                            <p className="text-sm text-neutral-400 leading-relaxed italic">{bp.description}</p>
                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-white/5">
                               <span className="text-xs text-neutral-500 flex items-center gap-1.5"><User size={12}/> By {bp.creatorName || 'Unknown'}</span>
                               <button onClick={() => { Sounds.click(); joinServer(bp.roomId); }} className="bg-emerald-600/20 hover:bg-emerald-500 hover:text-white text-emerald-400 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border border-emerald-500/20 hover:border-emerald-500">
                                  Join Instance
                               </button>
                            </div>
                         </div>
                      )) : <p className="text-neutral-600 text-sm italic">Loading blueprints...</p>}
                    </div>
                 </div>
               )}
             </div>
             
             <div className="mt-8 flex gap-3 shrink-0">
               <input
                 type="text"
                 value={serverInput}
                 onChange={(e) => setServerInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && joinServer()}
                 className="flex-1 bg-[#0A0A0B]/80 border border-neutral-800 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                 placeholder="Enter server address..."
               />
               <button
                 onClick={() => joinServer()}
                 className="bg-white hover:bg-neutral-200 text-black px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 flex items-center gap-2 text-lg"
               >
                 Join <ArrowRight size={20}/>
               </button>
             </div>
          </div>
          
          {/* Player Profile Manager */}
          <div className="w-full lg:w-80 flex-shrink-0 flex flex-col text-neutral-300 overflow-y-auto">
            <h2 className="text-2xl font-black text-white tracking-tight mb-8">My Profile</h2>
            
            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 flex items-center gap-2">
                   <User size={14} className="text-blue-500" /> Active Profile
                 </h3>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                 {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                          setActiveProfileId(p.id);
                          setNickname(p.name || 'Player');
                          setCharacterSkin(p.skin || 'orange');
                          if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                          if (p.backpack) setBackpack(JSON.parse(p.backpack));
                          if (p.health !== undefined) setHealth(p.health);
                          if (p.quests) setQuests(JSON.parse(p.quests));
                      }}
                      className={\`px-4 py-3 rounded-xl text-left text-sm font-bold border transition-all \${activeProfileId === p.id ? 'border-blue-500/50 bg-blue-900/20 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 bg-neutral-900/50'}\`}
                    >
                      {p.name || 'Unnamed'} {p.health <= 0 && <span className="text-red-500 font-normal text-xs ml-2">(Dead)</span>}
                    </button>
                 ))}
              </div>
              <div className="flex gap-2">
                 <button
                   onClick={async () => {
                      if (!currentUser) return;
                      const newId = 'prof_' + Date.now();
                      const newName = nickname || 'New Profile';
                      const newSkin = characterSkin || 'orange';
                      
                      const defaultHotbar = [
                         { type: 103 /* BlockType.Fists */, count: 1 },
                         { type: 302 /* BlockType.Gun */, count: 1 },
                         { type: 109 /* BlockType.Bow */, count: 1 },
                         { type: 304 /* BlockType.Grenade */, count: 64 },
                         { type: 34 /* BlockType.TNT */, count: 64 },
                         { type: 31 /* BlockType.Wire */, count: 64 },
                         { type: 32 /* BlockType.PressurePlate */, count: 64 },
                         { type: 100 /* BlockType.WoodPickaxe */, count: 1 },
                         { type: 28 /* BlockType.Platform */, count: 64 },
                         null
                      ];
                      
                      const newProfile = {
                         id: newId,
                         name: newName,
                         skin: newSkin,
                         health: 100,
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: Date.now()
                      };
                      
                      import('firebase/firestore').then(({ setDoc, doc, serverTimestamp }) => {
                          setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), { ...newProfile, updatedAt: serverTimestamp() });
                      });
                      
                      setProfiles([...profiles, newProfile]);
                      setActiveProfileId(newId);
                      setNickname(newName);
                      setCharacterSkin(newSkin);
                      setHotbar(defaultHotbar);
                      setBackpack(Array(27).fill(null));
                      setHealth(100);
                      setQuests([]);
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/30 bg-emerald-900/20 text-emerald-400 hover:bg-emerald-800/40 transition-all flex items-center justify-center gap-1 w-full"
                 >
                   <Plus size={14} /> New Profile
                 </button>
                 
                 <button
                   onClick={async () => {
                      if (!currentUser || !activeProfileId) return;
                      if (profiles.length <= 1) {
                          alert("You cannot delete your only profile.");
                          return;
                      }
                      if (!window.confirm("Are you sure you want to delete this profile? This action cannot be undone.")) return;
                      
                      const newProfiles = profiles.filter(p => p.id !== activeProfileId);
                      setProfiles(newProfiles);
                      
                      const newActive = newProfiles[0];
                      setActiveProfileId(newActive.id);
                      setNickname(newActive.name || 'Player');
                      setCharacterSkin(newActive.skin || 'orange');
                      if (newActive.hotbar) setHotbar(JSON.parse(newActive.hotbar));
                      if (newActive.backpack) setBackpack(JSON.parse(newActive.backpack));
                      if (newActive.health !== undefined) setHealth(newActive.health);
                      if (newActive.quests) setQuests(JSON.parse(newActive.quests));
                      
                      import('firebase/firestore').then(({ deleteDoc, doc }) => {
                          deleteDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId));
                      });
                   }}
                   className="px-4 py-2 rounded-xl text-sm font-bold border border-red-500/30 bg-red-900/20 text-red-400 hover:bg-red-800/40 transition-all flex items-center justify-center gap-1"
                 >
                   <X size={14} /> Delete
                 </button>
              </div>

              <div className="grid grid-cols-1 gap-6 mt-6">
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Display Name</label>
                  <input 
                     type="text" 
                     value={nickname}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNickname(val);
                      if (activeProfileId) {
                         setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, name: val } : p));
                      }
                    }}
                    className="w-full bg-[#0A0A0B]/80 border border-neutral-800 text-neutral-200 rounded-2xl pl-5 pr-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-neutral-700 transition-all shadow-inner text-lg placeholder-neutral-600"
                    placeholder="Enter Nickname..."
                    maxLength={16}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest pl-1 mb-2 block">Character Skin</label>
                  <div className="flex flex-wrap gap-2 pt-2">
                     {availableSkins.map(skin => (
                        <button 
                          key={skin.id}
                          onClick={() => {
                            setCharacterSkin(skin.id);
                            if (activeProfileId) {
                               setProfiles(profiles.map(p => p.id === activeProfileId ? { ...p, skin: skin.id } : p));
                            }
                          }}
                          className={\`w-10 h-10 rounded-full border-2 transition-all \${characterSkin === skin.id ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'}\`}
                          style={{ backgroundColor: skin.color }}
                          title={skin.name}
                        />
                     ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Heart size={14} className="text-red-500" /> Vitals
              </h3>
              <div className="flex items-center gap-1">
                {Array(5).fill(0).map((_, i) => (
                  <Heart key={i} size={20} className={i < Math.ceil(health / 2) ? 'text-red-500 fill-red-500' : 'text-neutral-800 fill-neutral-800'} />
                ))}
              </div>
              <div className="text-xs text-neutral-500 mt-2">{health} / 10 HP</div>
            </div>

            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800 mb-6">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Scroll size={14} className="text-amber-500" /> Quests Progress
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-neutral-300">Completed</span>
                  <span className="text-lg font-black text-white">{quests.filter(q => q.completed).length} <span className="text-neutral-600 text-sm font-medium">/ {quests.length}</span></span>
                </div>
                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: \`\${quests.length > 0 ? (quests.filter(q => q.completed).length / quests.length) * 100 : 0}%\` }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0A0B]/80 rounded-2xl p-6 border border-neutral-800">
              <h3 className="text-xs uppercase tracking-wider font-bold text-neutral-500 mb-4 flex items-center gap-2">
                <Book size={14} className="text-blue-500" /> Latest Log
              </h3>
              <div className="text-sm text-neutral-400">
                You are currently placed in <span className="text-blue-400 font-bold">{saveStateRef.current.serverName || 'public-lobby'}</span>.
              </div>
            </div>
            
            {isAdmin && (
              <div className="bg-red-900/20 rounded-2xl p-6 border border-red-900/50 mt-6">
                <h3 className="text-xs uppercase tracking-wider font-bold text-red-500 mb-4 flex items-center gap-2">
                  <Shield size={14} className="text-red-500" /> Admin Tools
                </h3>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleAdminClick('Wipe World Data')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">Wipe Targeted World</button>
                  <button onClick={() => handleAdminClick('Manage Players')} className="bg-red-600/20 hover:bg-red-600/40 text-red-400 py-2 rounded-lg text-sm font-bold border border-red-500/30 transition-colors">Manage Players</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  `;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);
