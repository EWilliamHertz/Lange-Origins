with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Change the injected `const p` to `const __p` to avoid collision
content = content.replace(
"""        for (const pId in state.otherPlayers) {
           const p = state.otherPlayers[pId] as any;
           if (p.slashAnim > 0) p.slashAnim -= 1;
           if (p.healAnim > 0) p.healAnim -= 1;""",
"""        for (const pId in state.otherPlayers) {
           const __p = state.otherPlayers[pId] as any;
           if (__p.slashAnim > 0) __p.slashAnim -= 1;
           if (__p.healAnim > 0) __p.healAnim -= 1;""")

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
