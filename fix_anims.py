lines = open('src/components/GameCanvas.tsx').read().split('\n')
for i in range(len(lines)):
    if "playSound('slash');" in lines[i]:
        lines[i] = lines[i].replace("playSound('slash');", "Sounds.sword();")
    if "playSound('fireball');" in lines[i]:
        lines[i] = lines[i].replace("playSound('fireball');", "Sounds.fireball();")
    if "playSound('heal');" in lines[i]:
        lines[i] = lines[i].replace("playSound('heal');", "Sounds.heal();")
    if "state.slashAnim = 15;" in lines[i]:
        lines[i] = lines[i].replace("state.slashAnim = 15;", "player.slashAnim = 15;")

# Add decrementing for player.slashAnim and player.healAnim in main loop
for i in range(840, 860):
    if "if (state.globalCooldown > 0) state.globalCooldown -= dt;" in lines[i]:
        lines.insert(i, "      if (player.slashAnim > 0) player.slashAnim -= 1;")
        lines.insert(i+1, "      if (player.healAnim > 0) player.healAnim -= 1;")
        break

open('src/components/GameCanvas.tsx', 'w').write('\n'.join(lines))
