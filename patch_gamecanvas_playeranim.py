import re
with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

player_anim_handler = """    socket.on('player_anim', (data: { id: string, anim: string }) => {
      const p = gameState.current.otherPlayers[data.id];
      if (p) {
          if (data.anim === 'slash') (p as any).slashAnim = 15;
          if (data.anim === 'heal') (p as any).healAnim = 30;
      }
    });"""

content = content.replace("    socket.on('heal', (data: { amount: number }) => {", player_anim_handler + "\n    socket.on('heal', (data: { amount: number }) => {")

# Ensure otherPlayers slashAnim is decremented
content = content.replace("        for (const pId in state.otherPlayers) {", "        for (const pId in state.otherPlayers) {\n           const p = state.otherPlayers[pId] as any;\n           if (p.slashAnim > 0) p.slashAnim -= 1;\n           if (p.healAnim > 0) p.healAnim -= 1;")

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
