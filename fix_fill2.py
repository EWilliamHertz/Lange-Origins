with open('src/components/GameCanvas.tsx', 'r') as f:
    content = f.read()

# Replace exactly what I added
content = content.replace("ctx.fill();\n        }", "ctx.fill();")
content = content.replace("ctx.fill();n        }", "ctx.fill();") # Just in case

with open('src/components/GameCanvas.tsx', 'w') as f:
    f.write(content)
