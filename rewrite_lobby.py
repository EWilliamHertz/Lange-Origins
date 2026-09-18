import re

with open('src/App.tsx', 'r') as f:
    lines = f.read().split('\n')

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "if (appState === 'serverBrowser') {" in line:
        start_idx = i
        break

if start_idx != -1:
    brace_count = 0
    in_block = False
    for i in range(start_idx, len(lines)):
        line = lines[i]
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if not in_block and brace_count > 0:
            in_block = True
        
        if in_block and brace_count == 0:
            end_idx = i
            break

print(f"Replacing lines {start_idx} to {end_idx}")

new_code = """
  if (appState === 'serverBrowser') {
    const isAdmin = currentUser && (currentUser.email === 'ewilliamhe@gmail.com' || currentUser.email === 'zudran@gmail.com');

    const handleAdminClick = async (action: string) => {
      if (!currentUser) return;
      try {
        if (action === 'Wipe World Data') {
          const roomToWipe = window.prompt('Enter the name of the server/room to wipe (leave blank for public-lobby):') || 'public-lobby';
          if (!window.confirm(`Are you sure you want to wipe "${roomToWipe}"? This cannot be undone.`)) return;
          const res = await fetch('/api/admin/wipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email, roomId: roomToWipe })
          });
          const data = await res.json();
          if (data.success) {
            alert(`World "${roomToWipe}" wiped successfully!`);
          } else {
            alert('Failed to wipe world: ' + data.error);
          }
        } else if (action === 'Manage Players') {
          const res = await fetch('/api/admin/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentUser.email })
          });
          const data = await res.json();
          if (data.players && data.players.length > 0) {
            const playerList = data.players.map((p: any) => `Room: ${p.roomId} | ID: ${p.id}`).join('\\n');
            const toKick = window.prompt(`Connected Players:\\n${playerList}\\n\\nEnter ID to kick:`);
            if (toKick) {
              const kickRes = await fetch('/api/admin/kick', { 
                 method: 'POST', 
                 headers: { 'Content-Type': 'application/json' }, 
                 body: JSON.stringify({ email: currentUser.email, playerId: toKick }) 
              });
              const kickData = await kickRes.json();
              if (kickData.success) alert('Player kicked.');
              else alert('Failed to kick: ' + kickData.error);
            }
          } else {
            alert('No players currently connected.');
          }
        } else {
          alert(`Admin action: [${action}] is not implemented.`);
        }
      } catch (err) {
        console.error(err);
        alert('Admin action failed. Check console.');
      }
    };

    return (
      <div className="w-full h-screen bg-[#030305] text-white flex overflow-hidden font-sans relative selection:bg-indigo-500/30">
        {/* Modern Animated Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-indigo-600/20 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none"></div>

        {/* Top Navbar */}
        <div className="absolute top-0 left-0 right-0 h-20 px-8 flex items-center justify-between z-50 border-b border-white/5 bg-[#030305]/50 backdrop-blur-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <Globe size={20} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              LangeOrigins
            </h1>
          </div>
          
          {currentUser && (
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full py-1.5 px-2 backdrop-blur-md">
               <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName}`} alt="avatar" className="w-8 h-8 rounded-full border border-white/20" />
               <span className="text-sm font-semibold pr-2 hidden md:block text-white/80">{currentUser.displayName}</span>
               <button onClick={handleSignOut} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-1.5 rounded-full text-xs font-bold transition-all">Sign Out</button>
            </div>
          )}
        </div>

        {/* Main Content Layout - Bento Grid */}
        <div className="w-full h-full pt-28 pb-8 px-8 flex flex-col lg:flex-row gap-6 z-10 max-w-[1600px] mx-auto">
          
          {/* LEFT PANEL: WORLD BROWSER */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            
            {/* Header Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-2xl w-fit backdrop-blur-md">
               <button 
                 onClick={() => setLobbyTab('play')}
                 className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all ${lobbyTab === 'play' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
               >
                 Servers
               </button>
               <button 
                 onClick={() => setLobbyTab('marketplace')}
                 className={`px-6 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center gap-2 ${lobbyTab === 'marketplace' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/80 hover:bg-white/5'}`}
               >
                 <ShoppingBag size={16}/> Blueprints
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-2">
              {lobbyTab === 'play' ? (
                <>
                  {/* Join Private Server */}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Compass size={16} className="text-indigo-400" /> Direct Connect
                    </h3>
                    <div className="flex gap-3 relative z-10">
                      <input
                        type="text"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && joinServer(joinInput)}
                        className="flex-1 bg-black/40 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 transition-all text-lg placeholder-white/20"
                        placeholder="Enter server address..."
                      />
                      <button
                        onClick={() => joinServer(joinInput)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 flex items-center gap-2"
                      >
                        Join <ArrowRight size={20}/>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Favorites */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col h-[300px]">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                        <Star size={16} className="text-amber-400" /> Favorites
                      </h3>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {favoriteServers.length > 0 ? favoriteServers.map(srv => (
                          <div key={srv} onClick={() => joinServer(srv)} className="bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                            <span className="font-bold text-white/80 group-hover:text-white transition-colors">{srv}</span>
                            <button onClick={(e) => toggleFavorite(srv, e)} className="text-amber-500 hover:text-amber-400 p-1">
                              <Star size={16} fill="currentColor" />
                            </button>
                          </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                            <Star size={32} className="mb-2 opacity-50" />
                            <p className="text-sm font-medium">No favorites yet.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Public Realms */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col h-[300px]">
                      <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                        <Globe size={16} className="text-blue-400" /> Public Realms
                      </h3>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {publicServers.length > 0 ? publicServers.map(srv => (
                          <div key={srv.id} onClick={() => joinServer(srv.id)} className="bg-black/40 hover:bg-white/10 border border-white/5 hover:border-white/20 p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between group">
                            <div>
                              <div className="font-bold text-white/80 group-hover:text-white transition-colors flex items-center gap-2">
                                {srv.id} {srv.id === 'public-lobby' && <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">OFFICIAL</span>}
                              </div>
                              <div className="text-xs text-white/40 mt-1 flex items-center gap-1.5"><User size={12} /> {srv.players} online</div>
                            </div>
                            <button onClick={(e) => toggleFavorite(srv.id, e)} className="text-white/20 hover:text-amber-500 p-1 transition-colors">
                              <Star size={16} fill={favoriteServers.includes(srv.id) ? "currentColor" : "none"} />
                            </button>
                          </div>
                        )) : (
                          <div className="h-full flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl">
                             <p className="text-sm font-medium">No public servers found.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-6 h-full">
                  <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/20 border border-emerald-500/20 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                     <div>
                       <h4 className="text-2xl font-black text-white mb-2 tracking-tight">Share Your Realm</h4>
                       <p className="text-emerald-100/60 max-w-md">Publish your current world blueprint so others can explore your creations and minigames.</p>
                     </div>
                     <button onClick={() => publishBlueprint()} className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-black transition-all active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)] whitespace-nowrap">
                       Publish World
                     </button>
                  </div>
                  
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col">
                    <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4 flex items-center gap-2 shrink-0">
                      <LayoutGrid size={16} className="text-emerald-400" /> Community Blueprints
                    </h3>
                    <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pr-2 custom-scrollbar">
                      {marketBlueprints.length > 0 ? marketBlueprints.map(bp => (
                         <div key={bp.id} className="bg-black/40 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 p-5 rounded-2xl transition-all flex flex-col gap-4 group cursor-pointer" onClick={() => joinServer(bp.roomId)}>
                            <div className="flex items-center justify-between">
                               <div className="font-bold text-white group-hover:text-emerald-300 transition-colors text-lg truncate">{bp.name}</div>
                               <button onClick={(e) => { e.stopPropagation(); handleUpvote(bp.id); }} className="flex items-center gap-1.5 text-xs font-bold text-white/40 hover:text-red-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 hover:border-red-500/30 transition-all active:scale-95">
                                  <Heart size={14} className={bp.likes ? "text-red-500" : ""} fill={bp.likes ? "currentColor" : "none"} /> {bp.likes || 0}
                               </button>
                            </div>
                            <p className="text-sm text-white/50 leading-relaxed italic line-clamp-2 flex-1">{bp.description}</p>
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                               <span className="text-xs text-white/40 flex items-center gap-1.5"><User size={12}/> {bp.creatorName || 'Unknown'}</span>
                               <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-1">Play <ArrowRight size={12}/></span>
                            </div>
                         </div>
                      )) : (
                        <div className="col-span-1 md:col-span-2 h-full flex items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-2xl min-h-[200px]">
                          Loading blueprints...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: PROFILE */}
          <div className="w-full lg:w-[400px] flex flex-col gap-6 shrink-0 h-full overflow-hidden">
            
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md flex flex-col">
              <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6 flex items-center gap-2">
                <User size={16} className="text-purple-400" /> Character Profile
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-6">
                 {profiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                          setActiveProfileId(p.id);
                          setNickname(p.name || 'Player');
                          setCharacterSkin(p.skin || 'orange');
                          setPlayerClass(p.playerClass || 'warrior');
                          if (p.hotbar) setHotbar(JSON.parse(p.hotbar));
                          if (p.leftActionBar) setLeftActionBar(JSON.parse(p.leftActionBar));
                          if (p.rightActionBar) setRightActionBar(JSON.parse(p.rightActionBar));
                          if (p.backpack) setBackpack(JSON.parse(p.backpack));
                          if (p.health !== undefined) setHealth(p.health);
                          if (p.keybinds) setKeybinds(JSON.parse(p.keybinds));
                          if (p.quests) setQuests(JSON.parse(p.quests));
                          if (p.xp !== undefined) setXp(p.xp);
                          if (p.level !== undefined) setLevel(p.level);
                          if (p.skillPoints !== undefined) setSkillPoints(p.skillPoints);
                          if (p.skills) setSkills(JSON.parse(p.skills));
                          if (p.kills !== undefined) setKills(p.kills);
                      }}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${activeProfileId === p.id ? 'border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-lg text-white">{p.name || 'Unnamed'}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${p.health <= 0 ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'}`}>
                          {p.health <= 0 ? 'DEAD' : 'ALIVE'}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white/50 capitalize">
                        Level {p.level || 1} • {p.playerClass || 'Warrior'}
                      </div>
                    </button>
                 ))}
              </div>

              <div className="pt-4 border-t border-white/5">
                 <button
                   onClick={async () => {
                      if (!currentUser) return;
                      const newId = 'prof_' + Date.now();
                      const newName = nickname || 'New Profile';
                      const newSkin = characterSkin || 'orange';
                      const newClass = playerClass || 'warrior';
                      
                      const defaultHotbar = [
                         { type: 103, count: 1 },
                         null, null, null, null, null, null, null, null, null
                      ];
                      
                      const newProfile = {
                         id: newId,
                         name: newName,
                         skin: newSkin,
                         playerClass: newClass,
                         health: 100,
                         hotbar: JSON.stringify(defaultHotbar),
                         backpack: JSON.stringify(Array(27).fill(null)),
                         quests: JSON.stringify([]),
                         updatedAt: Date.now()
                      };
                      
                      setDoc(doc(db, 'users', currentUser.uid, 'profiles', newId), { ...newProfile, updatedAt: serverTimestamp() });
                      
                      setProfiles([...profiles, newProfile]);
                      setActiveProfileId(newId);
                      setNickname(newName);
                      setCharacterSkin(newSkin);
                      setPlayerClass(newClass);
                      setHotbar(defaultHotbar);
                      setLeftActionBar(Array(10).fill(null));
                      setRightActionBar(Array(10).fill(null));
                      setBackpack(Array(27).fill(null));
                      setHealth(20);
                      setKills(0);
                      setXp(0);
                      setLevel(1);
                      setSkillPoints(0);
                      setSkills({ strength: 0, dexterity: 0, intelligence: 0 });
                      setQuests(defaultQuests);
                   }}
                   className="w-full py-3.5 rounded-2xl text-sm font-bold border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-inner"
                 >
                   <Plus size={16} /> Create New Character
                 </button>
                 {/* REMOVED: Delete Button */}
              </div>
            </div>

            {/* Profile Settings Editor */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-md shrink-0">
               <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-4">Edit Appearance</h3>
               
               <div className="space-y-4">
                 <div>
                   <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Display Name</label>
                   <div className="flex gap-2">
                     <input
                         type="text"
                         value={nickname}
                         onChange={(e) => {
                             setNickname(e.target.value);
                             if (activeProfileId && currentUser) {
                                 setDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId), { name: e.target.value }, { merge: true });
                                 setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, name: e.target.value } : p));
                             }
                         }}
                         className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-white text-sm"
                         placeholder="Character Name..."
                     />
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Class</label>
                     <select 
                       value={playerClass}
                       onChange={(e) => {
                           setPlayerClass(e.target.value);
                           if (activeProfileId && currentUser) {
                               setDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId), { playerClass: e.target.value }, { merge: true });
                               setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, playerClass: e.target.value } : p));
                           }
                       }}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-3 focus:outline-none focus:border-purple-500/50 transition-colors text-white text-sm appearance-none"
                     >
                       <option value="warrior">Warrior</option>
                       <option value="mage">Mage</option>
                       <option value="archer">Archer</option>
                     </select>
                   </div>
                   
                   <div>
                     <label className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 block">Color</label>
                     <div className="flex flex-wrap gap-2 pt-1">
                       {['#f97316', '#3b82f6', '#10b981', '#a855f7', '#ef4444', '#eab308'].map(color => (
                         <button
                           key={color}
                           onClick={() => {
                               setCharacterSkin(color);
                               if (activeProfileId && currentUser) {
                                   setDoc(doc(db, 'users', currentUser.uid, 'profiles', activeProfileId), { skin: color }, { merge: true });
                                   setProfiles(prev => prev.map(p => p.id === activeProfileId ? { ...p, skin: color } : p));
                               }
                           }}
                           className={`w-8 h-8 rounded-full border-2 transition-transform ${characterSkin === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-110'}`}
                           style={{ backgroundColor: color }}
                         />
                       ))}
                     </div>
                   </div>
                 </div>
               </div>
            </div>

            {isAdmin && (
              <button onClick={() => setShowAdminPanel(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-3xl text-sm font-bold border border-red-500/20 transition-all w-full flex justify-center items-center gap-2 backdrop-blur-md shrink-0">
                <Shield size={18} /> Open Admin Panel
              </button>
            )}
            {isAdmin && showAdminPanel && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md">
                 <div className="bg-[#0A0A0C] p-8 rounded-[2rem] border border-red-900/50 shadow-2xl max-w-md w-full relative">
                    <button onClick={() => setShowAdminPanel(false)} className="absolute top-6 right-6 text-white/40 hover:text-white">
                       <X size={24} />
                    </button>
                    <h2 className="text-2xl font-black text-red-400 mb-6 flex items-center gap-3">
                      <Shield size={28} /> Admin Dashboard
                    </h2>
                    <div className="flex flex-col gap-4">
                      <button onClick={() => handleAdminClick('Wipe World Data')} className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-300 py-3 rounded-xl text-sm font-bold border border-white/10 hover:border-red-500/30 transition-all">Wipe Targeted World</button>
                      <button onClick={() => handleAdminClick('Manage Players')} className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-300 py-3 rounded-xl text-sm font-bold border border-white/10 hover:border-red-500/30 transition-all">Manage Players</button>
                    </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
"""

lines = lines[:start_idx] + new_code.split('\n') + lines[end_idx+1:]
with open('src/App.tsx', 'w') as f:
    f.write('\n'.join(lines))

print("Rewrite complete.")
