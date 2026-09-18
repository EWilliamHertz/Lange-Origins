import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add showTutorial state
content = content.replace("const [showInstructions, setShowInstructions] = useState(false);", "const [showInstructions, setShowInstructions] = useState(false);\n  const [showTutorial, setShowTutorial] = useState(false);")

# trigger tutorial on join
join_server = """      setAppLoading(false);
      
      if (quests.length > 0 && quests[0].current === 0 && !quests[0].completed) {
          setShowTutorial(true);
      }"""
content = content.replace("      setAppLoading(false);", join_server)

# Render tutorial
tutorial_ui = """      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-[#0A0A0B] border border-emerald-500/30 p-8 rounded-3xl max-w-2xl w-full relative shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <button onClick={() => setShowTutorial(false)} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-3xl font-black text-white mb-6">Welcome to the World!</h2>
                
                <div className="space-y-6 text-neutral-300">
                    <div className="flex gap-4">
                        <div className="bg-neutral-900 p-3 rounded-xl h-fit border border-neutral-800">
                            <Pickaxe className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-emerald-400 mb-1">Gather & Craft</h3>
                            <p className="text-sm leading-relaxed">Break blocks like Dirt, Wood, and Stone to gather materials. Press <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">E</span> to open your inventory and craft new tools, weapons, and armor to survive.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-neutral-900 p-3 rounded-xl h-fit border border-neutral-800">
                            <Sword className="text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-amber-400 mb-1">Combat & Leveling</h3>
                            <p className="text-sm leading-relaxed">Defeat monsters (Slimes, Skeletons, Zombies) to earn XP. As you level up, open the <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">Skills & Stats</span> tab in your inventory to increase your Strength, Dexterity, or Intelligence.</p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="bg-neutral-900 p-3 rounded-xl h-fit border border-neutral-800">
                            <Flame className="text-cyan-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-cyan-400 mb-1">Abilities & Hotkeys</h3>
                            <p className="text-sm leading-relaxed">Everyone starts with the <strong className="text-white">Slash</strong> ability. Open the <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">Skills & Stats</span> tab, hover over an ability, and press a key (like <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">Z</span>, <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">X</span>, or <span className="bg-neutral-800 px-1.5 py-0.5 rounded text-white font-mono text-xs">1-9</span>) to bind it. Use them in combat!</p>
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={() => setShowTutorial(false)}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-8 transition-colors text-lg"
                >
                    Start Adventure
                </button>
            </div>
        </div>
      )}"""

content = content.replace("{/* Profile Modal */}", tutorial_ui + "\n      {/* Profile Modal */}")

with open('src/App.tsx', 'w') as f:
    f.write(content)
