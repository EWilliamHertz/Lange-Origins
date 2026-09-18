with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

content = content.replace("ctx.drawImage(getBlockImage(tool), 0, -16, 16, 16);", "ctx.fillStyle = BlockColors[tool] || '#ccc'; ctx.fillRect(0, -16, 16, 16);")

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
