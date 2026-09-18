lines = open('src/components/GameCanvas.tsx').read().split('\n')
new_lines = []
skip_next = False
for i in range(len(lines)):
    if skip_next:
        skip_next = False
        continue
    line = lines[i]
    new_lines.append(line)
    if "ctx.fill();" in line and i + 1 < len(lines) and lines[i+1].strip() == "}":
        # Check if the next line is literally just "}" with spaces
        # Wait, not ALL of them should be removed!
        pass

# Actually, the easiest way is just to remove ALL '}' that follow 'ctx.fill();' if they were added by my sed!
