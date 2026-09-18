import re
with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Add keybinds to GameProps
content = re.sub(r'(interface GameProps \{)', r'\1\n  keybinds: Record<string, string>;', content)

# Add keybinds to component props
content = re.sub(r'(currentAmmoCount, duelingOpponents, skills, mana, onManaChange, onToolDurabilityLoss)', r'\1, keybinds', content)

# Add keybinds to propsRef
content = re.sub(r'(helmet, chestplate, skills, mana, onManaChange, onToolDurabilityLoss)', r'\1, keybinds', content)

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
