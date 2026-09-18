lines = open('src/App.tsx').read().split('\n')
for i in range(len(lines)):
    if "const [characterSkin, setCharacterSkin] = useState<string>('orange');" in lines[i]:
        lines.insert(i+1, "  const [playerClass, setPlayerClass] = useState<string>('warrior');")
        break

for i in range(len(lines)):
    if "setCharacterSkin(p.skin || 'orange');" in lines[i]:
        lines.insert(i+1, "                          setPlayerClass(p.playerClass || 'warrior');")
    if "setCharacterSkin(newActive.skin || 'orange');" in lines[i]:
        lines.insert(i+1, "                      setPlayerClass(newActive.playerClass || 'warrior');")
    if "const newSkin = characterSkin || 'orange';" in lines[i]:
        lines.insert(i+1, "                      const newClass = playerClass || 'warrior';")
    if "skin: newSkin," in lines[i]:
        lines.insert(i+1, "                         playerClass: newClass,")
    if "setCharacterSkin(newSkin);" in lines[i] and "setActiveProfileId(newId);" in lines[i-2]:
        lines.insert(i+1, "                      setPlayerClass(newClass);")

open('src/App.tsx', 'w').write('\n'.join(lines))
