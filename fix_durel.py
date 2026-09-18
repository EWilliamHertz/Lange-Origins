lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const [showNPCMessage, setShowNPCMessage] = useState(false);" in lines[i]:
        lines[i] = "  const [npcDialog, setNpcDialog] = useState<{name: string, text: string, color: string, ringColor: string} | null>(null);"
    if "if (showNPCMessage) {" in lines[i]:
        lines[i] = "        if (npcDialog) {"
    if "setShowNPCMessage(false);" in lines[i]:
        lines[i] = "          setNpcDialog(null);"
    if "!showNPCMessage" in lines[i]:
        lines[i] = lines[i].replace("!showNPCMessage", "!npcDialog")
        
    if "setShowNPCMessage(true);" in lines[i]:
        lines[i] = "              let color = 'bg-pink-500'; let textColor = 'text-pink-400'; let name = 'Guide';"
        lines.insert(i+1, "              if (blockType === BlockType.GoblinNPC) { color = 'bg-green-500'; textColor = 'text-green-400'; name = 'Goblin Trader'; }")
        lines.insert(i+2, "              if (blockType === BlockType.WizardNPC) { color = 'bg-purple-500'; textColor = 'text-purple-400'; name = 'Wizard'; }")
        lines.insert(i+3, "              if (blockType === BlockType.QuestNPC) { color = 'bg-amber-500'; textColor = 'text-amber-400'; name = 'Quest Master'; }")
        lines.insert(i+4, "              setNpcDialog({ name, text: 'Hello traveler! The world is dangerous, but full of riches. Check your Quest Log (Press Q) to see what you should do next!', color, ringColor: textColor });")
    if "alert(\"DUREL: YOU HAVE SLAIN: \" + (killMsg || \"NOTHING YET!\"));" in lines[i]:
        lines[i] = "              setNpcDialog({ name: 'DUREL', text: 'YOU HAVE SLAIN: ' + (killMsg || 'NOTHING YET!'), color: 'bg-red-600', ringColor: 'text-red-500' });"
    if "{showNPCMessage && (" in lines[i]:
        lines[i] = "        {npcDialog && ("
    if "<div className=\"w-8 h-8 rounded-full bg-pink-500\"></div>" in lines[i]:
        lines[i] = "                 <div className={`w-8 h-8 rounded-full ${npcDialog.color}`}></div>"
    if "<h3 className=\"text-pink-400 font-black text-xl mb-1 uppercase tracking-wider\">Guide</h3>" in lines[i]:
        lines[i] = "                 <h3 className={`${npcDialog.ringColor} font-black text-xl mb-1 uppercase tracking-wider`}>{npcDialog.name}</h3>"
    if "Hello traveler! The world is dangerous, but full of riches. Check your <span className=\"text-amber-400 font-bold\">Quest Log (Press Q)</span> to see what you should do next!" in lines[i]:
        lines[i] = "                   {npcDialog.text}"
    if "<button onClick={() => setShowNPCMessage(false)}" in lines[i]:
        lines[i] = "                 <button onClick={() => setNpcDialog(null)} className=\"mt-4 text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full transition-colors\">Close</button>"

open('src/App.tsx', 'w').write('\n'.join(lines))
