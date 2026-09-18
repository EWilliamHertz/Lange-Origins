import re

with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

content = content.replace("const ATTACK_RANGE = 64;", "const ATTACK_RANGE = 120;")
with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)

with open('server.ts', 'r') as f:
    content = f.read()

content = content.replace("const range = 60;", "const range = 120;")
with open('server.ts', 'w') as f:
    f.write(content)

