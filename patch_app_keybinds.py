import re
with open('src/App.tsx', 'r') as f:
    content = f.read()

state_match = "  const [health, setHealth] = useState(10);"
new_state = "  const [health, setHealth] = useState(10);\n  const [keybinds, setKeybinds] = useState<Record<string, string>>({'z':'slash'});"
content = content.replace(state_match, new_state)

# Let's save and load keybinds!
content = content.replace("xp, level, skillPoints, skills", "xp, level, skillPoints, skills, keybinds")
content = content.replace("if (active.health !== undefined) setHealth(active.health);", "if (active.health !== undefined) setHealth(active.health);\n              if (active.keybinds) setKeybinds(JSON.parse(active.keybinds));")
content = content.replace("quests: JSON.stringify(latest.quests),", "quests: JSON.stringify(latest.quests),\n        keybinds: JSON.stringify(latest.keybinds),")
content = content.replace("if (newActive.health !== undefined) setHealth(newActive.health);", "if (newActive.health !== undefined) setHealth(newActive.health);\n                      if (newActive.keybinds) setKeybinds(JSON.parse(newActive.keybinds));")
content = content.replace("if (p.health !== undefined) setHealth(p.health);", "if (p.health !== undefined) setHealth(p.health);\n                          if (p.keybinds) setKeybinds(JSON.parse(p.keybinds));")


with open('src/App.tsx', 'w') as f:
    f.write(content)
